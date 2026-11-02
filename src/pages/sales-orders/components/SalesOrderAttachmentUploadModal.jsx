import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Alert';
import { 
  useUploadSalesOrderAttachmentMutation, 
  useReplaceSalesOrderAttachmentMutation 
} from '../../../features/salesOrders/salesOrdersApi';
import { 
  Upload, 
  FileText, 
  Paperclip, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Truck,
  Layers,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'SALES_ORDER_INVOICE', label: 'Sales Order Invoice', icon: FileText, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'APPROVED_DRAWING', label: 'Approved Drawing', icon: Layers, color: 'text-purple-700 bg-purple-50 border-purple-200' }
];

const SalesOrderAttachmentUploadModal = ({
  isOpen,
  onClose,
  salesOrderId,
  salesOrderNo,
  existingAttachment = null,
  initialDocumentType = 'SALES_ORDER_INVOICE',
  onSuccess
}) => {
  const isReplaceMode = Boolean(existingAttachment);

  const [documentType, setDocumentType] = useState(
    existingAttachment?.documentType || ((initialDocumentType && initialDocumentType !== 'ALL') ? initialDocumentType : 'SALES_ORDER_INVOICE')
  );
  const [documentTitle, setDocumentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // Contextual Fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [revision, setRevision] = useState('R0');
  const [isApprovedDrawing, setIsApprovedDrawing] = useState(false);
  const [approvedBy, setApprovedBy] = useState('');
  const [approvalDate, setApprovalDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  const [error, setError] = useState('');

  const [uploadAttachmentMutation, { isLoading: uploading }] = useUploadSalesOrderAttachmentMutation();
  const [replaceAttachmentMutation, { isLoading: replacing }] = useReplaceSalesOrderAttachmentMutation();
  const loading = uploading || replacing;

  useEffect(() => {
    if (isOpen) {
      setError('');
      setFileError('');
      setSelectedFile(null);

      if (existingAttachment) {
        setDocumentType(existingAttachment.documentType || 'SALES_ORDER_INVOICE');
        setDocumentTitle(existingAttachment.documentTitle || '');
        setInvoiceNumber(existingAttachment.invoiceNumber || '');
        setInvoiceDate(existingAttachment.invoiceDate ? existingAttachment.invoiceDate.split('T')[0] : '');
        setInvoiceAmount(existingAttachment.invoiceAmount || '');
        setDrawingNumber(existingAttachment.drawingNumber || '');
        setRevision(existingAttachment.revision || 'R0');
        setIsApprovedDrawing(Boolean(existingAttachment.isApprovedDrawing));
        setApprovedBy(existingAttachment.approvedBy || '');
        setApprovalDate(existingAttachment.approvalDate ? existingAttachment.approvalDate.split('T')[0] : '');
        setRemarks(existingAttachment.remarks || '');
        setChangeSummary('');
      } else {
        const resolvedType = (initialDocumentType && initialDocumentType !== 'ALL') ? initialDocumentType : 'SALES_ORDER_INVOICE';
        setDocumentType(resolvedType);
        setDocumentTitle('');
        setInvoiceNumber('');
        setInvoiceDate('');
        setInvoiceAmount('');
        setDrawingNumber('');
        setRevision('R0');
        setIsApprovedDrawing(false);
        setApprovedBy('');
        setApprovalDate('');
        setRemarks('');
        setChangeSummary('');
      }
    }
  }, [isOpen, existingAttachment, initialDocumentType]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10 MB limit.');
      setSelectedFile(null);
      return;
    }

    // Validate extension
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
    const nameLower = file.name.toLowerCase();
    const hasAllowedExt = allowedExts.some(ext => nameLower.endsWith(ext));
    if (!hasAllowedExt) {
      setFileError('Invalid file format. Only PDF, PNG, and JPEG files are allowed.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);

    // Auto-fill title if empty
    if (!documentTitle) {
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);
      if (documentTitle.trim()) formData.append('documentTitle', documentTitle.trim());

      if (documentType === 'SALES_ORDER_INVOICE') {
        if (invoiceNumber.trim()) formData.append('invoiceNumber', invoiceNumber.trim());
        if (invoiceDate) formData.append('invoiceDate', invoiceDate);
        if (invoiceAmount) formData.append('invoiceAmount', invoiceAmount);
      }

      if (documentType === 'APPROVED_DRAWING') {
        if (drawingNumber.trim()) formData.append('drawingNumber', drawingNumber.trim());
        if (revision.trim()) formData.append('revision', revision.trim());
        formData.append('isApprovedDrawing', isApprovedDrawing);
        if (isApprovedDrawing) {
          if (approvedBy.trim()) formData.append('approvedBy', approvedBy.trim());
          if (approvalDate) formData.append('approvalDate', approvalDate);
        }
      }

      if (remarks.trim()) formData.append('remarks', remarks.trim());

      let res;
      if (isReplaceMode) {
        if (changeSummary.trim()) formData.append('changeSummary', changeSummary.trim());
        res = await replaceAttachmentMutation({
          id: salesOrderId,
          attachmentId: existingAttachment._id,
          formData,
        }).unwrap();
      } else {
        res = await uploadAttachmentMutation({
          id: salesOrderId,
          formData,
        }).unwrap();
      }

      if (res.success || res.attachment) {
        if (onSuccess) onSuccess(res.attachment || res, isReplaceMode);
        onClose();
      } else {
        setError(res.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Upload attachment error:', err);
      setError(err?.data?.message || err?.message || 'Failed to attach document.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={1100}
      title={
        <div className="flex items-center gap-2">
          <span>{isReplaceMode ? `Upload Newer Version — v${(existingAttachment.version || 1) + 1}` : 'Attach Document to Sales Order'}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            {salesOrderNo}
          </span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Mode Indicator / Type Selection */}
        {isReplaceMode ? (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900">
            <div className="flex items-center justify-between">
              <div>
                <strong>Replacing Document:</strong> {existingAttachment.originalName}
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Current Version: v{existingAttachment.version} • Type: {existingAttachment.documentType?.replace('_', ' ')}
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-amber-200 text-amber-900 font-bold text-[11px]">
                New: v{(existingAttachment.version || 1) + 1}
              </span>
            </div>
            <div className="text-[11px] text-amber-800 mt-2">
              Note: The existing file will be preserved in version history and can be accessed or downloaded at any time.
            </div>
          </div>
        ) : (
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide text-[11px]">
              Select Document Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map((t) => {
                const IconComponent = t.icon;
                const isSelected = documentType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDocumentType(t.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-500 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <IconComponent size={20} className={`mb-1.5 ${isSelected ? 'text-blue-700' : 'text-slate-500'}`} />
                    <span className="text-[11.5px] leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Contextual Fields */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 flex flex-col gap-3">
          <div className="font-semibold text-slate-700 uppercase tracking-wide text-[10.5px]">
            {documentType === 'SALES_ORDER_INVOICE' && 'Sales Order Invoice Details'}
            {documentType === 'APPROVED_DRAWING' && 'Drawing & Approval Information'}
          </div>

          {/* Sales Order Invoice */}
          {documentType === 'SALES_ORDER_INVOICE' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. SOI-2026-001"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Invoice Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Approved Drawing */}
          {documentType === 'APPROVED_DRAWING' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Drawing Number / Code</label>
                  <input
                    type="text"
                    value={drawingNumber}
                    onChange={(e) => setDrawingNumber(e.target.value)}
                    placeholder="e.g. DWG-NETFIL-GA-001"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Revision / Version</label>
                  <input
                    type="text"
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder="e.g. R0, R1, Rev-A"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Approval Checkbox & Metadata */}
              <div className="border border-slate-200 rounded p-2.5 bg-white">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isApprovedDrawing}
                    onChange={(e) => setIsApprovedDrawing(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">
                      Confirmed Approved Drawing
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Check this box only if this drawing version has formal client/engineering approval. (Uploading does not automatically approve drawings).
                    </p>
                  </div>
                </label>

                {isApprovedDrawing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Approved By</label>
                      <input
                        type="text"
                        value={approvedBy}
                        onChange={(e) => setApprovedBy(e.target.value)}
                        placeholder="e.g. Client Signoff / Technical Lead"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Approval Date</label>
                      <input
                        type="date"
                        value={approvalDate}
                        onChange={(e) => setApprovalDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title and Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Document Title / Label</label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Descriptive title or label"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Remarks / Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes or references"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Change Summary for Replace Mode */}
          {isReplaceMode && (
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Reason for Replacement / Revision Notes</label>
              <input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="e.g. Updated revision R1 with client corrections"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wide text-[11px]">
            {isReplaceMode ? 'Select New File Version' : 'Upload File'} <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center hover:bg-slate-50 transition-colors">
            {selectedFile ? (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded p-2.5">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-800">{selectedFile.name}</div>
                    <div className="text-[11px] text-slate-500">{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <Upload size={24} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs text-slate-600 font-medium">
                  Click to browse or drag and drop your document
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supported formats: PDF, PNG, JPEG (Max: 10 MB)
                </p>
                <input
                  type="file"
                  id="sales-order-file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2.5"
                  onClick={() => document.getElementById('sales-order-file-input')?.click()}
                >
                  <Paperclip size={13} className="mr-1.5" />
                  Choose File
                </Button>
              </div>
            )}
          </div>
          {fileError && (
            <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {fileError}
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || !selectedFile}>
            {loading ? (
              'Uploading...'
            ) : (
              <>
                <Upload size={14} className="mr-1.5" />
                {isReplaceMode ? 'Upload & Replace Version' : 'Attach Document'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SalesOrderAttachmentUploadModal;
