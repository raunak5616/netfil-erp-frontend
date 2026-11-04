import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  getSalesOrderItemDrawing,
  getSalesOrderDrawings
} from '../../services/salesOrderService';
import {
  useGetSalesOrderDrawingsConfigQuery,
  useUpdateSalesOrderItemDrawingConfigMutation,
} from '../../features/salesOrders/salesOrdersApi';
import {
  useGetHoleImagesQuery,
  useGetHoleConfigurationsQuery
} from '../../features/drawingMaster/drawingMasterApi';
import { getVersionedImageUrl } from '../../services/drawingMasterService';
import {
  Printer,
  Download,
  Eye,
  Settings,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Box,
  Maximize2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  ShieldCheck,
  Shield,
  Sparkles,
  AlertTriangle,
  X
} from 'lucide-react';

/**
 * Displays the actual uploaded technical CAD drawing from Drawing Master / Hole Image Management.
 * Preserves true proportions and aspect ratio without stretching, distortion, or cropping.
 * Displays clear error if missing or cannot be loaded.
 */
const UploadedFlangeDrawingViewer = ({
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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [drawingUrl, frontViewUrl, sideViewUrl, pictorialViewUrl, isBox]);

  const effectiveFront = frontViewUrl || drawingUrl;
  const hasThreeViews = !isBox && Boolean(sideViewUrl || pictorialViewUrl);
  const hasValidFile = Boolean(effectiveFront || sideViewUrl || pictorialViewUrl) && !imageError;
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
            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
              isBox 
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
                <img
                  src={effectiveFront}
                  alt="Front View Drawing"
                  onError={() => setImageError(true)}
                  className="max-w-full max-h-full object-contain"
                />
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
                {sideViewUrl && (
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
                {sideViewUrl ? (
                  <img
                    src={sideViewUrl}
                    alt="Side View Drawing"
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
                {pictorialViewUrl && (
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
                {pictorialViewUrl ? (
                  <img
                    src={pictorialViewUrl}
                    alt="3D View Drawing"
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
            ) : (
              <img
                src={effectiveFront}
                alt={drawingName || drawingCode || "Filter Technical Drawing"}
                onError={() => setImageError(true)}
                className="max-w-full max-h-full object-contain transition-transform group-hover:scale-[1.02] duration-200"
              />
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
                : 'Please upload the filter flange drawing file in Drawing Master \u2192 Hole Image Management to display it here and embed it into the production PDF.'}
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

const SalesOrderDrawingWorkspaceModal = ({
  isOpen,
  salesOrderId,
  onClose,
  initialItemId = null
}) => {
  const [customError, setCustomError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'holes' | 'templates'

  // Item form states
  const [holeForm, setHoleForm] = useState({
    filterType: 'FLANGE',
    L: 100,
    M: 100,
    dia: 12,
    X: '-',
    Y: '-',
    holeCount: 12,
    flangeHoleConfig: 'HOLE-12H',
    tolerance: '± 2 mm',
    protectionGuardMoc: 'NO Protection Grid',
    guard: { hasGuard: false, material: 'SS304', sides: 'Both side' }
  });

  // PDF Preview states
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [inspectDrawingModal, setInspectDrawingModal] = useState(null); // { url, code, name }

  const {
    data: configData,
    isLoading: loading,
    error: configError,
  } = useGetSalesOrderDrawingsConfigQuery(salesOrderId, {
    skip: !isOpen || !salesOrderId,
  });

  const {
    data: holeImagesData,
    isLoading: loadingHoleImages,
  } = useGetHoleImagesQuery(undefined, {
    skip: !isOpen,
  });

  const {
    data: holeConfigData,
  } = useGetHoleConfigurationsQuery(undefined, {
    skip: !isOpen,
  });

  const [updateDrawingConfigMutation, { isLoading: savingHoles }] = useUpdateSalesOrderItemDrawingConfigMutation();

  // Combine hole patterns from backend Drawing Master Hole Tab
  const drawingMasterHolePatterns = useMemo(() => {
    const list = [];
    const seenCodes = new Set();

    // 1. Hole patterns from Drawing Master Hole Tab (GET /api/drawings/hole-images)
    if (holeImagesData?.holeImages && Array.isArray(holeImagesData.holeImages)) {
      for (const item of holeImagesData.holeImages) {
        const code = (item.drawingCode || `HOLE-${item.holes}H`).toUpperCase();
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          list.push({
            _id: item.drawingId,
            drawingCode: item.drawingCode || code,
            drawingName: item.drawingName || `Flange ${item.holes} Holes Mounting Drawing`,
            holes: Number(item.holes),
            holeConfig: item.holeConfig || `${item.holes} Holes`,
            fileUrl: item.imageUrl || '',
            holeImageUrl: item.imageUrl || '',
            description: item.description || '',
            updatedAt: item.updatedAt
          });
        }
      }
    }

    // 2. Active hole configurations from Sales Order drawing config
    if (configData?.availableHoleConfigurations && Array.isArray(configData.availableHoleConfigurations)) {
      for (const item of configData.availableHoleConfigurations) {
        const code = (item.drawingCode || `HOLE-${item.holes}H`).toUpperCase();
        const existingIdx = list.findIndex(p => p.drawingCode?.toUpperCase() === code);
        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...item,
            ...list[existingIdx],
            fileUrl: list[existingIdx].fileUrl || item.fileUrl || item.holeImageUrl || '',
            holeImageUrl: list[existingIdx].holeImageUrl || item.holeImageUrl || item.fileUrl || '',
          };
        } else {
          seenCodes.add(code);
          list.push(item);
        }
      }
    }

    // 3. Fallback hole configurations from GET /api/drawings/hole-configurations
    if (holeConfigData?.holeConfigurations && Array.isArray(holeConfigData.holeConfigurations)) {
      for (const item of holeConfigData.holeConfigurations) {
        const code = (item.drawingCode || `HOLE-${item.holes}H`).toUpperCase();
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          list.push({
            _id: item.id,
            drawingCode: item.drawingCode || code,
            drawingName: item.name || `Flange ${item.holes} Holes Mounting Drawing`,
            holes: Number(item.holes),
            holeConfig: item.simpleName || `${item.holes} Holes`,
            fileUrl: '',
            holeImageUrl: '',
            description: item.description || ''
          });
        }
      }
    }

    return list;
  }, [holeImagesData, configData, holeConfigData]);

  // Dynamically derive supported hole count numbers from backend Drawing Master Hole Tab
  const availableHoleCounts = useMemo(() => {
    const counts = new Set();
    // 0 Holes is always supported for Flange filters
    counts.add(0);

    // 1. From supportedHoleCounts returned by getHoleImages backend
    if (holeImagesData?.supportedHoleCounts && Array.isArray(holeImagesData.supportedHoleCounts)) {
      holeImagesData.supportedHoleCounts.forEach(c => {
        const num = Number(c);
        if (!isNaN(num) && num >= 0 && num !== 16) counts.add(num);
      });
    }

    // 2. From all hole pattern records in drawingMasterHolePatterns
    drawingMasterHolePatterns.forEach(p => {
      const num = Number(p.holes);
      if (!isNaN(num) && num >= 0 && num !== 16) counts.add(num);
    });

    // 3. From hole configurations options
    if (holeConfigData?.holeConfigurations && Array.isArray(holeConfigData.holeConfigurations)) {
      holeConfigData.holeConfigurations.forEach(c => {
        const num = Number(c.holes);
        if (!isNaN(num) && num >= 0 && num !== 16) counts.add(num);
      });
    }

    // 4. Fallback baseline (0, 4, 8, 12) if backend returned empty
    if (counts.size === 0) {
      [0, 4, 8, 12].forEach(c => counts.add(c));
    }

    // 5. Ensure current item's holeCount is included if present (excluding 16)
    if (holeForm.holeCount !== undefined && holeForm.holeCount !== null && holeForm.holeCount !== '') {
      const currentNum = Number(holeForm.holeCount);
      if (!isNaN(currentNum) && currentNum >= 0 && currentNum !== 16) counts.add(currentNum);
    }

    counts.delete(16);

    return Array.from(counts).sort((a, b) => a - b);
  }, [holeImagesData, drawingMasterHolePatterns, holeConfigData, holeForm.holeCount]);

  const error = customError || (configError ? (configError?.data?.message || 'Server error loading drawings') : '');
  const setError = setCustomError;

  // Initialize selected item when configData loads
  useEffect(() => {
    if (configData?.items && configData.items.length > 0) {
      const items = configData.items;
      const targetItem = initialItemId
        ? items.find(it => String(it._id) === String(initialItemId)) || items[0]
        : (selectedItemId ? items.find(it => String(it._id) === String(selectedItemId)) || items[0] : items[0]);

      if (targetItem && targetItem._id !== selectedItemId) {
        setSelectedItemId(targetItem._id);
        populateHoleForm(targetItem);
      }
    }
  }, [configData, initialItemId]);

  useEffect(() => {
    if (!isOpen && pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [isOpen]);

  // Populate hole form when active item changes
  const populateHoleForm = (item) => {
    if (!item) return;
    const filterType = (item.filterType || item.constructionType || 'FLANGE').toUpperCase();
    const isBox = filterType === 'BOX';
    const confirmed = item.confirmedHoleDetails || {};
    
    let rawCount = 12;
    if (item.holeCount !== null && item.holeCount !== undefined && !isNaN(Number(item.holeCount))) {
      rawCount = Number(item.holeCount);
    } else if (item.flangeHoleConfig && !isNaN(parseInt(String(item.flangeHoleConfig).replace(/\D/g, ''), 10))) {
      rawCount = parseInt(String(item.flangeHoleConfig).replace(/\D/g, ''), 10);
    }

    const count = isBox ? 0 : (rawCount === 16 ? 12 : rawCount);
    const identifier = (isBox || count === 0) ? '0 Holes' : ((item.flangeHoleConfig && !item.flangeHoleConfig.includes('16'))
      ? item.flangeHoleConfig
      : `HOLE-${count}H`);

    const isZero = isBox || count === 0;

    const guardObj = item.guard || item.dimensions?.guard || {};
    const hasGuard = Boolean(guardObj.hasGuard ?? guardObj.enabled);
    let initialProtMoc = item.protectionGuardMoc;
    if (!initialProtMoc) {
      if (hasGuard) {
        const mat = guardObj.material === 'SS304' ? 'SS 304' : (guardObj.material === 'Alu' ? 'Aluminum' : (guardObj.material || 'SS 304'));
        const sides = guardObj.sides === 'Both side' ? 'Both Sides' : (guardObj.sides === 'One side' ? 'One Side' : (guardObj.sides || 'Both Sides'));
        initialProtMoc = `${mat} (${sides})`;
      } else {
        initialProtMoc = 'NO Protection Grid';
      }
    }

    setHoleForm({
      filterType: isBox ? 'BOX' : 'FLANGE',
      L: confirmed.L !== undefined && confirmed.L !== null && confirmed.L !== '' ? confirmed.L : (isZero ? '-' : 100),
      M: confirmed.M !== undefined && confirmed.M !== null && confirmed.M !== '' ? confirmed.M : (isZero ? '-' : 100),
      dia: confirmed.dia !== undefined && confirmed.dia !== null && confirmed.dia !== '' ? confirmed.dia : (isZero ? '-' : 12),
      X: confirmed.X !== undefined && confirmed.X !== null ? confirmed.X : '-',
      Y: confirmed.Y !== undefined && confirmed.Y !== null ? confirmed.Y : '-',
      holeCount: count,
      flangeHoleConfig: identifier,
      tolerance: item.tolerance || '± 2 mm',
      protectionGuardMoc: initialProtMoc,
      guard: {
        hasGuard,
        material: guardObj.material || 'SS304',
        sides: guardObj.sides || 'Both side'
      }
    });
  };

  const activeItem = configData?.items?.find(it => String(it._id) === String(selectedItemId)) || null;

  // Load preview PDF for active item
  const loadItemPreview = async (item) => {
    if (!item || !salesOrderId) return;
    setPreviewLoading(true);
    setError('');
    try {
      const fType = item.filterType || item.constructionType || holeForm.filterType || 'FLANGE';
      const protMoc = holeForm.protectionGuardMoc || item.protectionGuardMoc;
      const blob = await getSalesOrderItemDrawing(salesOrderId, item._id, false, {
        filterType: fType,
        constructionType: fType,
        protectionGuardMoc: protMoc
      });
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
      }
      const url = window.URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('Error loading drawing preview:', err);
      setError(err.response?.data?.message || 'Failed to generate drawing preview for this item');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Trigger preview when active item changes or tab changes to preview
  useEffect(() => {
    if (activeItem && activeTab === 'preview' && isOpen) {
      loadItemPreview(activeItem);
    }
  }, [selectedItemId, activeTab]);

  // Handle switching active item
  const handleSelectItem = (item) => {
    setSelectedItemId(item._id);
    populateHoleForm(item);
  };

  // Handle saving confirmed hole/slot details
  const handleSaveHoleDetails = async (e) => {
    if (e) e.preventDefault();
    if (!activeItem) return;

    setError('');
    setSuccessMsg('');

    const isBox = holeForm.filterType === 'BOX';
    const isZeroHoles = isBox || Number(holeForm.holeCount) === 0;

    try {
      const payload = {
        filterType: isBox ? 'BOX' : 'FLANGE',
        constructionType: isBox ? 'BOX' : 'FLANGE',
        confirmedHoleDetails: isZeroHoles ? { L: '-', M: '-', dia: '-', X: '-', Y: '-' } : {
          L: Number(holeForm.L),
          M: Number(holeForm.M),
          dia: Number(holeForm.dia),
          X: holeForm.X,
          Y: holeForm.Y
        },
        holeCount: isBox ? 0 : Number(holeForm.holeCount),
        flangeHoleConfig: isZeroHoles ? '' : (holeForm.flangeHoleConfig || `HOLE-${holeForm.holeCount}H`),
        tolerance: holeForm.tolerance || '± 2 mm',
        protectionGuardMoc: holeForm.protectionGuardMoc || 'NO Protection Grid',
        guard: holeForm.guard || null,
        drawingStatus: 'READY_FOR_PREVIEW'
      };

      const res = await updateDrawingConfigMutation({
        id: salesOrderId,
        itemId: activeItem._id,
        data: payload,
      }).unwrap();

      if (res.success || res.config || res.items) {
        setSuccessMsg(`Drawing details confirmed for Item #${activeItem.lineNumber || activeItem.itemNumber || 1}!`);
        setActiveTab('preview');
        if (pdfBlobUrl) {
          window.URL.revokeObjectURL(pdfBlobUrl);
          setPdfBlobUrl(null);
        }
        loadItemPreview({ ...activeItem, ...payload, filterType: payload.filterType, constructionType: payload.constructionType });
      } else {
        setError(res.message || 'Failed to save hole details');
      }
    } catch (err) {
      console.error('Error saving hole details:', err);
      setError(err?.data?.message || err?.message || 'Validation error saving hole details');
    }
  };

  // Handle switching template
  const handleSelectTemplate = async (templateId) => {
    if (!activeItem) return;
    try {
      const res = await updateDrawingConfigMutation({
        id: salesOrderId,
        itemId: activeItem._id,
        data: { drawingId: templateId }
      }).unwrap();
      if (res.success || res.config) {
        setSuccessMsg('Drawing template updated successfully!');
        setActiveTab('preview');
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to update template');
    }
  };

  // Print single drawing
  const handlePrintSingle = async () => {
    if (!activeItem) return;
    setActionLoading(true);
    try {
      const fType = holeForm.filterType || activeItem.filterType || activeItem.constructionType || 'FLANGE';
      const protMoc = holeForm.protectionGuardMoc || activeItem.protectionGuardMoc;
      const blob = await getSalesOrderItemDrawing(salesOrderId, activeItem._id, false, {
        filterType: fType,
        constructionType: fType,
        protectionGuardMoc: protMoc
      });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to print drawing');
    } finally {
      setActionLoading(false);
    }
  };

  // Download single drawing
  const handleDownloadSingle = async () => {
    if (!activeItem) return;
    setActionLoading(true);
    try {
      const fType = holeForm.filterType || activeItem.filterType || activeItem.constructionType || 'FLANGE';
      const protMoc = holeForm.protectionGuardMoc || activeItem.protectionGuardMoc;
      const blob = await getSalesOrderItemDrawing(salesOrderId, activeItem._id, true, {
        filterType: fType,
        constructionType: fType,
        protectionGuardMoc: protMoc
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Drawing-${configData?.salesOrder?.salesOrderNo || 'SO'}-Item${activeItem.itemNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download drawing');
    } finally {
      setActionLoading(false);
    }
  };

  // Print all drawings (combined multi-page PDF)
  const handlePrintAll = async () => {
    setActionLoading(true);
    try {
      const blob = await getSalesOrderDrawings(salesOrderId, false);
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate combined drawings');
    } finally {
      setActionLoading(false);
    }
  };

  // Download all drawings (combined multi-page PDF)
  const handleDownloadAll = async () => {
    setActionLoading(true);
    try {
      const blob = await getSalesOrderDrawings(salesOrderId, true);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Drawings-All-${configData?.salesOrder?.salesOrderNo || 'SO'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download combined drawings');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeComponent = (status) => {
    switch (status) {
      case 'READY_FOR_PREVIEW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Ready for Preview</span>;
      case 'PDF_GENERATED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">PDF Generated</span>;
      case 'REQUIRES_ATTENTION':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Requires Attention</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Not Configured</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <Printer size={18} className="text-blue-600" />
            Engineering Drawing Printing Workspace
          </span>
          {configData?.salesOrder?.salesOrderNo && (
            <span className="font-mono text-sm px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
              {configData.salesOrder.salesOrderNo}
            </span>
          )}
        </div>
      }
      size="full"
      maxWidth="1400px"
      zIndex={1050}
    >
      <div className="flex flex-col h-[82vh] -mx-4 -my-4">
        {/* Top Header Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Party / Customer</span>
              <strong className="text-slate-900 font-semibold">
                {configData?.salesOrder?.clientName || 'Loading...'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer PO No</span>
              <strong className="text-slate-900 font-semibold">
                {configData?.salesOrder?.customerPoNumber || '-'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Quotation Ref</span>
              <strong className="text-slate-900 font-mono">
                {configData?.salesOrder?.quotationNo || '-'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Date</span>
              <strong className="text-slate-900">
                {configData?.salesOrder?.salesOrderDate ? new Date(configData.salesOrder.salesOrderDate).toLocaleDateString('en-GB') : '-'}
              </strong>
            </div>
          </div>

          {/* Global Header Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintAll}
              disabled={actionLoading || loading}
              title="Generate & Print multi-page engineering drawing booklet for all order line items"
              className="text-xs font-semibold h-[34px]"
            >
              <Printer size={14} className="mr-1.5 text-blue-600" /> Print All Drawings
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAll}
              disabled={actionLoading || loading}
              title="Download combined multi-page PDF"
              className="text-xs font-semibold h-[34px] bg-blue-700 hover:bg-blue-800"
            >
              <Download size={14} className="mr-1.5" /> Download Combined PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadWorkspaceConfig()}
              disabled={loading}
              title="Refresh drawings configuration"
              className="h-[34px] px-2 text-slate-500"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Alerts Strip */}
        {error && (
          <div className="px-6 pt-2 shrink-0">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}
        {successMsg && (
          <div className="px-6 pt-2 shrink-0">
            <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
          </div>
        )}

        {/* Main Body: Two-Column Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Product Line Items Sidebar */}
          <div className="w-[360px] border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" />
                Order Line Items ({configData?.items?.length || 0})
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">1 Drawing / Page</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-blue-600" />
                  Loading order drawings & configurations...
                </div>
              ) : configData?.items?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No line items found for this Sales Order.
                </div>
              ) : (
                configData?.items?.map((it) => {
                  const isSelected = String(it._id) === String(selectedItemId);
                  const dims = it.dimensions || {};
                  return (
                    <div
                      key={it._id}
                      onClick={() => handleSelectItem(it)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center font-mono">
                            {it.itemNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[190px]">
                            {it.description}
                          </span>
                        </div>
                        {getStatusBadgeComponent(it.drawingStatus)}
                      </div>

                      <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-3">
                        <span>Qty: <strong className="text-slate-800">{it.quantity} {it.uom}</strong></span>
                        <span>Grade: <strong className="text-blue-700">{it.grade}</strong></span>
                      </div>

                      {/* Dimensions pills */}
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Body:</span>
                          <strong className="font-mono text-slate-800">
                            {dims.bodyWidth || dims.A} × {dims.bodyHeight || dims.B} × {dims.depth || dims.C} mm
                          </strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Holes:</span>
                          <strong className="font-mono text-blue-700">
                            {it.holeCount ?? 12} Holes (L: {it.confirmedHoleDetails?.L ?? 100}, M: {it.confirmedHoleDetails?.M ?? 100}, Ø: {it.confirmedHoleDetails?.dia ?? 12})
                          </strong>
                        </div>
                      </div>

                      {!it.isEligible && (
                        <div className="mt-2 text-[10.5px] text-amber-700 bg-amber-50 rounded px-2 py-1 border border-amber-200">
                          {it.ineligibilityReason || 'Drawing not eligible'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Drawing Workspace */}
          {activeItem ? (
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Item Header & Tabs Strip */}
              <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                      Item #{activeItem.itemNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeItem.description}
                    </h3>
                  </div>
                  {getStatusBadgeComponent(activeItem.drawingStatus)}
                </div>

                {/* Item-specific Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintSingle}
                    disabled={actionLoading || previewLoading}
                    className="text-xs font-semibold h-[32px]"
                  >
                    <Printer size={13} className="mr-1 text-blue-600" /> Print Selected
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadSingle}
                    disabled={actionLoading || previewLoading}
                    className="text-xs font-semibold h-[32px]"
                  >
                    <Download size={13} className="mr-1" /> Download PDF
                  </Button>
                </div>
              </div>

              {/* Navigation Tabs for Active Item */}
              <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex gap-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                    activeTab === 'preview'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye size={14} /> Drawing Sheet Preview (A4 Vector)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('holes')}
                  className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                    activeTab === 'holes'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Settings size={14} /> {holeForm.filterType === 'BOX' ? 'Filter Box Details & Drawing' : 'Filter Flange with Hole / Slot Details'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                    activeTab === 'templates'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText size={14} /> Template & Specifications
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
                {/* TAB 1: DRAWING SHEET PREVIEW */}
                {activeTab === 'preview' && (
                  <div className="h-full flex flex-col items-center">
                    {previewLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <RefreshCw size={28} className="animate-spin text-blue-600" />
                        <span className="text-xs font-medium">Generating dynamic vector drawing for Item #{activeItem.itemNumber}...</span>
                      </div>
                    ) : pdfBlobUrl ? (
                      <div className="w-full h-full flex flex-col items-center">
                        <div className="w-full flex items-center justify-between bg-white px-4 py-2 border border-slate-200 rounded-t-xl text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">
                            Client Reference Engineering Drawing Format — Item #{activeItem.itemNumber} ({activeItem.description})
                          </span>
                          <button
                            type="button"
                            onClick={() => window.open(pdfBlobUrl, '_blank')}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <ExternalLink size={13} /> Open Full View
                          </button>
                        </div>
                        <iframe
                          src={pdfBlobUrl}
                          title={`Drawing-Preview-Item-${activeItem.itemNumber}`}
                          className="w-full flex-1 border-x border-b border-slate-200 rounded-b-xl shadow-lg bg-white"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <AlertCircle size={28} className="text-amber-500" />
                        <span className="text-xs font-medium">No preview available. Please confirm hole details or template.</span>
                        <Button variant="secondary" size="sm" onClick={() => loadItemPreview(activeItem)}>
                          Load Preview
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: FILTER FLANGE / BOX WITH HOLE / SLOT DETAILS */}
                {activeTab === 'holes' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className={`border rounded-xl p-4 flex items-start gap-3 text-xs transition-colors ${
                      holeForm.filterType === 'BOX'
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}>
                      <Info size={18} className={`shrink-0 mt-0.5 ${holeForm.filterType === 'BOX' ? 'text-purple-600' : 'text-blue-600'}`} />
                      <div>
                        <strong className="block font-bold mb-0.5">
                          {holeForm.filterType === 'BOX'
                            ? 'Pre-Printing Confirmation: Box Type Filter (Front View Drawing)'
                            : 'Pre-Printing Confirmation: Filter Flange with Hole / Slot Details'}
                        </strong>
                        <span>
                          {holeForm.filterType === 'BOX'
                            ? 'Box type filters have no flange mounting holes. The filter\'s existing Front View drawing from Drawing Master is displayed in the drawing section and embedded into the production PDF.'
                            : 'The client drawing requires explicit mounting hole positions, spacing, and diameters. Confirm or update the parameters below. Changes are saved directly to this Sales Order line item without modifying the master product or enquiry records.'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Side: Editable Parameters Form */}
                      <form onSubmit={handleSaveHoleDetails} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Filter Configuration & Mounting Parameters
                          </h4>
                        </div>

                        {/* Filter Type Selector (BOX vs FLANGE) */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Filter Type
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setHoleForm(prev => ({
                                ...prev,
                                filterType: 'BOX',
                                holeCount: 0,
                                flangeHoleConfig: '',
                                L: '-',
                                M: '-',
                                dia: '-',
                                X: '-',
                                Y: '-'
                              }))}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                holeForm.filterType === 'BOX'
                                  ? 'bg-purple-700 text-white border-purple-700 shadow-sm ring-2 ring-purple-300'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <Box size={14} /> Box Type (No Holes)
                            </button>
                            <button
                              type="button"
                              onClick={() => setHoleForm(prev => ({
                                ...prev,
                                filterType: 'FLANGE',
                                holeCount: prev.holeCount && prev.holeCount > 0 ? prev.holeCount : 12,
                                flangeHoleConfig: prev.flangeHoleConfig || 'HOLE-12H',
                                L: prev.L && prev.L !== '-' ? prev.L : 100,
                                M: prev.M && prev.M !== '-' ? prev.M : 100,
                                dia: prev.dia && prev.dia !== '-' ? prev.dia : 12
                              }))}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                holeForm.filterType === 'FLANGE'
                                  ? 'bg-blue-700 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <Layers size={14} /> Flange Type
                            </button>
                          </div>
                        </div>

                        {holeForm.filterType === 'BOX' ? (
                          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                            <strong className="block font-bold text-purple-950 flex items-center gap-1">
                              <Box size={13} className="text-purple-700" />
                              Box Construction Confirmed
                            </strong>
                            <p className="text-[11px] text-purple-800">
                              Box filters do not have mounting flange holes. The Filter's existing Front View image from Drawing Master is loaded in the drawing area and no holes drawing will be displayed.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Hole Count Selector */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                  Hole Count
                                </label>
                                {loadingHoleImages && (
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <RefreshCw size={10} className="animate-spin" /> Fetching from Drawing Master...
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {availableHoleCounts.map((cnt) => {
                                  const matchingPattern = drawingMasterHolePatterns.find(p => Number(p.holes) === Number(cnt));
                                  const targetCode = matchingPattern?.drawingCode || `HOLE-${cnt}H`;
                                  const isSelected = Number(holeForm.holeCount) === cnt;
                                  return (
                                    <button
                                      key={cnt}
                                      type="button"
                                      onClick={() => {
                                        const isZero = Number(cnt) === 0;
                                        setHoleForm(prev => ({
                                          ...prev,
                                          holeCount: cnt,
                                          flangeHoleConfig: isZero ? '0 Holes' : targetCode,
                                          L: isZero ? '-' : (prev.L === '-' ? 100 : prev.L),
                                          M: isZero ? '-' : (prev.M === '-' ? 100 : prev.M),
                                          dia: isZero ? '-' : (prev.dia === '-' ? 12 : prev.dia),
                                          X: isZero ? '-' : (prev.X === '-' ? '-' : prev.X),
                                          Y: isZero ? '-' : (prev.Y === '-' ? '-' : prev.Y)
                                        }));
                                      }}
                                      className={`py-1.5 px-3.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                      }`}
                                    >
                                      {cnt} Holes
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Pattern Variant selector if multiple variants exist in Drawing Master for this hole count (excluding 0 holes) */}
                              {Number(holeForm.holeCount) > 0 && (() => {
                                const variantsForCount = drawingMasterHolePatterns.filter(
                                  p => Number(p.holes) === Number(holeForm.holeCount)
                                );
                                if (variantsForCount.length <= 1) return null;

                                return (
                                  <div className="mt-2.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                                    <label className="block text-[11px] font-bold text-blue-900 mb-1">
                                      Hole Pattern Variant for {holeForm.holeCount} Holes:
                                    </label>
                                    <select
                                      value={holeForm.flangeHoleConfig}
                                      onChange={(e) => {
                                        const selectedCode = e.target.value;
                                        setHoleForm(prev => ({
                                          ...prev,
                                          flangeHoleConfig: selectedCode
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      {variantsForCount.map(v => (
                                        <option key={v.drawingCode} value={v.drawingCode}>
                                          {v.drawingCode} {v.description ? `(${v.description})` : (v.drawingName ? `(${v.drawingName})` : '')}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}
                            </div>

                            {Number(holeForm.holeCount) === 0 ? (
                              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-purple-800">
                                  <CheckCircle size={14} className="text-purple-600" /> Solid Flange (0 Holes Selected)
                                </div>
                                <p className="text-[11px] text-purple-700">
                                  This flange filter will be manufactured without holes. Hole pattern subtable coordinates (L, M, Ø, X, Y) will be displayed as <strong>'-'</strong>.
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* L, M, Ø Inputs */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      L (Pitch/Offset)
                                    </label>
                                    <input
                                      type="number"
                                      required
                                      value={holeForm.L}
                                      onChange={(e) => setHoleForm({ ...holeForm, L: e.target.value })}
                                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="100"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">mm</span>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      M (Spacing)
                                    </label>
                                    <input
                                      type="number"
                                      required
                                      value={holeForm.M}
                                      onChange={(e) => setHoleForm({ ...holeForm, M: e.target.value })}
                                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="100"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">mm</span>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Ø (Hole Dia)
                                    </label>
                                    <input
                                      type="number"
                                      required
                                      value={holeForm.dia}
                                      onChange={(e) => setHoleForm({ ...holeForm, dia: e.target.value })}
                                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="12"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">mm</span>
                                  </div>
                                </div>

                                {/* X and Y Slot Inputs */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                      X (Slot Width or -)
                                    </label>
                                    <input
                                      type="text"
                                      value={holeForm.X}
                                      onChange={(e) => setHoleForm({ ...holeForm, X: e.target.value })}
                                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="-"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                      Y (Slot Length or -)
                                    </label>
                                    <input
                                      type="text"
                                      value={holeForm.Y}
                                      onChange={(e) => setHoleForm({ ...holeForm, Y: e.target.value })}
                                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="-"
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Flange Hole Config Code */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Configuration Identifier
                              </label>
                              <input
                                type="text"
                                value={holeForm.flangeHoleConfig}
                                onChange={(e) => setHoleForm({ ...holeForm, flangeHoleConfig: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="HOLE-12H"
                              />
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Hole pattern ID</span>
                            </div>
                          </>
                        )}

                        {/* Tolerance input (always editable) */}
                        <div className="pt-1">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Tolerance (mm)
                          </label>
                          <input
                            type="text"
                            value={holeForm.tolerance}
                            onChange={(e) => setHoleForm({ ...holeForm, tolerance: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="± 2 mm"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Shown on Drawing PDF</span>
                        </div>

                        {/* Protection Guard (MOC) Configuration */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                              <Shield size={13} className={holeForm.guard?.hasGuard ? "text-blue-600" : "text-slate-400"} />
                              <span>Protection Guard (MOC)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-600 select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(holeForm.guard?.hasGuard)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const currentMat = holeForm.guard?.material || 'SS304';
                                  const currentSides = holeForm.guard?.sides || 'Both side';
                                  const newGuard = {
                                    hasGuard: checked,
                                    material: currentMat,
                                    sides: currentSides
                                  };
                                  const formattedMoc = checked
                                    ? `${currentMat === 'SS304' ? 'SS 304' : (currentMat === 'Alu' ? 'Aluminum' : currentMat)} (${currentSides === 'Both side' ? 'Both Sides' : 'One Side'})`
                                    : 'NO Protection Grid';
                                  setHoleForm({
                                    ...holeForm,
                                    guard: newGuard,
                                    protectionGuardMoc: formattedMoc
                                  });
                                }}
                                className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 cursor-pointer"
                              />
                              <span className={holeForm.guard?.hasGuard ? "text-blue-700 font-bold" : "text-slate-500"}>
                                {holeForm.guard?.hasGuard ? "Guard Included" : "No Guard"}
                              </span>
                            </label>
                          </div>

                          {holeForm.guard?.hasGuard ? (
                            <div className="space-y-2 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-600 block mb-1 font-semibold">Material</span>
                                  <div className="flex gap-1">
                                    {[
                                      { id: 'SS304', label: 'SS 304' },
                                      { id: 'Alu', label: 'Aluminum' },
                                      { id: 'GI', label: 'GI' }
                                    ].map(m => {
                                      const isSel = (holeForm.guard?.material || 'SS304') === m.id;
                                      return (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => {
                                            const newMat = m.id;
                                            const sides = holeForm.guard?.sides || 'Both side';
                                            const newGuard = { ...holeForm.guard, material: newMat, hasGuard: true };
                                            const formattedMoc = `${m.label} (${sides === 'Both side' ? 'Both Sides' : 'One Side'})`;
                                            setHoleForm({ ...holeForm, guard: newGuard, protectionGuardMoc: formattedMoc });
                                          }}
                                          className={`flex-1 py-1 px-1 rounded text-[11px] font-semibold border transition-all ${
                                            isSel ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          {m.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-600 block mb-1 font-semibold">Placement</span>
                                  <div className="flex gap-1">
                                    {[
                                      { id: 'Both side', label: 'Both Sides' },
                                      { id: 'One side', label: 'One Side' }
                                    ].map(s => {
                                      const isSel = (holeForm.guard?.sides || 'Both side') === s.id;
                                      return (
                                        <button
                                          key={s.id}
                                          type="button"
                                          onClick={() => {
                                            const newSides = s.id;
                                            const mat = holeForm.guard?.material || 'SS304';
                                            const matLabel = mat === 'SS304' ? 'SS 304' : (mat === 'Alu' ? 'Aluminum' : mat);
                                            const newGuard = { ...holeForm.guard, sides: newSides, hasGuard: true };
                                            const formattedMoc = `${matLabel} (${s.label})`;
                                            setHoleForm({ ...holeForm, guard: newGuard, protectionGuardMoc: formattedMoc });
                                          }}
                                          className={`flex-1 py-1 px-1 rounded text-[11px] font-semibold border transition-all ${
                                            isSel ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          {s.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-500 block mb-0.5">Value on Drawing PDF:</label>
                                <input
                                  type="text"
                                  value={holeForm.protectionGuardMoc || ''}
                                  onChange={(e) => setHoleForm({ ...holeForm, protectionGuardMoc: e.target.value })}
                                  className="w-full px-2 py-1 text-xs font-semibold border border-blue-300 rounded bg-white text-slate-800"
                                  placeholder="SS 304 (Both Sides)"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between">
                              <span>NO Protection Grid</span>
                              <span className="text-[10px] text-slate-400 not-italic">Check box to configure Guard</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => populateHoleForm(activeItem)}
                            className="text-xs"
                          >
                            Reset
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={savingHoles}
                            className={`text-xs font-bold px-4 ${
                              holeForm.filterType === 'BOX'
                                ? 'bg-purple-700 hover:bg-purple-800'
                                : 'bg-blue-700 hover:bg-blue-800'
                            }`}
                          >
                            <CheckCircle2 size={14} className="mr-1.5" />
                            {savingHoles ? 'Saving...' : 'Save & Confirm Details'}
                          </Button>
                        </div>
                      </form>

                      {/* Right Side: Actual Uploaded Drawing Preview */}
                      <div>
                        {(() => {
                          const filterType = (holeForm.filterType || activeItem?.filterType || activeItem?.constructionType || 'FLANGE').toUpperCase();
                          const isBox = filterType === 'BOX';

                          let currentDrawingUrl = '';
                          let currentDrawingCode = '';
                          let currentDrawingName = '';
                          let frontUrl = '';
                          let matchingHolePattern = null;

                          if (isBox) {
                            // 1. Box Type Selection:
                            // Box type has no flange holes. Do not display a Holes Drawing.
                            // Instead, display the Filter's existing Front View image in the same drawing area.
                            frontUrl = activeItem?.frontViewImage?.url 
                              || activeItem?.selectedDrawing?.frontViewImage?.url 
                              || activeItem?.selectedDrawing?.fileUrl 
                              || activeItem?.drawingSnapshot?.frontViewImage?.url 
                              || activeItem?.drawingSnapshot?.fileUrl 
                              || activeItem?.drawingFileUrl 
                              || '';

                            currentDrawingUrl = getVersionedImageUrl(
                              frontUrl,
                              activeItem?.selectedDrawing?.updatedAt || activeItem?.updatedAt
                            );

                            currentDrawingCode = activeItem?.selectedDrawing?.drawingCode 
                              || activeItem?.drawingSnapshot?.drawingCode 
                              || activeItem?.drawingCode 
                              || 'BOX-FILTER';

                            currentDrawingName = activeItem?.selectedDrawing?.drawingName 
                              || activeItem?.drawingSnapshot?.drawingName 
                              || activeItem?.drawingName 
                              || `${activeItem?.description || 'Box Filter'} - Front View`;
                          } else if (Number(holeForm.holeCount) === 0) {
                            // 2. Flange Type with 0 Holes: Solid Flange
                            matchingHolePattern = null;
                            currentDrawingUrl = '';
                            currentDrawingCode = 'HOLE-0H';
                            currentDrawingName = 'Solid Flange (No Holes)';
                            frontUrl = '';
                          } else {
                            // 3. Flange Type with Holes:
                            // Continue displaying the existing Holes Drawing.
                            matchingHolePattern = drawingMasterHolePatterns.find(
                              p => p.drawingCode === holeForm.flangeHoleConfig
                            ) || drawingMasterHolePatterns.find(
                              p => Number(p.holes) === Number(holeForm.holeCount)
                            ) || (configData?.availableHoleConfigurations || []).find(
                              p => p.drawingCode === holeForm.flangeHoleConfig || Number(p.holes) === Number(holeForm.holeCount)
                            ) || activeItem?.holePattern;

                            const rawDrawingUrl = matchingHolePattern?.fileUrl 
                              || matchingHolePattern?.holeImageUrl 
                              || activeItem?.drawingFileUrl
                              || activeItem?.selectedDrawing?.fileUrl 
                              || activeItem?.selectedDrawing?.holeImageUrl
                              || activeItem?.drawingSnapshot?.fileUrl 
                              || '';

                            currentDrawingUrl = getVersionedImageUrl(
                              rawDrawingUrl,
                              matchingHolePattern?.updatedAt || activeItem?.selectedDrawing?.updatedAt
                            );

                            currentDrawingCode = matchingHolePattern?.drawingCode 
                              || activeItem?.drawingCode 
                              || activeItem?.selectedDrawing?.drawingCode 
                              || activeItem?.drawingSnapshot?.drawingCode 
                              || holeForm.flangeHoleConfig 
                              || 'DRAWING';

                            currentDrawingName = matchingHolePattern?.drawingName 
                              || activeItem?.drawingName 
                              || activeItem?.selectedDrawing?.drawingName 
                              || activeItem?.drawingSnapshot?.drawingName 
                              || 'Filter Flange Technical Drawing';

                            frontUrl = matchingHolePattern?.frontViewImage?.url 
                              || currentDrawingUrl;
                          }

                          const isZeroHoles = isBox || Number(holeForm.holeCount) === 0;

                          return (
                            <UploadedFlangeDrawingViewer
                              drawingUrl={currentDrawingUrl}
                              frontViewUrl={frontUrl}
                              sideViewUrl={isZeroHoles ? '' : (matchingHolePattern?.sideViewImage?.url || '')}
                              pictorialViewUrl={isZeroHoles ? '' : (matchingHolePattern?.pictorialViewImage?.url || '')}
                              drawingCode={currentDrawingCode}
                              drawingName={currentDrawingName}
                              filterType={filterType}
                              isBox={isBox}
                              holeCount={isBox ? 0 : Number(holeForm.holeCount)}
                              L={isZeroHoles ? '-' : holeForm.L}
                              M={isZeroHoles ? '-' : holeForm.M}
                              dia={isZeroHoles ? '-' : holeForm.dia}
                              A={activeItem.dimensions?.A || 610}
                              B={activeItem.dimensions?.B || 610}
                              X={isZeroHoles ? '-' : holeForm.X}
                              Y={isZeroHoles ? '-' : holeForm.Y}
                              tolerance={holeForm.tolerance || activeItem.tolerance || '± 2 mm'}
                              onInspectFull={(url, code, name) => setInspectDrawingModal({ url, code, name })}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TEMPLATE & SPECIFICATIONS */}
                {activeTab === 'templates' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Eligible Templates Section */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Drawing Master Templates for Grade: {activeItem.grade}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            The system automatically selects the matching Drawing Master template. You can override it below.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(activeItem.eligibleTemplates || []).length === 0 ? (
                          <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                            No Drawing Master templates found matching filter grade "{activeItem.grade}".
                          </div>
                        ) : (
                          activeItem.eligibleTemplates.map((tpl) => {
                            const isCurrent = String(tpl._id) === String(activeItem.selectedDrawingId);
                            return (
                              <div
                                key={tpl._id}
                                onClick={() => handleSelectTemplate(tpl._id)}
                                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                                  isCurrent
                                    ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600/30'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                  {tpl.fileUrl ? (
                                    <img src={tpl.fileUrl} alt={tpl.drawingName} className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                    <FileText size={20} className="text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {tpl.drawingName || tpl.drawingCode}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    Code: {tpl.drawingCode}
                                  </div>
                                  <div className="text-[10.5px] text-slate-400 mt-1">
                                    Format: {(tpl.format || 'SVG').toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Filter Specifications Table */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Filter Specifications (Printed on Engineering Drawing)
                        </h4>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {activeItem?.grade || 'Grade 11'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Grade:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.grade || 'Grade 11'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Efficiency:</span>
                          <strong className="text-slate-900 font-semibold">
                            {activeItem?.efficiency || '99.97% @ 0.3 µm'}
                          </strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Micron Rating:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.micronRating || '0.3 µm'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Initial Pressure Drop:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.initialPressureDrop || '20 mm of WC'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Final Pressure Drop:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.finalPressureDrop || '70 mm of WC'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Separator:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.separator || 'Corrugated Aluminium Separator'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">No. of Folds:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.noOfFolds || '72 - 76 Folds'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Max Operating Temperature:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.maxOperatingTemperature || 'Up To 120 ° C'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Material of Casing:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.casingMaterial || activeItem?.dimensions?.moc || 'Aluminum Anodized'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Media:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.media || 'Imported Submicronic Glass Fiber'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Bonding:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.bonding || 'PU Bonding'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Gasket MOC:</span>
                          <strong className="text-slate-900 font-semibold">{activeItem?.gasketMoc || 'EPDM'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Protection Guard (MOC):</span>
                          <strong className="text-slate-900 font-semibold">{holeForm.protectionGuardMoc || activeItem?.protectionGuardMoc || 'NO Protection Grid'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 bg-emerald-50/50 px-2 rounded">
                          <span className="text-emerald-800 font-medium">Dimensional Tolerance:</span>
                          <strong className="text-emerald-950 font-bold font-mono">{holeForm.tolerance || activeItem?.tolerance || '± 2 mm'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Notes Section Preview */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                        Drawing Notes
                      </h4>
                      <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1 font-mono">
                        <li>PLEASE DO NOT MAKE HOLES ON THE CORNER JOINTS OF THE EXTRUDED FLANGES</li>
                        <li>TEST CERTIFICATES WILL BE AS PER APPROVED DRAWINGS ONLY</li>
                        <li>GENERAL DIMENSIONAL TOLERANCE: {holeForm.tolerance || activeItem?.tolerance || '± 2 mm'}</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select an order line item from the left sidebar to preview and configure its drawing.
            </div>
          )}
        </div>
      </div>

      {/* Full Resolution Inspection Modal */}
      {inspectDrawingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {inspectDrawingModal.code}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {inspectDrawingModal.name || 'Technical Flange Drawing'} — Full Resolution Inspection
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectDrawingModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/60 min-h-[400px]">
              <img
                src={inspectDrawingModal.url}
                alt={inspectDrawingModal.name || 'Full Drawing'}
                className="max-w-full max-h-[75vh] object-contain shadow-md rounded border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SalesOrderDrawingWorkspaceModal;
