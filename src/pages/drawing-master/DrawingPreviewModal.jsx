import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Download, ExternalLink, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getVersionedImageUrl } from '../../services/drawingMasterService';

const DrawingPreviewModal = ({ isOpen, onClose, drawing }) => {
  if (!isOpen || !drawing) return null;

  const isPdf = drawing.format === 'pdf' || drawing.fileUrl?.toLowerCase().endsWith('.pdf') || drawing.mimeType === 'application/pdf';
  const gradeName = typeof drawing.filterGrade === 'object' ? drawing.filterGrade?.filterGrade : drawing.filterGradeName || 'Universal';

  const isFinePre = drawing.filterCategory === 'FINE_PRE' || drawing.drawingType === 'FINE';
  const isHepa = drawing.filterCategory === 'HEPA' || drawing.drawingType === 'HEPA';
  const isFlange = drawing.drawingType === 'FLANGE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Drawing Preview — {drawing.drawingCode}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isFinePre
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {isFinePre ? 'Fine / Pre' : 'HEPA'}
          </span>
        </div>
      }
      size="xl"
      zIndex={1200}
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-slate-500">
            {drawing.drawingName} • Grade: <strong className="text-slate-800">{gradeName}</strong>
          </div>
          <div className="flex gap-2">
            {drawing.fileUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(drawing.fileUrl, '_blank')}
              >
                <ExternalLink size={14} className="mr-1.5" /> View Asset
              </Button>
            )}
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
        {/* Header Summary Badges */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300">
              {drawing.drawingCode}
            </span>
            <span className="text-slate-700 font-semibold">{drawing.drawingName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category Badge */}
            <span className={`px-2 py-0.5 rounded-full font-bold border text-[11px] ${
              isFinePre
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isFinePre ? 'Fine/Pre' : 'HEPA'}
            </span>

            {/* Drawing Type Badge */}
            <span className={`px-2 py-0.5 rounded-full font-semibold border text-[11px] ${
              isFlange
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {isFlange ? 'Flange' : 'Box'}
            </span>


            {/* Flange Hole Config & Handles */}
            {isFlange && (
              <>
                <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                  {(drawing.holeConfig && drawing.holeConfig.toLowerCase() !== 'ing1') ? drawing.holeConfig : (drawing.holes ? `${drawing.holes} Holes` : 'Normal Flange')}
                </span>
                <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  2 Handles (Fixed)
                </span>
              </>
            )}

            {/* Default Status */}
            {drawing.isDefault && (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" /> Default
              </span>
            )}
          </div>
        </div>

        {/* Drawing Preview Screen */}
        {(() => {
          const frontUrl = drawing.frontViewImage?.url || drawing.fileUrl || drawing.holeImageUrl || '';
          const sideUrl = drawing.sideViewImage?.url || '';
          const picUrl = drawing.pictorialViewImage?.url || '';
          const hasMultiViews = Boolean(sideUrl || picUrl);

          if (hasMultiViews) {
            const views = [
              {
                id: 'front',
                title: 'Front View',
                subtitle: 'Front Elevation (Left)',
                url: frontUrl,
                badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
              },
              {
                id: 'side',
                title: 'Side View',
                subtitle: 'Side Elevation (Centre)',
                url: sideUrl,
                badgeClass: 'bg-teal-100 text-teal-800 border-teal-200'
              },
              {
                id: 'pic',
                title: '3D / Pictorial View',
                subtitle: 'Isometric / 3D (Right)',
                url: picUrl,
                badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
              }
            ];

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span>Three-View Engineering CAD Drawings</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Left-to-Right sequence matching Sales Order Drawing PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {views.map((v, i) => (
                    <div
                      key={v.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {i + 1}. {v.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${v.badgeClass}`}>
                          {v.id === 'front' ? 'Left' : v.id === 'side' ? 'Centre' : 'Right'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center bg-slate-50 p-2 rounded-lg border border-slate-200 h-[280px] overflow-hidden">
                        {v.url ? (
                          v.url.toLowerCase().endsWith('.pdf') ? (
                            <div className="flex flex-col items-center justify-center p-3 text-center">
                              <FileText size={44} className="text-red-500 mb-2" />
                              <span className="text-xs font-semibold text-slate-800">{v.title}.pdf</span>
                            </div>
                          ) : (
                            <img
                              src={getVersionedImageUrl(v.url, drawing.updatedAt)}
                              alt={v.title}
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          )
                        ) : (
                          <span className="text-xs text-slate-400 italic">No drawing image</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 text-[10px]">{v.subtitle}</span>
                        {v.url && (
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <ExternalLink size={11} /> Open
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Fallback for single image drawing
          return (
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
                  src={getVersionedImageUrl(drawing.holeImageUrl || drawing.fileUrl, drawing.updatedAt)}
                  alt={drawing.drawingName}
                  className="max-h-[500px] max-w-full object-contain rounded shadow-xs bg-white"
                />
              )}
            </div>
          );
        })()}

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
