import React, { useState, useEffect, useRef } from 'react';
import { getDrawingsByFilterGrade } from '../../services/drawingMasterService';
import { Select } from '../ui/FormField';
import DrawingPreviewModal from '../../pages/drawing-master/DrawingPreviewModal';
import { Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Eye, Star } from 'lucide-react';

/**
 * Reusable DrawingSelector component with Filter Grade-based automatic default selection
 * and manual override support.
 */
const DrawingSelector = ({
  filterGradeId,
  filterGradeName = '',
  value,
  selectedDrawingId,
  drawingSnapshot = null,
  onChange,
  onSelect,
  disabled = false,
  compact = false,
  label = 'Engineering Drawing'
}) => {
  const effectiveValue = value !== undefined ? value : selectedDrawingId;
  const triggerChange = onChange || onSelect;

  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewDrawing, setPreviewDrawing] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Normalize grade ID
  const gradeId = typeof filterGradeId === 'object' && filterGradeId !== null
    ? filterGradeId._id
    : filterGradeId;

  // Track previous grade to differentiate between grade change vs unrelated re-renders
  const prevGradeIdRef = useRef(gradeId);

  // Build snapshot object to persist with historical records
  const createSnapshot = (doc) => {
    if (!doc) return null;
    const matchedGradeName = (Array.isArray(doc.filterGrades) && doc.filterGrades.find(g => String(g._id || g) === String(gradeId))?.filterGrade)
      || (typeof doc.filterGrade === 'object' ? doc.filterGrade?.filterGrade : '')
      || (filterGradeName || '');

    return {
      drawingId: doc._id,
      drawingCode: doc.drawingCode,
      drawingName: doc.drawingName,
      filterGradeId: gradeId,
      filterGradeName: matchedGradeName,
      fileUrl: doc.fileUrl,
      format: doc.format || (doc.fileUrl?.split('.').pop() || '').toLowerCase(),
      mimeType: doc.mimeType
    };
  };

  useEffect(() => {
    if (!gradeId) {
      setDrawings([]);
      prevGradeIdRef.current = null;
      if (effectiveValue) {
        triggerChange?.('', null, null);
      }
      return;
    }

    let isMounted = true;
    const gradeChanged = prevGradeIdRef.current !== gradeId;
    prevGradeIdRef.current = gradeId;

    const loadDrawings = async () => {
      setLoading(true);
      try {
        const res = await getDrawingsByFilterGrade(gradeId);
        if (!isMounted) return;

        if (res.success && Array.isArray(res.drawings)) {
          const activeDrawings = res.drawings.filter(d => d.status === 'active');
          setDrawings(activeDrawings);

          if (activeDrawings.length > 0) {
            // Check if current value exists in the active drawings of this grade
            const matchingCurrent = activeDrawings.find(d => String(d._id) === String(effectiveValue));

            if (matchingCurrent && !gradeChanged) {
              // Current selection is already valid for this grade and grade did not change; preserve it!
            } else if (matchingCurrent && gradeChanged) {
              // Same ID valid in new grade, preserve snapshot
              triggerChange?.(matchingCurrent._id, createSnapshot(matchingCurrent), matchingCurrent);
            } else {
              // Value missing or incompatible with new grade: auto-select default drawing!
              // Deterministic: designated default for this grade or first in list
              const defaultDrawing = (res.defaultDrawing && res.defaultDrawing.status === 'active')
                ? activeDrawings.find(d => String(d._id) === String(res.defaultDrawing._id)) || res.defaultDrawing
                : activeDrawings.find(d => (d.defaultForGrades || []).map(g => String(g._id || g)).includes(String(gradeId)))
                  || activeDrawings.find(d => d.isDefault)
                  || activeDrawings[0];

              triggerChange?.(defaultDrawing._id, createSnapshot(defaultDrawing), defaultDrawing);
            }
          } else {
            // No active drawings available for this Filter Grade
            if (effectiveValue) {
              triggerChange?.('', null, null);
            }
          }
        } else {
          setDrawings([]);
          if (effectiveValue) triggerChange?.('', null, null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load drawings for filter grade:', err);
        setDrawings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDrawings();

    return () => {
      isMounted = false;
    };
  }, [gradeId]);

  // Find currently selected drawing object (from loaded drawings list or from historical snapshot)
  const currentDrawing = drawings.find(d => String(d._id) === String(effectiveValue)) || (
    drawingSnapshot && drawingSnapshot.drawingId
      ? {
          _id: drawingSnapshot.drawingId,
          drawingCode: drawingSnapshot.drawingCode,
          drawingName: drawingSnapshot.drawingName,
          fileUrl: drawingSnapshot.fileUrl,
          format: drawingSnapshot.format,
          filterGradeName: drawingSnapshot.filterGradeName,
          isHistorical: true
        }
      : null
  );

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      triggerChange?.('', null, null);
      return;
    }

    const picked = drawings.find(d => String(d._id) === String(selectedId));
    if (picked) {
      triggerChange?.(picked._id, createSnapshot(picked), picked);
    }
  };

  const handleOpenPreview = () => {
    if (currentDrawing) {
      setPreviewDrawing(currentDrawing);
      setIsPreviewOpen(true);
    }
  };

  if (!gradeId) {
    return (
      <div className="text-xs text-slate-400 italic p-2 bg-slate-50 border border-slate-200 rounded-lg">
        Select a Filter Grade first to view matching drawings.
      </div>
    );
  }

  const isPdf = currentDrawing?.format === 'pdf' || currentDrawing?.fileUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className={`space-y-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="form-label font-semibold text-slate-700 m-0">
            {label}
          </label>
          {loading && (
            <span className="text-[10px] text-blue-600 font-medium">Loading drawings...</span>
          )}
        </div>
      )}

      {drawings.length === 0 && !loading ? (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center gap-2 text-xs">
          <AlertCircle size={15} className="text-amber-600 shrink-0" />
          <span>No active drawing available for this Filter Grade</span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Manual Selection Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={effectiveValue || ''}
                onChange={handleSelectChange}
                disabled={disabled || loading || drawings.length === 0}
                className="w-full text-xs"
              >
                {drawings.map((d) => {
                  const isDef = (Array.isArray(d.defaultForGrades) ? d.defaultForGrades : [])
                    .map(g => String(g?._id || g))
                    .includes(String(gradeId)) || d.isDefault;
                  const typeLabel = d.drawingType === 'FLANGE' ? '[Flange] ' : '';
                  return (
                    <option key={d._id} value={d._id}>
                      {typeLabel}{d.drawingCode} — {d.drawingName} {isDef ? '★ (Default)' : ''}
                    </option>
                  );
                })}
              </Select>
            </div>

            {currentDrawing && (
              <button
                type="button"
                onClick={handleOpenPreview}
                className="p-2 border border-slate-300 rounded-lg bg-white text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs"
                title="View full drawing"
              >
                <Eye size={14} />
              </button>
            )}
          </div>

          {/* Selected Drawing Information & Thumbnail Card */}
          {currentDrawing && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Thumbnail Preview */}
                <div
                  onClick={handleOpenPreview}
                  className="w-10 h-10 rounded bg-white border border-slate-300 overflow-hidden cursor-pointer hover:border-blue-500 shrink-0 flex items-center justify-center transition-all shadow-2xs"
                  title="Click to preview drawing"
                >
                  {isPdf ? (
                    <FileText size={18} className="text-red-500" />
                  ) : (
                    <img
                      src={currentDrawing.fileUrl}
                      alt={currentDrawing.drawingName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {currentDrawing.drawingCode}
                    </span>
                    {currentDrawing.isDefault && (
                      <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-semibold">
                        <Star size={9} className="mr-0.5 fill-emerald-600 text-emerald-600" /> Default
                      </span>
                    )}
                    {currentDrawing.isHistorical && (
                      <span className="text-[10px] text-slate-500 bg-slate-200/80 px-1 rounded">
                        Historical Snapshot
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate max-w-[280px]">
                    {currentDrawing.drawingName}
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="text-[10px] text-right text-slate-500 shrink-0">
                <span className="text-blue-600 font-medium">Grade Matched</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Preview Modal */}
      {isPreviewOpen && (
        <DrawingPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          drawing={previewDrawing}
        />
      )}
    </div>
  );
};

export default DrawingSelector;
