import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  getSalesOrderDrawingsConfig,
  updateSalesOrderItemDrawingConfig,
  getSalesOrderItemDrawing,
  getSalesOrderDrawings
} from '../../services/salesOrderService';
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
  Sparkles
} from 'lucide-react';

/**
 * Helper to render dynamic SVG Flange Diagram with mounting holes
 */
const DynamicFlangeDiagram = ({ holeCount = 12, L = 100, M = 100, dia = 12, A = 610, B = 610 }) => {
  const count = Number(holeCount) || 12;
  const size = 260;
  const pad = 35;
  const outerW = size - pad * 2;
  const outerH = size - pad * 2;
  const flangeThick = 24;
  const innerW = outerW - flangeThick * 2;
  const innerH = outerH - flangeThick * 2;

  // Calculate hole positions along the flange
  const holes = [];
  const radius = 4;

  const left = pad;
  const top = pad;
  const right = pad + outerW;
  const bottom = pad + outerH;
  const midX = pad + flangeThick / 2;
  const midRightX = right - flangeThick / 2;
  const midY = top + flangeThick / 2;
  const midBottomY = bottom - flangeThick / 2;

  if (count === 4) {
    holes.push({ x: midX, y: midY });
    holes.push({ x: midRightX, y: midY });
    holes.push({ x: midX, y: midBottomY });
    holes.push({ x: midRightX, y: midBottomY });
  } else if (count === 8) {
    // 3 per side, sharing corners or 2 per side
    // Top
    holes.push({ x: midX + 15, y: midY });
    holes.push({ x: left + outerW / 2, y: midY });
    holes.push({ x: midRightX - 15, y: midY });
    // Bottom
    holes.push({ x: midX + 15, y: midBottomY });
    holes.push({ x: left + outerW / 2, y: midBottomY });
    holes.push({ x: midRightX - 15, y: midBottomY });
    // Left & Right mid
    holes.push({ x: midX, y: top + outerH / 2 });
    holes.push({ x: midRightX, y: top + outerH / 2 });
  } else {
    // 12 holes or dynamic
    const perHoriz = Math.max(3, Math.ceil(count / 3));
    const perVert = Math.max(2, Math.floor((count - perHoriz * 2) / 2));

    // Top edge holes
    for (let i = 0; i < perHoriz; i++) {
      const frac = perHoriz === 1 ? 0.5 : i / (perHoriz - 1);
      const x = (midX + 10) + frac * (outerW - flangeThick - 20);
      holes.push({ x, y: midY });
    }
    // Bottom edge holes
    for (let i = 0; i < perHoriz; i++) {
      const frac = perHoriz === 1 ? 0.5 : i / (perHoriz - 1);
      const x = (midX + 10) + frac * (outerW - flangeThick - 20);
      holes.push({ x, y: midBottomY });
    }
    // Left & Right side middle holes
    for (let i = 1; i <= perVert; i++) {
      const frac = i / (perVert + 1);
      const y = (midY) + frac * (outerH - flangeThick);
      holes.push({ x: midX, y });
      holes.push({ x: midRightX, y });
    }
  }

  return (
    <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles size={14} className="text-blue-600" />
        Flange Dynamic Hole Geometry
      </div>

      <svg width={size} height={size + 20} className="overflow-visible">
        {/* Outer flange border */}
        <rect
          x={left}
          y={top}
          width={outerW}
          height={outerH}
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth="1.8"
        />

        {/* Inner casing opening */}
        <rect
          x={left + flangeThick}
          y={top + flangeThick}
          width={innerW}
          height={innerH}
          fill="#ffffff"
          stroke="#334155"
          strokeWidth="1.2"
          strokeDasharray="4 2"
        />

        {/* Dimension B (bottom width) */}
        <line x1={left} y1={bottom + 12} x2={right} y2={bottom + 12} stroke="#64748b" strokeWidth="1" />
        <line x1={left} y1={bottom + 7} x2={left} y2={bottom + 17} stroke="#64748b" strokeWidth="1" />
        <line x1={right} y1={bottom + 7} x2={right} y2={bottom + 17} stroke="#64748b" strokeWidth="1" />
        <text x={left + outerW / 2} y={bottom + 22} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
          B = {B} mm
        </text>

        {/* Dimension A (right height) */}
        <line x1={right + 12} y1={top} x2={right + 12} y2={bottom} stroke="#64748b" strokeWidth="1" />
        <line x1={right + 7} y1={top} x2={right + 17} y2={top} stroke="#64748b" strokeWidth="1" />
        <line x1={right + 7} y1={bottom} x2={right + 17} y2={bottom} stroke="#64748b" strokeWidth="1" />
        <text x={right + 22} y={top + outerH / 2 + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155" transform={`rotate(90 ${right + 22} ${top + outerH / 2 + 3})`}>
          A = {A} mm
        </text>

        {/* Dimension markers: M TYP (top) */}
        {holes.length >= 2 && (
          <g>
            <line x1={holes[0].x} y1={top - 6} x2={holes[1].x} y2={top - 6} stroke="#2563eb" strokeWidth="1" />
            <line x1={holes[0].x} y1={top - 10} x2={holes[0].x} y2={top - 2} stroke="#2563eb" strokeWidth="1" />
            <line x1={holes[1].x} y1={top - 10} x2={holes[1].x} y2={top - 2} stroke="#2563eb" strokeWidth="1" />
            <text x={(holes[0].x + holes[1].x) / 2} y={top - 11} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2563eb">
              M = {M} TYP
            </text>
          </g>
        )}

        {/* Dimension markers: L TYP (left) */}
        {holes.length >= 2 && (
          <g>
            <line x1={left - 6} y1={midY} x2={left - 6} y2={midY + 30} stroke="#2563eb" strokeWidth="1" />
            <line x1={left - 10} y1={midY} x2={left - 2} y2={midY} stroke="#2563eb" strokeWidth="1" />
            <line x1={left - 10} y1={midY + 30} x2={left - 2} y2={midY + 30} stroke="#2563eb" strokeWidth="1" />
            <text x={left - 12} y={midY + 18} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2563eb" transform={`rotate(-90 ${left - 12} ${midY + 18})`}>
              L = {L} TYP
            </text>
          </g>
        )}

        {/* Render Holes */}
        {holes.map((h, i) => (
          <circle
            key={i}
            cx={h.x}
            cy={h.y}
            r={radius}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
        ))}

        {/* Center crosshairs for holes */}
        {holes.map((h, i) => (
          <g key={`cross-${i}`}>
            <line x1={h.x - 6} y1={h.y} x2={h.x + 6} y2={h.y} stroke="#64748b" strokeWidth="0.7" />
            <line x1={h.x} y1={h.y - 6} x2={h.x} y2={h.y + 6} stroke="#64748b" strokeWidth="0.7" />
          </g>
        ))}
      </svg>

      {/* Hole count badge */}
      <div className="mt-2 flex items-center justify-between w-full px-2 text-xs">
        <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-[11px] shadow-sm">
          No.Of Holes = {count}
        </span>
        <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
          Ø = {dia} mm
        </span>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [configData, setConfigData] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'holes' | 'templates'

  // Item form states
  const [holeForm, setHoleForm] = useState({
    L: 100,
    M: 100,
    dia: 12,
    X: '-',
    Y: '-',
    holeCount: 12,
    flangeHoleConfig: 'HOLE-12H'
  });
  const [savingHoles, setSavingHoles] = useState(false);

  // PDF Preview states
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load configuration
  const loadWorkspaceConfig = async (preferredItemId = null) => {
    if (!salesOrderId || !isOpen) return;
    setLoading(true);
    setError('');
    try {
      const res = await getSalesOrderDrawingsConfig(salesOrderId);
      if (res.success) {
        setConfigData(res);
        const items = res.items || [];
        if (items.length > 0) {
          const targetItem = preferredItemId
            ? items.find(it => String(it._id) === String(preferredItemId)) || items[0]
            : (selectedItemId ? items.find(it => String(it._id) === String(selectedItemId)) || items[0] : items[0]);

          setSelectedItemId(targetItem._id);
          populateHoleForm(targetItem);
        }
      } else {
        setError(res.message || 'Failed to load drawing workspace configuration');
      }
    } catch (err) {
      console.error('Error loading drawing workspace:', err);
      setError(err.response?.data?.message || err.message || 'Server error loading drawings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWorkspaceConfig(initialItemId);
    } else {
      // Clean up blob URL on close
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }
  }, [isOpen, salesOrderId, initialItemId]);

  // Populate hole form when active item changes
  const populateHoleForm = (item) => {
    if (!item) return;
    const confirmed = item.confirmedHoleDetails || {};
    setHoleForm({
      L: confirmed.L !== undefined ? confirmed.L : 100,
      M: confirmed.M !== undefined ? confirmed.M : 100,
      dia: confirmed.dia !== undefined ? confirmed.dia : 12,
      X: confirmed.X !== undefined ? confirmed.X : '-',
      Y: confirmed.Y !== undefined ? confirmed.Y : '-',
      holeCount: item.holeCount || 12,
      flangeHoleConfig: item.flangeHoleConfig || `HOLE-${item.holeCount || 12}H`
    });
  };

  const activeItem = configData?.items?.find(it => String(it._id) === String(selectedItemId)) || null;

  // Load preview PDF for active item
  const loadItemPreview = async (item) => {
    if (!item || !salesOrderId) return;
    setPreviewLoading(true);
    setError('');
    try {
      const blob = await getSalesOrderItemDrawing(salesOrderId, item._id, false);
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

    setSavingHoles(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        confirmedHoleDetails: {
          L: Number(holeForm.L),
          M: Number(holeForm.M),
          dia: Number(holeForm.dia),
          X: holeForm.X,
          Y: holeForm.Y
        },
        holeCount: Number(holeForm.holeCount),
        flangeHoleConfig: holeForm.flangeHoleConfig,
        drawingStatus: 'READY_FOR_PREVIEW'
      };

      const res = await updateSalesOrderItemDrawingConfig(salesOrderId, activeItem._id, payload);
      if (res.success) {
        setSuccessMsg(`Hole details confirmed for Item ${activeItem.itemNumber}!`);
        // Refresh workspace data to update statuses
        await loadWorkspaceConfig(activeItem._id);
        // Switch to preview tab to see updated drawing
        setActiveTab('preview');
      } else {
        setError(res.message || 'Failed to save hole details');
      }
    } catch (err) {
      console.error('Error saving hole details:', err);
      setError(err.response?.data?.message || 'Validation error saving hole details');
    } finally {
      setSavingHoles(false);
    }
  };

  // Handle switching template
  const handleSelectTemplate = async (templateId) => {
    if (!activeItem) return;
    try {
      const res = await updateSalesOrderItemDrawingConfig(salesOrderId, activeItem._id, {
        drawingId: templateId
      });
      if (res.success) {
        setSuccessMsg('Drawing template updated successfully!');
        await loadWorkspaceConfig(activeItem._id);
        setActiveTab('preview');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update template');
    }
  };

  // Print single drawing
  const handlePrintSingle = async () => {
    if (!activeItem) return;
    setActionLoading(true);
    try {
      const blob = await getSalesOrderItemDrawing(salesOrderId, activeItem._id, false);
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
      const blob = await getSalesOrderItemDrawing(salesOrderId, activeItem._id, true);
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
                            {it.holeCount || 12} Holes (L: {it.confirmedHoleDetails?.L || 100}, M: {it.confirmedHoleDetails?.M || 100}, Ø: {it.confirmedHoleDetails?.dia || 12})
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
                  <Settings size={14} /> Filter Flange with Hole / Slot Details (Mandatory Confirmation)
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

                {/* TAB 2: FILTER FLANGE WITH HOLE / SLOT DETAILS */}
                {activeTab === 'holes' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
                      <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">
                          Pre-Printing Confirmation: Filter Flange with Hole / Slot Details
                        </strong>
                        <span>
                          The client drawing requires explicit mounting hole positions, spacing, and diameters.
                          Confirm or update the parameters below. Changes are saved directly to this Sales Order line item
                          without modifying the master product or enquiry records.
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Side: Editable Parameters Form */}
                      <form onSubmit={handleSaveHoleDetails} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Mounting Parameters (mm)
                          </h4>
                        </div>

                        {/* Hole Count Selector */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Hole Count
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[4, 8, 12, 16].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setHoleForm(prev => ({
                                  ...prev,
                                  holeCount: cnt,
                                  flangeHoleConfig: `HOLE-${cnt}H`
                                }))}
                                className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                                  Number(holeForm.holeCount) === cnt
                                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {cnt} Holes
                              </button>
                            ))}
                          </div>
                        </div>

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
                            className="text-xs font-bold px-4 bg-blue-700 hover:bg-blue-800"
                          >
                            <CheckCircle2 size={14} className="mr-1.5" />
                            {savingHoles ? 'Saving...' : 'Save & Confirm Details'}
                          </Button>
                        </div>
                      </form>

                      {/* Right Side: Live Flange Dynamic Diagram Preview */}
                      <div>
                        <DynamicFlangeDiagram
                          holeCount={holeForm.holeCount}
                          L={holeForm.L}
                          M={holeForm.M}
                          dia={holeForm.dia}
                          A={activeItem.dimensions?.A || 610}
                          B={activeItem.dimensions?.B || 610}
                        />
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
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                        Filter Specifications (Printed on Engineering Drawing)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Efficiency:</span>
                          <strong className="text-slate-900 font-semibold">85 % Down to 0.3 µ</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">IPD:</span>
                          <strong className="text-slate-900 font-semibold">12-15 ±10% mm of WC</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">FPD:</span>
                          <strong className="text-slate-900 font-semibold">45 mm of WC</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Material of Casing:</span>
                          <strong className="text-slate-900 font-semibold">Aluminum Anodized</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Media:</span>
                          <strong className="text-slate-900 font-semibold">Imported Submicronic Glass Fiber</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">No. of Pleats:</span>
                          <strong className="text-slate-900 font-semibold">15-18 / FT</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Temperature:</span>
                          <strong className="text-slate-900 font-semibold">Up To 150 ° C</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Gasket MOC:</span>
                          <strong className="text-slate-900 font-semibold">EPDM</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Protection guard MOC:</span>
                          <strong className="text-slate-900 font-semibold">NO Protection Grid</strong>
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
    </Modal>
  );
};

export default SalesOrderDrawingWorkspaceModal;
