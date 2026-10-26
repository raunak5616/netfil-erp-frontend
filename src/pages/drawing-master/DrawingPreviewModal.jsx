import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Download, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

const DrawingPreviewModal = ({ isOpen, onClose, drawing }) => {
  if (!isOpen || !drawing) return null;

  const isPdf = drawing.format === 'pdf' || drawing.fileUrl?.toLowerCase().endsWith('.pdf') || drawing.mimeType === 'application/pdf';
  const gradeName = typeof drawing.filterGrade === 'object' ? drawing.filterGrade?.filterGrade : drawing.filterGradeName || '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Drawing Preview — ${drawing.drawingCode}`}
      size="xl"
      zIndex={1200}
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-slate-500">
            {drawing.drawingName} • Grade: <strong className="text-slate-800">{gradeName}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(drawing.fileUrl, '_blank')}
            >
              <ExternalLink size={14} className="mr-1.5" /> Open Full Asset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300">
              {drawing.drawingCode}
            </span>
            <span className="text-slate-700 font-semibold">{drawing.drawingName}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${
              (drawing.drawingType === 'BOX' || drawing.drawingType === 'STANDARD')
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : drawing.drawingType === 'FLANGE'
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : drawing.drawingType === 'FINE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : drawing.drawingType === 'HEPA'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}>
              Type: {drawing.drawingType === 'STANDARD' ? 'Box' : (drawing.drawingType ? drawing.drawingType.charAt(0).toUpperCase() + drawing.drawingType.slice(1).toLowerCase() : 'Box')}
            </span>
            {drawing.drawingType === 'FLANGE' && (drawing.holes !== undefined && drawing.holes !== null) && (
              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold">
                Holes: {drawing.holes}
              </span>
            )}
            {drawing.drawingType === 'FLANGE' && (
              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-medium">
                Handles: 2 (Fixed)
              </span>
            )}
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
              Filter Grade: {gradeName}
            </span>
            {drawing.isDefault && (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" /> Default Drawing
              </span>
            )}
          </div>
        </div>

        {/* Drawing Preview Screen */}
        <div className="flex items-center justify-center bg-slate-100 p-4 rounded-xl border border-slate-300 min-h-[360px] max-h-[560px] overflow-auto">
          {isPdf ? (
            <div className="w-full h-[500px] flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 p-6 space-y-4">
              <FileText size={64} className="text-red-500" />
              <div className="text-center">
                <h4 className="font-semibold text-slate-800 text-sm">{drawing.fileName || `${drawing.drawingCode}.pdf`}</h4>
                <p className="text-xs text-slate-500 mt-1">PDF Engineering Drawing Document</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={drawing.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm"
                >
                  <ExternalLink size={14} /> View PDF in Tab
                </a>
                <a
                  href={drawing.fileUrl}
                  download={drawing.fileName || `${drawing.drawingCode}.pdf`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-300"
                >
                  <Download size={14} /> Download File
                </a>
              </div>
            </div>
          ) : (
            <img
              src={drawing.fileUrl}
              alt={drawing.drawingName}
              className="max-h-[500px] max-w-full object-contain rounded shadow-xs bg-white"
            />
          )}
        </div>

        {/* Description / Remarks */}
        {drawing.description && (
          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
            <span className="font-semibold text-slate-700 block mb-0.5">Description / Remarks:</span>
            {drawing.description}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DrawingPreviewModal;
