import React from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Download, ExternalLink } from 'lucide-react';

const SalesOrderAttachmentPreviewModal = ({
  isOpen,
  onClose,
  attachment,
  previewData,
  onDownload
}) => {
  if (!isOpen || !attachment || !previewData) return null;

  const { blobUrl, contentType } = previewData;
  const isImage = contentType?.startsWith('image/') || 
    ['.png', '.jpg', '.jpeg'].some(ext => (attachment.originalName || '').toLowerCase().endsWith(ext));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>{attachment.documentTitle || attachment.originalName || 'Document Preview'}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            v{attachment.version}
          </span>
        </div>
      }
      size="xl"
    >
      <div className="flex flex-col gap-3">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-600">
          <div>
            <strong>File:</strong> {attachment.originalName} ({attachment.mimeType})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(blobUrl, '_blank')}
            >
              <ExternalLink size={13} className="mr-1.5" />
              Open in New Window
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onDownload && onDownload(attachment)}
            >
              <Download size={13} className="mr-1.5" />
              Download
            </Button>
          </div>
        </div>

        {/* Document Viewer Frame */}
        <div className="border border-slate-200 rounded bg-slate-100 flex items-center justify-center min-h-[500px] max-h-[72vh] overflow-auto p-2">
          {isImage ? (
            <img
              src={blobUrl}
              alt={attachment.originalName}
              className="max-h-[68vh] max-w-full object-contain rounded shadow-sm bg-white"
            />
          ) : (
            <iframe
              src={blobUrl}
              title={attachment.originalName}
              className="w-full h-[68vh] rounded bg-white border-0"
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SalesOrderAttachmentPreviewModal;
