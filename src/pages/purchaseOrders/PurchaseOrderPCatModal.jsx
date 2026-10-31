import React, { useState, useRef, useMemo, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import api from '../../services/api';
import {
  useGetPurchaseOrderPCatDocumentsQuery,
  useUploadPurchaseOrderPCatDocumentsMutation,
  useDeletePurchaseOrderPCatDocumentMutation,
} from '../../features/purchase/purchaseApi';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
  Download,
  Eye,
  Trash2,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Paperclip,
  Clock,
  User,
  HardDrive
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xls', 'xlsx'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileTypeDetails = (ext = '') => {
  const cleanExt = String(ext).toLowerCase().replace('.', '');
  switch (cleanExt) {
    case 'pdf':
      return { label: 'PDF', bg: 'bg-red-50 text-red-700 border-red-200', icon: FileText };
    case 'doc':
    case 'docx':
      return { label: cleanExt.toUpperCase(), bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileCode };
    case 'xls':
    case 'xlsx':
      return { label: cleanExt.toUpperCase(), bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet };
    case 'jpg':
    case 'jpeg':
    case 'png':
      return { label: cleanExt.toUpperCase(), bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: FileImage };
    default:
      return { label: cleanExt ? cleanExt.toUpperCase() : 'DOC', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: File };
  }
};

const PurchaseOrderPCatModal = ({ purchaseOrder, isOpen, onClose }) => {
  const fileInputRef = useRef(null);

  const poId = purchaseOrder?._id;
  const poNumber = purchaseOrder?.poNumber || 'PO';

  const {
    data: pcatData,
    isLoading: loadingDocs,
    isFetching: fetchingDocs,
    refetch
  } = useGetPurchaseOrderPCatDocumentsQuery(poId, {
    skip: !isOpen || !poId,
  });

  const [uploadDocumentsMutation, { isLoading: isUploading }] = useUploadPurchaseOrderPCatDocumentsMutation();
  const [deleteDocumentMutation, { isLoading: isDeleting }] = useDeletePurchaseOrderPCatDocumentMutation();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  // Clean up object URL when component unmounts or blob URL changes
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        window.URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  const documents = useMemo(() => {
    return pcatData?.documents || [];
  }, [pcatData]);

  const handleFilesChosen = (fileList) => {
    setErrorMsg('');
    setSuccessMsg('');
    const newFiles = Array.from(fileList || []);
    if (newFiles.length === 0) return;

    const validFiles = [];
    const rejectedFiles = [];

    newFiles.forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        rejectedFiles.push(`${file.name} (unsupported format)`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFiles.push(`${file.name} (exceeds 15MB limit)`);
        return;
      }
      validFiles.push(file);
    });

    if (rejectedFiles.length > 0) {
      setErrorMsg(`Could not attach: ${rejectedFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one file to upload.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const res = await uploadDocumentsMutation({
        purchaseOrderId: poId,
        formData
      }).unwrap();

      setSuccessMsg(res?.message || `Successfully uploaded ${selectedFiles.length} P-CAT document(s).`);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('P-CAT Upload error:', err);
      setErrorMsg(err?.data?.message || err?.message || 'Failed to upload documents.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await deleteDocumentMutation({
        purchaseOrderId: poId,
        documentId: deleteCandidate._id
      }).unwrap();

      setSuccessMsg(res?.message || 'Document deleted successfully.');
      setDeleteCandidate(null);
    } catch (err) {
      console.error('P-CAT Delete error:', err);
      setErrorMsg(err?.data?.message || err?.message || 'Failed to delete document.');
    }
  };

  const handleOpenPreview = async (doc) => {
    if (!doc) return;
    setPreviewDoc(doc);
    setPreviewError(null);

    // Clean up previous blob URL if any
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    const format = (doc.fileFormat || '').toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(format);
    const isPdf = format === 'pdf' || (doc.mimeType && doc.mimeType.includes('pdf'));

    if (isPdf || isImage) {
      setPreviewLoading(true);
      try {
        const res = await api.get(
          `/purchase-orders/${poId}/pcat-documents/${doc._id}/preview`,
          { responseType: 'blob' }
        );
        const resolvedMime = isPdf
          ? 'application/pdf'
          : (doc.mimeType || (format === 'png' ? 'image/png' : 'image/jpeg'));
        const blob = new Blob([res.data], { type: resolvedMime });
        const objectUrl = window.URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);
      } catch (err) {
        console.error('Failed to load document preview:', err);
        setPreviewError('Failed to load preview for this document. You can still download it directly.');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewDoc(null);
    setPreviewError(null);
    setPreviewLoading(false);
  };

  const handleDownload = async (doc) => {
    if (!doc?._id) return;
    try {
      setDownloadingDocId(doc._id);
      const res = await api.get(
        `/purchase-orders/${poId}/pcat-documents/${doc._id}/download`,
        { responseType: 'blob' }
      );
      const mimeType = doc.mimeType || 'application/octet-stream';
      const blob = new Blob([res.data], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', doc.originalFileName || doc.fileName || 'pcat_document');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      console.error('Failed to download document:', err);
      setErrorMsg('Failed to download document. Please try again.');
    } finally {
      setDownloadingDocId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`P-CAT Documents — ${poNumber}`}
        maxWidth="840px"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500 font-medium">
              Common Storage: <span className="font-mono text-slate-700 font-semibold">netfil-erp/p-cat/</span>
            </span>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* PO Context Header */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-mono text-sm">{poNumber}</span>
              {purchaseOrder?.supplierNameSnapshot && (
                <span className="text-slate-600 font-medium border-l border-slate-300 pl-2">
                  Supplier: <strong className="text-slate-800">{purchaseOrder.supplierNameSnapshot}</strong>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <Paperclip size={12} className="mr-1" />
                {documents.length} {documents.length === 1 ? 'P-CAT Document' : 'P-CAT Documents'}
              </span>
            </div>
          </div>

          {errorMsg && <Alert type="danger" message={errorMsg} onClose={() => setErrorMsg('')} />}
          {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

          {/* UPLOAD SECTION: Drag-and-Drop + File Selector */}
          <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud size={16} className="text-blue-600" />
                Upload P-CAT Document(s)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Max 15MB per file • Multiple files supported
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesChosen(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                className="hidden"
                onChange={(e) => handleFilesChosen(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Click to browse or drag and drop P-CAT files here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supported: PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, XLSX
                  </p>
                </div>
              </div>
            </div>

            {/* Selected files staging preview */}
            {selectedFiles.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Selected Files to Upload ({selectedFiles.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-slate-400 hover:text-slate-600 text-[11px] font-medium"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
                  {selectedFiles.map((f, idx) => {
                    const ext = f.name.split('.').pop();
                    const typeInfo = getFileTypeDetails(ext);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div key={idx} className="flex items-center justify-between pt-1.5 first:pt-0 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <TypeIcon size={14} className="text-slate-500 shrink-0" />
                          <span className="font-medium text-slate-800 truncate" title={f.name}>
                            {f.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            ({formatFileSize(f.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSelectedFile(idx);
                          }}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={UploadCloud}
                    loading={isUploading}
                    onClick={handleUploadSubmit}
                  >
                    Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Document' : 'Documents'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* DOCUMENTS LIST SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={15} className="text-blue-600" />
                Uploaded P-CAT Documents ({documents.length})
              </h4>
              {fetchingDocs && (
                <span className="text-[11px] text-slate-400 animate-pulse flex items-center gap-1">
                  <Clock size={11} /> Refreshing...
                </span>
              )}
            </div>

            {loadingDocs ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                Loading P-CAT documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Paperclip size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-700">No Documents Uploaded</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  No P-CAT documents have been uploaded for Purchase Order {poNumber} yet. Use the upload box above to add relevant documents.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full border-collapse text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-3.5 py-2.5 min-w-[200px]">Document Name</th>
                      <th className="px-3 py-2.5 w-24">File Type</th>
                      <th className="px-3 py-2.5 w-24">File Size</th>
                      <th className="px-3 py-2.5 min-w-[140px]">Uploaded By</th>
                      <th className="px-3 py-2.5 w-32">Upload Date</th>
                      <th className="px-3 py-2.5 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => {
                      const typeInfo = getFileTypeDetails(doc.fileFormat);
                      const TypeIcon = typeInfo.icon;
                      const uploaderName = doc.uploadedBy?.fullName || doc.uploadedBy?.username || 'User';

                      return (
                        <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <TypeIcon size={16} className="text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-900 truncate max-w-xs" title={doc.originalFileName}>
                                {doc.originalFileName}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${typeInfo.bg}`}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600 text-[11.5px]">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-slate-400" />
                              <span className="truncate max-w-[120px]" title={uploaderName}>{uploaderName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Preview action */}
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleOpenPreview(doc)}
                                title="View Document"
                              >
                                <Eye size={13} />
                              </Button>

                              {/* Download action */}
                              <Button
                                variant="ghost"
                                size="xs"
                                loading={downloadingDocId === doc._id}
                                onClick={() => handleDownload(doc)}
                                title="Download Document"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Download size={13} />
                              </Button>

                              {/* Delete action */}
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setDeleteCandidate(doc)}
                                title="Delete Document"
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleConfirmDelete}
        title="Delete P-CAT Document"
        message={
          deleteCandidate
            ? `Are you sure you want to delete "${deleteCandidate.originalFileName}"? This will delete the file from Cloudinary and remove its record from this Purchase Order.`
            : 'Are you sure you want to delete this document?'
        }
        confirmLabel="Delete Document"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
      />

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={handleClosePreview}
          title={`Preview — ${previewDoc.originalFileName}`}
          maxWidth="920px"
          footer={
            <div className="flex items-center justify-between w-full">
              {previewBlobUrl ? (
                <button
                  type="button"
                  onClick={() => window.open(previewBlobUrl, '_blank')}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink size={13} /> Open in New Tab
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleClosePreview}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  loading={downloadingDocId === previewDoc._id}
                  onClick={() => handleDownload(previewDoc)}
                >
                  Download
                </Button>
              </div>
            </div>
          }
        >
          <div className="py-2 min-h-[300px] flex items-center justify-center">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Loading document preview...</span>
              </div>
            ) : previewError ? (
              <div className="p-8 text-center bg-red-50/70 border border-red-200 rounded-xl space-y-3 max-w-md mx-auto my-6">
                <AlertCircle size={32} className="mx-auto text-red-500" />
                <p className="text-xs font-semibold text-red-800">{previewError}</p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  loading={downloadingDocId === previewDoc._id}
                  onClick={() => handleDownload(previewDoc)}
                >
                  Download File
                </Button>
              </div>
            ) : ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes((previewDoc.fileFormat || '').toLowerCase()) ? (
              <div className="flex justify-center bg-slate-900 rounded-lg p-2 max-h-[70vh] w-full overflow-auto">
                <img
                  src={previewBlobUrl || previewDoc.secureUrl}
                  alt={previewDoc.originalFileName}
                  className="max-h-[65vh] object-contain rounded"
                />
              </div>
            ) : (previewDoc.fileFormat || '').toLowerCase() === 'pdf' ? (
              previewBlobUrl ? (
                <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <iframe
                    src={previewBlobUrl}
                    title={previewDoc.originalFileName}
                    className="w-full h-full border-0 rounded-lg"
                  />
                </div>
              ) : null
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-md mx-auto my-6">
                <FileCode size={36} className="mx-auto text-blue-500" />
                <h4 className="text-sm font-bold text-slate-800">{previewDoc.originalFileName}</h4>
                <p className="text-xs text-slate-500">
                  Direct browser preview is not available for {previewDoc.fileFormat?.toUpperCase()} files. Please click below to download and view on your machine.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  loading={downloadingDocId === previewDoc._id}
                  onClick={() => handleDownload(previewDoc)}
                >
                  Download File
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default PurchaseOrderPCatModal;
