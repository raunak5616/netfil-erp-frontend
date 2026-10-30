import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Alert';
import EmptyState from '../../../components/ui/EmptyState';
import {
  FileText,
  FileCheck,
  Truck,
  Layers,
  Upload,
  Download,
  Eye,
  RefreshCw,
  Trash2,
  Paperclip,
  History,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Clock,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  downloadSalesOrderAttachment,
  previewSalesOrderAttachment,
} from '../../../services/salesOrderService';
import { useDeleteSalesOrderAttachmentMutation } from '../../../features/salesOrders/salesOrdersApi';

import SalesOrderAttachmentUploadModal from './SalesOrderAttachmentUploadModal';
import SalesOrderAttachmentPreviewModal from './SalesOrderAttachmentPreviewModal';

const DOC_TYPE_CONFIG = {
  TAX_INVOICE: {
    label: 'Tax Invoice',
    icon: FileText,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  PROFORMA_INVOICE: {
    label: 'Proforma Invoice',
    icon: FileCheck,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  DOCKET_COPY: {
    label: 'Docket Copy',
    icon: Truck,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  APPROVED_DRAWING: {
    label: 'Approved Drawing',
    icon: Layers,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
  }
};

const SalesOrderAttachmentsSection = ({
  salesOrderId,
  salesOrderNo,
  attachments = [],
  loading = false,
  canEdit = false,
  onRefresh
}) => {
  const [expandedHistories, setExpandedHistories] = useState({});
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [deleteAttachmentMutation] = useDeleteSalesOrderAttachmentMutation();

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const toggleHistory = (attachmentId) => {
    setExpandedHistories((prev) => ({
      ...prev,
      [attachmentId]: !prev[attachmentId]
    }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };


  const handleDownload = async (attachment, version = null) => {
    setActionError('');
    try {
      const fileName = version 
        ? `${attachment.originalName?.replace(/\.[^/.]+$/, '')}_v${version}.pdf`
        : attachment.originalName;
      await downloadSalesOrderAttachment(salesOrderId, attachment._id, fileName, version);
    } catch (err) {
      console.error('Download error:', err);
      setActionError(err.message || 'Failed to download attachment');
    }
  };

  const handlePreview = async (attachment, version = null) => {
    setActionError('');
    setPreviewLoading(true);
    try {
      const data = await previewSalesOrderAttachment(salesOrderId, attachment._id, version);
      setPreviewAttachment(attachment);
      setPreviewData(data);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Preview error:', err);
      setActionError(err.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (attachment) => {
    const confirmMsg = `Are you sure you want to delete "${attachment.documentTitle || attachment.originalName}"? This will remove all ${attachment.version || 1} versions.`;
    if (!window.confirm(confirmMsg)) return;

    setActionError('');
    setActionSuccess('');
    try {
      const res = await deleteAttachmentMutation({ id: salesOrderId, attachmentId: attachment._id }).unwrap();
      if (res.success || !res.error) {
        setActionSuccess('Attachment deleted successfully');
        if (onRefresh) onRefresh();
      } else {
        setActionError(res.message || 'Failed to delete attachment');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setActionError(err?.data?.message || err?.message || 'Failed to delete attachment');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {actionError && <Alert type="error" message={actionError} onClose={() => setActionError('')} />}
      {actionSuccess && <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />}

      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Paperclip size={16} className="text-blue-600" />
            Documents & Attachments
            {attachments.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {attachments.length}
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage tax invoices, proforma invoices, docket copies, and approved engineering drawings for this Sales Order.
          </p>
        </div>

        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setReplaceTarget(null);
              setIsUploadOpen(true);
            }}
          >
            <Upload size={14} className="mr-1.5" />
            Attach Document
          </Button>
        )}
      </div>

      {/* Attachments List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          Loading document attachments...
        </div>
      ) : attachments.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No documents attached"
          description="Upload tax invoices, proforma invoices, dispatch dockets, or approved drawings to attach them directly to this order."
          action={
            canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplaceTarget(null);
                  setIsUploadOpen(true);
                }}
              >
                <Upload size={13} className="mr-1.5" />
                Attach First Document
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {attachments.map((attachment) => {
            const typeConfig = DOC_TYPE_CONFIG[attachment.documentType] || {
              label: attachment.documentType,
              icon: FileText,
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
            };
            const IconComponent = typeConfig.icon;
            const hasHistory = attachment.versionHistory && attachment.versionHistory.length > 0;
            const isHistoryOpen = Boolean(expandedHistories[attachment._id]);

            return (
              <div
                key={attachment._id}
                className="bg-white border border-slate-200 rounded-md shadow-sm hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Main Card Header & Details */}
                <div className="p-3.5 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                    <div className="p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-600 mt-0.5">
                      <IconComponent size={20} />
                    </div>

                    <div className="flex-1">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800">
                          {attachment.documentTitle || attachment.originalName}
                        </span>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${typeConfig.badgeClass}`}
                        >
                          {typeConfig.label}
                        </span>

                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          v{attachment.version || 1}
                        </span>

                        {/* Approved Drawing status badge */}
                        {attachment.documentType === 'APPROVED_DRAWING' && (
                          attachment.isApprovedDrawing ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck size={12} className="mr-1" />
                              Approved Drawing {attachment.revision ? `(${attachment.revision})` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                              Pending Approval {attachment.revision ? `(${attachment.revision})` : ''}
                            </span>
                          )
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex items-center gap-3 text-[11.5px] text-slate-500 mt-1 flex-wrap">
                        <span className="font-mono text-slate-600">{attachment.originalName}</span>
                        <span>•</span>
                        <span>{formatFileSize(attachment.fileSize)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatDateTime(attachment.uploadedAt || attachment.createdAt)}
                        </span>
                        {attachment.uploadedBy && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User size={11} />
                              {attachment.uploadedBy.fullName || attachment.uploadedBy.username}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Contextual Information Pillbox */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11.5px]">
                        {/* Invoices */}
                        {['TAX_INVOICE', 'PROFORMA_INVOICE'].includes(attachment.documentType) && (
                          <>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Invoice No</span>
                              <strong className="text-slate-700 font-mono">{attachment.invoiceNumber || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Invoice Date</span>
                              <strong className="text-slate-700">{formatDate(attachment.invoiceDate)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Invoice Amount</span>
                              <strong className="text-slate-700">
                                {attachment.invoiceAmount 
                                  ? `₹${Number(attachment.invoiceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                                  : '-'}
                              </strong>
                            </div>
                          </>
                        )}

                        {/* Docket Copies */}
                        {attachment.documentType === 'DOCKET_COPY' && (
                          <>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Docket / Waybill No</span>
                              <strong className="text-slate-700 font-mono">{attachment.docketNumber || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Transporter</span>
                              <strong className="text-slate-700">{attachment.transporterName || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Dispatch Date</span>
                              <strong className="text-slate-700">{formatDate(attachment.dispatchDate)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">LR / Tracking No</span>
                              <strong className="text-slate-700 font-mono">{attachment.lrNumber || '-'}</strong>
                            </div>
                          </>
                        )}

                        {/* Approved Drawings */}
                        {attachment.documentType === 'APPROVED_DRAWING' && (
                          <>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Drawing No</span>
                              <strong className="text-slate-700 font-mono">{attachment.drawingNumber || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase">Revision</span>
                              <strong className="text-slate-700 font-mono">{attachment.revision || 'R0'}</strong>
                            </div>
                            {attachment.isApprovedDrawing && (
                              <>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase">Approved By</span>
                                  <strong className="text-slate-700">{attachment.approvedBy || 'Engineering'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase">Approval Date</span>
                                  <strong className="text-slate-700">{formatDate(attachment.approvalDate)}</strong>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* Remarks */}
                      {attachment.remarks && (
                        <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 rounded px-2.5 py-1">
                          <strong>Note:</strong> {attachment.remarks}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(attachment)}
                      disabled={previewLoading}
                      title="Preview Document"
                    >
                      <Eye size={13} className="mr-1" />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      title="Download Document"
                    >
                      <Download size={13} className="mr-1" />
                      Download
                    </Button>

                    {canEdit && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setReplaceTarget(attachment);
                            setIsUploadOpen(true);
                          }}
                          title="Upload Newer Version / Replace Document"
                        >
                          <RefreshCw size={13} className="mr-1" />
                          Replace / Revise
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(attachment)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5"
                          title="Delete Attachment"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Version History Toggle & Collapsible Accordion */}
                {hasHistory && (
                  <div className="border-t border-slate-100 bg-slate-50 px-3.5 py-2">
                    <button
                      type="button"
                      onClick={() => toggleHistory(attachment._id)}
                      className="text-[11.5px] font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5"
                    >
                      <History size={13} />
                      Version History ({attachment.versionHistory.length} previous {attachment.versionHistory.length === 1 ? 'version' : 'versions'})
                      {isHistoryOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {isHistoryOpen && (
                      <div className="mt-2.5 space-y-2">
                        {attachment.versionHistory.map((hist) => (
                          <div
                            key={hist._id || hist.versionNumber}
                            className="bg-white border border-slate-200 rounded p-2.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 font-mono">
                                  v{hist.versionNumber}
                                </span>
                                {hist.revision && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                                    Rev: {hist.revision}
                                  </span>
                                )}
                                <span className="font-mono text-slate-800 font-medium">
                                  {hist.originalName}
                                </span>
                                <span className="text-slate-400">({formatFileSize(hist.fileSize)})</span>
                              </div>

                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                                <span>Uploaded: {formatDateTime(hist.uploadedAt)}</span>
                                {hist.uploadedBy && (
                                  <span>by {hist.uploadedBy.fullName || hist.uploadedBy.username}</span>
                                )}
                                {hist.changeSummary && (
                                  <span className="italic text-slate-600">— "{hist.changeSummary}"</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(attachment, hist.versionNumber)}
                                title={`Preview v${hist.versionNumber}`}
                              >
                                <Eye size={12} className="mr-1" />
                                Preview
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(attachment, hist.versionNumber)}
                                title={`Download v${hist.versionNumber}`}
                              >
                                <Download size={12} className="mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload & Replacement Modal */}
      {isUploadOpen && (
        <SalesOrderAttachmentUploadModal
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setReplaceTarget(null);
          }}
          salesOrderId={salesOrderId}
          salesOrderNo={salesOrderNo}
          existingAttachment={replaceTarget}
          initialDocumentType="TAX_INVOICE"
          onSuccess={(attachment, isReplaced) => {
            setActionSuccess(
              isReplaced
                ? `Uploaded new version v${attachment.version} for ${attachment.originalName}`
                : `Attached ${attachment.documentTitle || attachment.originalName} successfully`
            );
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* In-app Document Preview Modal */}
      {isPreviewOpen && previewAttachment && previewData && (
        <SalesOrderAttachmentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewAttachment(null);
            setPreviewData(null);
          }}
          attachment={previewAttachment}
          previewData={previewData}
          onDownload={(att) => handleDownload(att)}
        />
      )}
    </div>
  );
};

export default SalesOrderAttachmentsSection;
