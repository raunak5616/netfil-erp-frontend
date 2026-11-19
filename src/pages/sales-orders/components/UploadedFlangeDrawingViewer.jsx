import React, { useState, useEffect } from 'react';
import {
  Box,
  FileText,
  Maximize2,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

/**
 * Displays the actual uploaded technical CAD drawing from Drawing Master / Hole Image Management.
 * Preserves true proportions and aspect ratio without stretching, distortion, or cropping.
 * Displays clear error if missing or cannot be loaded.
 */
export const UploadedFlangeDrawingViewer = ({
  drawingUrl,
  frontViewUrl,
  sideViewUrl,
  pictorialViewUrl,
  drawingCode,
  drawingName,
  filterType = 'FLANGE',
  isBox = false,
  holeCount,
  L,
  M,
  dia,
  A,
  B,
  X,
  Y,
  tolerance = '± 2 mm',
  onInspectFull
}) => {
  const [frontError, setFrontError] = useState(false);
  const [sideError, setSideError] = useState(false);
  const [pictorialError, setPictorialError] = useState(false);

  useEffect(() => {
    setFrontError(false);
    setSideError(false);
    setPictorialError(false);
  }, [drawingUrl, frontViewUrl, sideViewUrl, pictorialViewUrl, isBox, holeCount]);

  const effectiveFront = frontViewUrl || drawingUrl;
  const hasValidFront = Boolean(effectiveFront) && !frontError;
  const hasValidSide = Boolean(sideViewUrl) && !sideError;
  const hasValidPictorial = Boolean(pictorialViewUrl) && !pictorialError;
  const hasThreeViews = Boolean(sideViewUrl || pictorialViewUrl);
  const hasValidFile = hasValidFront || hasValidSide || hasValidPictorial;
  const isPdf = Boolean(effectiveFront) && (effectiveFront.toLowerCase().endsWith('.pdf') || effectiveFront.includes('application/pdf'));

  return (
    <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Title & Inspection Control */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {isBox ? <Box size={15} className="text-purple-700" /> : <FileText size={15} className="text-blue-700" />}
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {hasThreeViews ? 'Three-View Filter Drawings' : (isBox ? 'Filter Front View Drawing (Box Type)' : 'Uploaded Technical Drawing')}
          </span>
          {drawingCode && (
            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${isBox
              ? 'text-purple-800 bg-purple-100/80 border-purple-200'
              : 'text-blue-800 bg-blue-100/80 border-blue-200'
              }`}>
              {drawingCode}
            </span>
          )}
        </div>
        {hasValidFile && !hasThreeViews && (
          <button
            type="button"
            onClick={() => onInspectFull?.(effectiveFront, drawingCode, drawingName)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors"
            title="Inspect full-resolution technical drawing"
          >
            <Maximize2 size={12} /> Full View
          </button>
        )}
      </div>

      {/* Main Drawing Viewport: Solid flange, Three-View horizontal layout, or single view */}
      {!isBox && Number(holeCount) === 0 ? (
        <div className="relative w-full h-[320px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 shadow-inner">
          <div className="relative w-52 h-52 border-4 border-slate-900 bg-slate-100 flex items-center justify-center rounded-sm shadow-md">
            <div className="w-40 h-40 border-2 border-dashed border-slate-400 bg-white flex flex-col items-center justify-center p-3 text-center">
              <span className="text-xs font-bold font-mono text-slate-900 tracking-wider uppercase">SOLID FLANGE</span>
              <span className="text-[11px] text-slate-500 font-mono mt-0.5">(NO HOLES)</span>
              <span className="text-[11px] text-blue-700 font-mono font-bold mt-2.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {A || 610} × {B || 610} mm
              </span>
            </div>
            <div className="absolute top-1 left-2 text-[8px] font-mono font-bold text-slate-500">SOLID PROFILE</div>
            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-400">NO DRILLING</div>
          </div>
          <div className="mt-3.5 text-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 shadow-2xs">
              <CheckCircle size={13} className="text-emerald-700" /> Solid Flange Configuration Confirmed
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Clean solid flange without hole markers. Subtable values (L, M, Ø, X, Y) will be displayed as '-'.</p>
          </div>
        </div>
      ) : hasValidFile ? (
        hasThreeViews ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Front View */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-[11px] font-bold text-slate-800">1. Front View</span>
                <button
                  type="button"
                  onClick={() => onInspectFull?.(effectiveFront, drawingCode, `${drawingName} - Front View`)}
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <Maximize2 size={10} /> Full
                </button>
              </div>
              <div className="relative w-full h-[220px] bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-2 overflow-hidden">
                {hasValidFront ? (
                  <img
                    src={effectiveFront}
                    alt="Front View Drawing"
                    onError={() => setFrontError(true)}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">Front view unavailable</span>
                )}
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 py-0.2 rounded font-mono">
                  Left
                </span>
              </div>
              <span className="text-[10px] text-slate-400 text-center font-medium">Front Elevation</span>
            </div>

            {/* Side View */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-[11px] font-bold text-slate-800">2. Side View</span>
                {hasValidSide && (
                  <button
                    type="button"
                    onClick={() => onInspectFull?.(sideViewUrl, drawingCode, `${drawingName} - Side View`)}
                    className="text-[10px] text-teal-600 hover:underline flex items-center gap-0.5"
                  >
                    <Maximize2 size={10} /> Full
                  </button>
                )}
              </div>
              <div className="relative w-full h-[220px] bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-2 overflow-hidden">
                {hasValidSide ? (
                  <img
                    src={sideViewUrl}
                    alt="Side View Drawing"
                    onError={() => setSideError(true)}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">No side view</span>
                )}
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 py-0.2 rounded font-mono">
                  Centre
                </span>
              </div>
              <span className="text-[10px] text-slate-400 text-center font-medium">Side Elevation</span>
            </div>

            {/* 3D / Pictorial View */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-[11px] font-bold text-slate-800">3. 3D / Pictorial</span>
                {hasValidPictorial && (
                  <button
                    type="button"
                    onClick={() => onInspectFull?.(pictorialViewUrl, drawingCode, `${drawingName} - 3D View`)}
                    className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5"
                  >
                    <Maximize2 size={10} /> Full
                  </button>
                )}
              </div>
              <div className="relative w-full h-[220px] bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-2 overflow-hidden">
                {hasValidPictorial ? (
                  <img
                    src={pictorialViewUrl}
                    alt="3D View Drawing"
                    onError={() => setPictorialError(true)}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">No 3D view</span>
                )}
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 py-0.2 rounded font-mono">
                  Right
                </span>
              </div>
              <span className="text-[10px] text-slate-400 text-center font-medium">Isometric / 3D</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[320px] bg-white border border-slate-200 rounded-xl flex items-center justify-center p-3 overflow-hidden shadow-inner group">
            {isPdf ? (
              <iframe
                src={effectiveFront}
                title={drawingName || drawingCode}
                className="w-full h-full border-0 rounded"
              />
            ) : hasValidFront ? (
              <img
                src={effectiveFront}
                alt={drawingName || drawingCode || "Filter Technical Drawing"}
                onError={() => setFrontError(true)}
                className="max-w-full max-h-full object-contain transition-transform group-hover:scale-[1.02] duration-200"
              />
            ) : (
              <span className="text-xs text-slate-400 italic">No drawing image available</span>
            )}
          </div>
        )
      ) : (
        <div className="w-full h-[320px] bg-amber-50/60 border border-amber-300 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              {isBox ? 'Front View Drawing Missing' : 'Uploaded Technical Drawing Missing'}
            </h4>
            <p className="text-xs text-amber-800 max-w-sm">
              {isBox
                ? `No uploaded Front View drawing file was found in Drawing Master for ${drawingCode || 'this box filter'}.`
                : `No uploaded technical drawing file was found in Drawing Master for pattern ${drawingCode || 'configuration'}.`}
            </p>
            <p className="text-[11px] text-amber-700 max-w-sm">
              {isBox
                ? 'Please ensure the filter\'s Front View image is uploaded in Drawing Master to display it here and embed it into the production PDF.'
                : 'Please upload the filter flange drawing file in Drawing Master → Hole Image Management to display it here and embed it into the production PDF.'}
            </p>
          </div>
          <a
            href={isBox ? "/drawing-master" : "/drawing-master?tab=hole_images"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors mt-2"
          >
            <ExternalLink size={13} /> {isBox ? 'Open Drawing Master' : 'Open Hole Image Management'}
          </a>
        </div>
      )}

      {/* Confirmed Engineering Dimension Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-center text-xs">
        <div className="bg-white p-2 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">
            {isBox ? 'Body Size (A × B)' : 'Flange (A × B)'}
          </span>
          <strong className="text-xs font-bold text-slate-800">{A || 610} × {B || 610} mm</strong>
        </div>
        <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
          <span className="text-[10px] text-purple-700 block uppercase font-semibold">
            {isBox ? 'Filter Type' : 'Hole Pattern'}
          </span>
          <strong className="text-xs font-bold text-purple-900">
            {isBox ? 'BOX (No Holes)' : (Number(holeCount) === 0 ? '0 Holes (Solid)' : `${holeCount} Holes`)}
          </strong>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
          <span className="text-[10px] text-blue-700 block uppercase font-semibold">
            {isBox ? 'Mounting Holes' : 'Pitch / Spacing'}
          </span>
          <strong className="text-xs font-bold text-blue-900">
            {(isBox || Number(holeCount) === 0) ? 'No Holes (Solid)' : `L=${L} | M=${M} mm`}
          </strong>
        </div>
        <div className="bg-white p-2 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">
            {isBox ? 'Hole Diameter' : 'Hole Size (Ø)'}
          </span>
          <strong className="text-xs font-bold text-slate-800">
            {(isBox || Number(holeCount) === 0) ? 'N/A' : `Ø${dia} mm ${X && X !== '-' ? `(${X})` : ''}`}
          </strong>
        </div>
        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-emerald-700 block uppercase font-semibold">Tolerance</span>
          <strong className="text-xs font-bold text-emerald-900 font-mono">{tolerance || '± 2 mm'}</strong>
        </div>
      </div>
    </div>
  );
};

export default UploadedFlangeDrawingViewer;
