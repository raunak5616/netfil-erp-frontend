import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Alert';
import EmptyState from '../../../components/ui/EmptyState';
import {
  FileText,
  FileCheck,
  Truck,
  Upload,
  Download,
  Eye,
  RefreshCw,
  Trash2,
  Paperclip,
  History,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  downloadWorkOrderAttachment,
  previewWorkOrderAttachment,
} from '../../../services/workOrderService';
import { useDeleteWorkOrderAttachmentMutation } from '../../../features/workOrders/workOrdersApi';

import WorkOrderAttachmentUploadModal from './WorkOrderAttachmentUploadModal';
import WorkOrderAttachmentPreviewModal from './WorkOrderAttachmentPreviewModal';

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
  }
};

const WorkOrderAttachmentsSection = ({
  workOrderId,
  workOrderNo,
  attachments = [],
  loading = false,
  canEdit = false,
  onRefresh
}) => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [expandedHistories, setExpandedHistories] = useState({});
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [deleteAttachmentMutation] = useDeleteWorkOrderAttachmentMutation();

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
      await downloadWorkOrderAttachment(workOrderId, attachment._id, fileName, version);
    } catch (err) {
      console.error('Download error:', err);
      setActionError(err.message || 'Failed to download attachment');
    }
  };

  const handlePreview = async (attachment, version = null) => {
    setActionError('');
    setPreviewLoading(true);
    try {
      const data = await previewWorkOrderAttachment(workOrderId, attachment._id, version);
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
    if (!window.confirm(`Are you sure you want to delete "${attachment.documentTitle || attachment.originalName}"?`)) {
      return;
    }

    setActionError('');
    setActionSuccess('');

    try {
      await deleteAttachmentMutation({
        id: workOrderId,
        attachmentId: attachment._id
      }).unwrap();
      setActionSuccess('Attachment deleted successfully.');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
      setActionError(err?.data?.message || err?.message || 'Failed to delete attachment.');
    }
  };

  // Filter attachments by selected tab
  const filteredAttachments = attachments.filter((att) => {
    if (selectedFilter === 'ALL') return true;
    return att.documentType === selectedFilter;
  });

  const getDocTypeCounts = () => {
    const counts = { ALL: attachments.length, TAX_INVOICE: 0, PROFORMA_INVOICE: 0, DOCKET_COPY: 0 };
    attachments.forEach((a) => {
      if (counts[a.documentType] !== undefined) {
        counts[a.documentType]++;
      }
    });
    return counts;
  };

  const docCounts = getDocTypeCounts();

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Action Alerts */}
      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError('')} />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />
      )}

      {/* Top Controls & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-md border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Documents ({docCounts.ALL})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('TAX_INVOICE')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedFilter === 'TAX_INVOICE'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <FileText size={13} />
            Tax Invoices ({docCounts.TAX_INVOICE})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('PROFORMA_INVOICE')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedFilter === 'PROFORMA_INVOICE'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <FileCheck size={13} />
            Proforma Invoices ({docCounts.PROFORMA_INVOICE})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('DOCKET_COPY')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedFilter === 'DOCKET_COPY'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Truck size={13} />
            Docket Copies ({docCounts.DOCKET_COPY})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh document attachments"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </Button>
          )}

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
      </div>

      {/* Attachments List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          Loading document attachments...
        </div>
      ) : filteredAttachments.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No documents attached"
          description={
            selectedFilter === 'ALL'
              ? 'Upload Tax Invoices, Proforma Invoices, or Docket Copies to attach them to this Work Order.'
              : `No ${selectedFilter.replace('_', ' ').toLowerCase()} documents have been uploaded for this Work Order.`
          }
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
                Attach Document
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAttachments.map((attachment) => {
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
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Invoice No</span>
                              <strong className="text-slate-700 font-mono">{attachment.invoiceNumber || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Invoice Date</span>
                              <strong className="text-slate-700">{formatDate(attachment.invoiceDate)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Invoice Amount</span>
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
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Docket / Waybill No</span>
                              <strong className="text-slate-700 font-mono">{attachment.docketNumber || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transporter</span>
                              <strong className="text-slate-700">{attachment.transporterName || '-'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dispatch Date</span>
                              <strong className="text-slate-700">{formatDate(attachment.dispatchDate)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">LR / Tracking No</span>
                              <strong className="text-slate-700 font-mono">{attachment.lrNumber || '-'}</strong>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Notes / Remarks */}
                      {attachment.remarks && (
                        <div className="mt-2 text-[11.5px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="font-semibold text-slate-700">Remarks: </span>
                          {attachment.remarks}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 self-start">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handlePreview(attachment)}
                      disabled={previewLoading}
                      title="Preview document inline"
                    >
                      <Eye size={13} className="mr-1" />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleDownload(attachment)}
                      title="Download latest version"
                    >
                      <Download size={13} className="mr-1" />
                      Download
                    </Button>

                    {canEdit && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setReplaceTarget(attachment);
                          setIsUploadOpen(true);
                        }}
                        title="Upload a newer version (preserves history)"
                      >
                        <Upload size={13} className="mr-1" />
                        Replace (v{(attachment.version || 1) + 1})
                      </Button>
                    )}

                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDelete(attachment)}
                        className="text-red-600 hover:bg-red-50"
                        title="Delete attachment"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}

                    {hasHistory && (
                      <button
                        type="button"
                        onClick={() => toggleHistory(attachment._id)}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 ml-1"
                        title="Toggle version history"
                      >
                        {isHistoryOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Version History Accordion */}
                {hasHistory && isHistoryOpen && (
                  <div className="bg-slate-50 p-3 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-2">
                      <History size={14} className="text-slate-500" />
                      <span>Version History & Audit Log ({attachment.versionHistory.length} previous versions)</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {attachment.versionHistory
                        .slice()
                        .sort((a, b) => b.versionNumber - a.versionNumber)
                        .map((ver) => (
                          <div
                            key={ver._id || ver.versionNumber}
                            className="bg-white border border-slate-200 rounded p-2.5 flex items-center justify-between text-[11.5px]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                v{ver.versionNumber}
                              </span>

                              <div>
                                <span className="font-mono text-slate-800">{ver.originalName}</span>
                                <span className="text-slate-400 ml-2">({formatFileSize(ver.fileSize)})</span>
                                <div className="text-[10.5px] text-slate-500 mt-0.5">
                                  Uploaded on {formatDateTime(ver.uploadedAt)} by {ver.uploadedBy?.fullName || ver.uploadedBy?.username || 'User'}
                                  {ver.changeSummary && (
                                    <span className="italic ml-2 text-slate-600 font-medium">
                                      — Note: {ver.changeSummary}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handlePreview(attachment, ver.versionNumber)}
                              >
                                <Eye size={12} className="mr-1" /> View
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleDownload(attachment, ver.versionNumber)}
                              >
                                <Download size={12} className="mr-1" /> v{ver.versionNumber}
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Replace Modal */}
      {isUploadOpen && (
        <WorkOrderAttachmentUploadModal
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setReplaceTarget(null);
          }}
          workOrderId={workOrderId}
          workOrderNo={workOrderNo}
          existingAttachment={replaceTarget}
          initialDocumentType={selectedFilter !== 'ALL' ? selectedFilter : 'TAX_INVOICE'}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <WorkOrderAttachmentPreviewModal
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

export default WorkOrderAttachmentsSection;
