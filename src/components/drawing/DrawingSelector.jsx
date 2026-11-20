import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGetDrawingsByFilterGradeQuery } from '../../features/drawingMaster/drawingMasterApi';
import { Select } from '../ui/FormField';
import DrawingPreviewModal from '../../pages/drawing-master/DrawingPreviewModal';
import { Image as ImageIcon, FileText, CheckCircle2, AlertCircle, AlertTriangle, Eye, Star } from 'lucide-react';

/**
 * Validates whether a DrawingMaster record is compatible with a given Construction Type ('BOX' or 'FLANGE').
 */
export const isDrawingCompatibleWithConstruction = (drawing, targetConstruction) => {
  if (!drawing) return false;
  if (!targetConstruction) return true;
  const target = String(targetConstruction).trim().toUpperCase();
  const dConst = String(drawing.constructionType || '').trim().toUpperCase();
  const dType = String(drawing.drawingType || '').trim().toUpperCase();

  if (target === 'BOX') {
    if (dConst === 'FLANGE' || dType === 'FLANGE') return false;
    if (dConst === 'BOX' || dType === 'BOX' || dType === 'STANDARD') return true;
    return dConst !== 'FLANGE' && dType !== 'FLANGE';
  }

  if (target === 'FLANGE') {
    if (dConst === 'BOX' || dType === 'BOX' || dType === 'STANDARD') return false;
    if (dConst === 'FLANGE' || dType === 'FLANGE') return true;
    return false;
  }

  return true;
};

/**
 * Reusable DrawingSelector component with RTK Query caching and dynamic Construction Type synchronization.
 * Automatically synchronizes with BOX vs FLANGE construction types and selected Filter Grade.
 */
const DrawingSelector = ({
  filterGradeId,
  filterGradeName = '',
  constructionType = '',
  variantFilterClass = '',
  value,
  selectedDrawingId,
  drawingSnapshot = null,
  onChange,
  onSelect,
  disabled = false,
  compact = false,
  label = 'Engineering Drawing',
}) => {
  const effectiveValue = value !== undefined ? value : selectedDrawingId;
  const triggerChange = onChange || onSelect;

  const [previewDrawing, setPreviewDrawing] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Normalize grade ID
  const gradeId =
    typeof filterGradeId === 'object' && filterGradeId !== null
      ? filterGradeId._id
      : filterGradeId;

  const normalizedConstruction = useMemo(() => {
    return (constructionType || '').trim().toUpperCase();
  }, [constructionType]);

  // Track previous inputs to differentiate parameter changes vs unrelated re-renders
  const prevGradeIdRef = useRef(gradeId);
  const prevConstructionRef = useRef(normalizedConstruction);

  // Fetch drawings from RTK Query cache with constructionType parameter
  const queryArgs = useMemo(() => {
    if (!gradeId) return null;
    const params = { includeFlange: 'true' };
    if (normalizedConstruction) {
      params.drawingType = normalizedConstruction;
      params.constructionType = normalizedConstruction;
    }
    return { filterGradeId: gradeId, params };
  }, [gradeId, normalizedConstruction]);

  const { data: drawingsData, isFetching: loading } = useGetDrawingsByFilterGradeQuery(
    queryArgs || gradeId,
    { skip: !gradeId }
  );

  const rawDrawings = useMemo(() => {
    if (drawingsData?.success && Array.isArray(drawingsData.drawings)) {
      return drawingsData.drawings.filter((d) => d.status === 'active');
    }
    return [];
  }, [drawingsData]);

  // Filter drawings strictly by construction type
  const filteredDrawings = useMemo(() => {
    if (!rawDrawings.length) return [];
    if (!normalizedConstruction) return rawDrawings;
    return rawDrawings.filter((d) => isDrawingCompatibleWithConstruction(d, normalizedConstruction));
  }, [rawDrawings, normalizedConstruction]);

  // Build snapshot object to persist with historical records
  const createSnapshot = useCallback(
    (doc) => {
      if (!doc) return null;
      const matchedGradeName =
        (Array.isArray(doc.filterGrades) &&
          doc.filterGrades.find((g) => String(g._id || g) === String(gradeId))?.filterGrade) ||
        (typeof doc.filterGrade === 'object' ? doc.filterGrade?.filterGrade : '') ||
        filterGradeName ||
        '';

      return {
        drawingId: doc._id,
        drawingCode: doc.drawingCode,
        drawingName: doc.drawingName,
        filterGradeId: gradeId,
        filterGradeName: matchedGradeName,
        fileUrl: doc.fileUrl,
        format: doc.format || (doc.fileUrl?.split('.').pop() || '').toLowerCase(),
        mimeType: doc.mimeType,
        filterCategory: doc.filterCategory,
        constructionType: doc.constructionType || (doc.drawingType === 'FLANGE' ? 'FLANGE' : 'BOX'),
        frontViewImage: doc.frontViewImage,
        sideViewImage: doc.sideViewImage,
        pictorialViewImage: doc.pictorialViewImage,
      };
    },
    [gradeId, filterGradeName]
  );

  // Synchronization and Auto-Selection Effect
  useEffect(() => {
    if (!gradeId) {
      prevGradeIdRef.current = null;
      prevConstructionRef.current = null;
      if (effectiveValue) {
        triggerChange?.('', null, null);
      }
      return;
    }

    if (loading) return;

    const gradeChanged = prevGradeIdRef.current !== gradeId;
    const constructionChanged = prevConstructionRef.current !== normalizedConstruction;
    prevGradeIdRef.current = gradeId;
    prevConstructionRef.current = normalizedConstruction;

    // Check if current effectiveValue is valid and COMPATIBLE with constructionType
    const matchingCurrent = filteredDrawings.find((d) => String(d._id) === String(effectiveValue));
    const currentIsCompatible = matchingCurrent && isDrawingCompatibleWithConstruction(matchingCurrent, normalizedConstruction);

    if (currentIsCompatible && !gradeChanged && !constructionChanged) {
      // Current selection is already compatible and neither grade nor construction changed; preserve it!
      return;
    }

    if (currentIsCompatible && (gradeChanged || constructionChanged)) {
      // Current selection is still compatible with new grade/construction; refresh snapshot
      triggerChange?.(matchingCurrent._id, createSnapshot(matchingCurrent), matchingCurrent);
      return;
    }

    // Previous selection is missing or INCOMPATIBLE with new construction type / grade:
    // Automatically select the most appropriate compatible drawing
    if (filteredDrawings.length > 0) {
      let candidate = null;

      // 1. Check if backend defaultDrawing is in filteredDrawings
      if (
        drawingsData?.defaultDrawing &&
        drawingsData.defaultDrawing.status === 'active' &&
        isDrawingCompatibleWithConstruction(drawingsData.defaultDrawing, normalizedConstruction)
      ) {
        candidate =
          filteredDrawings.find((d) => String(d._id) === String(drawingsData.defaultDrawing._id)) ||
          null;
      }

      // 2. Prioritize drawings marked default for this specific grade
      if (!candidate) {
        candidate = filteredDrawings.find((d) =>
          (d.defaultForGrades || []).map((g) => String(g._id || g)).includes(String(gradeId))
        );
      }

      // 3. Match Grade Variant filterClass if provided (e.g. HEPA vs FINE_PRE)
      if (!candidate && variantFilterClass) {
        const vClass = String(variantFilterClass).trim().toUpperCase();
        candidate = filteredDrawings.find((d) => {
          const cat = String(d.filterCategory || '').toUpperCase();
          const dName = String(d.drawingName || '').toUpperCase();
          if (vClass.includes('HEPA')) return cat.includes('HEPA') || dName.includes('HEPA');
          if (vClass.includes('PRE') || vClass.includes('FINE')) {
            return cat.includes('FINE') || cat.includes('PRE') || dName.includes('PRE') || dName.includes('FINE');
          }
          return false;
        });
      }

      // 4. Prioritize isDefault
      if (!candidate) {
        candidate = filteredDrawings.find((d) => d.isDefault);
      }

      // 5. Fallback to first compatible drawing
      if (!candidate) {
        candidate = filteredDrawings[0];
      }

      if (candidate) {
        triggerChange?.(candidate._id, createSnapshot(candidate), candidate);
      }
    } else if (drawingsData && !loading) {
      // No compatible drawings available for this Filter Grade and Construction Type
      if (effectiveValue) {
        triggerChange?.('', null, null);
      }
    }
  }, [
    gradeId,
    normalizedConstruction,
    filteredDrawings,
    drawingsData,
    loading,
    effectiveValue,
    variantFilterClass,
    triggerChange,
    createSnapshot,
  ]);

  // Find currently selected drawing object (from loaded compatible drawings list or from historical snapshot)
  const currentDrawing =
    filteredDrawings.find((d) => String(d._id) === String(effectiveValue)) ||
    (drawingSnapshot && drawingSnapshot.drawingId && isDrawingCompatibleWithConstruction(drawingSnapshot, normalizedConstruction)
      ? {
          _id: drawingSnapshot.drawingId,
          drawingCode: drawingSnapshot.drawingCode,
          drawingName: drawingSnapshot.drawingName,
          fileUrl: drawingSnapshot.fileUrl,
          format: drawingSnapshot.format,
          filterGradeName: drawingSnapshot.filterGradeName,
          frontViewImage: drawingSnapshot.frontViewImage,
          sideViewImage: drawingSnapshot.sideViewImage,
          pictorialViewImage: drawingSnapshot.pictorialViewImage,
          isHistorical: true,
        }
      : null);

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      triggerChange?.('', null, null);
      return;
    }

    const picked = filteredDrawings.find((d) => String(d._id) === String(selectedId));
    if (picked) {
      triggerChange?.(picked._id, createSnapshot(picked), picked);
    } else {
      triggerChange?.('', null, null);
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

  const isPdf =
    currentDrawing?.format === 'pdf' || currentDrawing?.fileUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className={`space-y-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="form-label font-semibold text-slate-700 m-0">{label}</label>
          {loading && <span className="text-[10px] text-blue-600 font-medium">Loading drawings...</span>}
        </div>
      )}

      {/* Warning when no compatible drawings exist for the selected construction type */}
      {filteredDrawings.length === 0 && !loading ? (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl flex items-start gap-2.5 text-xs shadow-2xs">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-950">
              No Compatible {normalizedConstruction || ''} Engineering Drawing
            </span>
            <p className="text-amber-900 text-[11.5px] leading-relaxed">
              No matching {normalizedConstruction || ''} drawing was found in Drawing Master for{' '}
              <strong>{filterGradeName || 'selected Grade'}</strong>.
            </p>
            <span className="inline-block text-[10.5px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
              Please configure a compatible {normalizedConstruction || ''} drawing in Drawing Master or adjust construction type.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Manual Selection Dropdown: Strictly displays only compatible drawings */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={effectiveValue || ''}
                onChange={handleSelectChange}
                disabled={disabled || loading || filteredDrawings.length === 0}
                className="w-full text-xs"
              >
                <option value="">-- Select Engineering Drawing --</option>
                {filteredDrawings.map((d) => {
                  const isDef =
                    (Array.isArray(d.defaultForGrades) ? d.defaultForGrades : [])
                      .map((g) => String(g?._id || g))
                      .includes(String(gradeId)) || d.isDefault;
                  const dt = (d.drawingType || d.constructionType || '').toUpperCase();
                  const typeLabel =
                    dt === 'FLANGE'
                      ? '[Flange] '
                      : dt === 'BOX'
                      ? '[Box] '
                      : dt === 'FINE'
                      ? '[Fine] '
                      : dt === 'HEPA'
                      ? '[HEPA] '
                      : '';
                  return (
                    <option key={d._id} value={d._id}>
                      {typeLabel}
                      {d.drawingCode} — {d.drawingName} {isDef ? '★ (Default)' : ''}
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
                      src={currentDrawing.fileUrl || currentDrawing.frontViewImage?.url}
                      alt={currentDrawing.drawingName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (currentDrawing.frontViewImage?.url && e.currentTarget.src !== currentDrawing.frontViewImage.url) {
                          e.currentTarget.src = currentDrawing.frontViewImage.url;
                        } else {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = '<span class="text-slate-400 text-xs font-mono">CAD</span>';
                        }
                      }}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {currentDrawing.drawingCode}
                    </span>
                    {(currentDrawing.drawingType === 'FLANGE' || currentDrawing.constructionType === 'FLANGE') &&
                      currentDrawing.holes !== undefined &&
                      currentDrawing.holes !== null && (
                        <span className="text-[10px] text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded font-medium">
                          {currentDrawing.holes} {currentDrawing.holes === 1 ? 'Hole' : 'Holes'}
                        </span>
                      )}
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
                <span className="text-blue-600 font-medium">
                  {normalizedConstruction ? `${normalizedConstruction} Matched` : 'Grade Matched'}
                </span>
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
