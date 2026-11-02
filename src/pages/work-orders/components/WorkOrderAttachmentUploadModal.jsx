import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Alert';
import { 
  useUploadWorkOrderAttachmentMutation, 
  useReplaceWorkOrderAttachmentMutation 
} from '../../../features/workOrders/workOrdersApi';
import { 
  Upload, 
  FileText, 
  Paperclip, 
  CheckCircle2, 
  X, 
  Truck,
  FileCheck
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'TAX_INVOICE', label: 'Tax Invoice', icon: FileText, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice', icon: FileCheck, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'DOCKET_COPY', label: 'Docket Copy', icon: Truck, color: 'text-amber-700 bg-amber-50 border-amber-200' }
];

const WorkOrderAttachmentUploadModal = ({
  isOpen,
  onClose,
  workOrderId,
  workOrderNo,
  existingAttachment = null,
  initialDocumentType = 'TAX_INVOICE',
  onSuccess
}) => {
  const isReplaceMode = Boolean(existingAttachment);

  const [documentType, setDocumentType] = useState(
    existingAttachment?.documentType || ((initialDocumentType && initialDocumentType !== 'ALL') ? initialDocumentType : 'TAX_INVOICE')
  );
  const [documentTitle, setDocumentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // Contextual Fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [docketNumber, setDocketNumber] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  const [error, setError] = useState('');

  const [uploadAttachmentMutation, { isLoading: uploading }] = useUploadWorkOrderAttachmentMutation();
  const [replaceAttachmentMutation, { isLoading: replacing }] = useReplaceWorkOrderAttachmentMutation();
  const loading = uploading || replacing;

  useEffect(() => {
    if (isOpen) {
      setError('');
      setFileError('');
      setSelectedFile(null);

      if (existingAttachment) {
        setDocumentType(existingAttachment.documentType || 'TAX_INVOICE');
        setDocumentTitle(existingAttachment.documentTitle || '');
        setInvoiceNumber(existingAttachment.invoiceNumber || '');
        setInvoiceDate(existingAttachment.invoiceDate ? existingAttachment.invoiceDate.split('T')[0] : '');
        setInvoiceAmount(existingAttachment.invoiceAmount || '');
        setDocketNumber(existingAttachment.docketNumber || '');
        setTransporterName(existingAttachment.transporterName || '');
        setDispatchDate(existingAttachment.dispatchDate ? existingAttachment.dispatchDate.split('T')[0] : '');
        setLrNumber(existingAttachment.lrNumber || '');
        setRemarks(existingAttachment.remarks || '');
        setChangeSummary('');
      } else {
        const resolvedType = (initialDocumentType && initialDocumentType !== 'ALL') ? initialDocumentType : 'TAX_INVOICE';
        setDocumentType(resolvedType);
        setDocumentTitle('');
        setInvoiceNumber('');
        setInvoiceDate('');
        setInvoiceAmount('');
        setDocketNumber('');
        setTransporterName('');
        setDispatchDate('');
        setLrNumber('');
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

    setError('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);
      if (documentTitle.trim()) formData.append('documentTitle', documentTitle.trim());

      if (['TAX_INVOICE', 'PROFORMA_INVOICE'].includes(documentType)) {
        if (invoiceNumber.trim()) formData.append('invoiceNumber', invoiceNumber.trim());
        if (invoiceDate) formData.append('invoiceDate', invoiceDate);
        if (invoiceAmount) formData.append('invoiceAmount', invoiceAmount);
      }

      if (documentType === 'DOCKET_COPY') {
        if (docketNumber.trim()) formData.append('docketNumber', docketNumber.trim());
        if (transporterName.trim()) formData.append('transporterName', transporterName.trim());
        if (dispatchDate) formData.append('dispatchDate', dispatchDate);
        if (lrNumber.trim()) formData.append('lrNumber', lrNumber.trim());
      }

      if (remarks.trim()) formData.append('remarks', remarks.trim());

      let res;
      if (isReplaceMode) {
        if (changeSummary.trim()) formData.append('changeSummary', changeSummary.trim());
        res = await replaceAttachmentMutation({
          id: workOrderId,
          attachmentId: existingAttachment._id,
          formData,
        }).unwrap();
      } else {
        res = await uploadAttachmentMutation({
          id: workOrderId,
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
      console.error('Upload Work Order attachment error:', err);
      setError(err?.data?.message || err?.message || 'Failed to attach document to Work Order.');
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
          <span>{isReplaceMode ? `Upload Newer Version — v${(existingAttachment.version || 1) + 1}` : 'Attach Document to Work Order'}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            {workOrderNo}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            {documentType === 'TAX_INVOICE' && 'Tax Invoice Details'}
            {documentType === 'PROFORMA_INVOICE' && 'Proforma Invoice Details'}
            {documentType === 'DOCKET_COPY' && 'Dispatch & Shipment Details'}
          </div>

          {/* Tax Invoice & Proforma Invoice */}
          {['TAX_INVOICE', 'PROFORMA_INVOICE'].includes(documentType) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  {documentType === 'TAX_INVOICE' ? 'Invoice Number' : 'Invoice / Ref Number'}
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={documentType === 'TAX_INVOICE' ? 'e.g. TI-2026-001' : 'e.g. PI-2026-001'}
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

          {/* Docket Copy */}
          {documentType === 'DOCKET_COPY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Docket / Waybill No.</label>
                <input
                  type="text"
                  value={docketNumber}
                  onChange={(e) => setDocketNumber(e.target.value)}
                  placeholder="e.g. VRL-BLR-984210"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Transporter Name</label>
                <input
                  type="text"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. VRL Logistics, TCI Freight"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Dispatch Date</label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">LR / Tracking No.</label>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  placeholder="e.g. LR-984210"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* General Metadata */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-slate-600 mb-1 font-medium">Document Title / Label</label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g. Final Dispatched Tax Invoice or Dispatch Consignment Note"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Remarks / Notes</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes or operational context regarding this document..."
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Replacement Change Summary */}
          {isReplaceMode && (
            <div>
              <label className="block text-slate-600 mb-1 font-semibold text-amber-900">
                Reason for Replacement / Change Summary <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="e.g. Corrected invoice value or amended freight docket"
                className="w-full px-2.5 py-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-amber-50"
              />
            </div>
          )}
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide text-[11px]">
            {isReplaceMode ? 'Select New File Version' : 'Attach File'} <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center hover:border-blue-500 bg-slate-50 transition-colors">
            <input
              type="file"
              id="wo-doc-upload"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="wo-doc-upload" className="cursor-pointer flex flex-col items-center">
              <Upload size={28} className="text-slate-400 mb-1.5" />
              <span className="font-semibold text-blue-600 hover:text-blue-700">
                Click to browse
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5">
                PDF, PNG, or JPEG (Max 10 MB)
              </span>
            </label>

            {selectedFile && (
              <div className="mt-3 p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-left">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip size={14} className="text-blue-600 flex-shrink-0" />
                  <span className="font-mono text-slate-700 truncate">{selectedFile.name}</span>
                  <span className="text-slate-400 text-[11px] flex-shrink-0">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          {fileError && <div className="text-red-600 text-[11px] mt-1">{fileError}</div>}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading || !selectedFile}>
            {loading ? (
              <span>Uploading...</span>
            ) : isReplaceMode ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Replace File (v{(existingAttachment.version || 1) + 1})
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Upload size={14} /> Upload & Attach
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkOrderAttachmentUploadModal;
