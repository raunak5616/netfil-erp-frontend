import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UploadCloud,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Disc,
  Info,
  RefreshCw,
  X,
  Plus,
  Edit,
  Layers,
  Copy,
  CornerDownRight
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { getHoleImages, saveHoleImage, deleteHoleImage } from '../../services/drawingMasterService';

const DEFAULT_STANDARD_HOLES = [4, 8, 12];

const HoleImageManagementTab = () => {
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [brokenImages, setBrokenImages] = useState({});

  // ================= Direct On-Page Manual Upload / Configuration State =================
  const [editingConfigId, setEditingConfigId] = useState(null); // null = new pattern, string = editing existing
  const [editingCode, setEditingCode] = useState('');
  const [uploadHoles, setUploadHoles] = useState(4);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [uploadDrawingCode, setUploadDrawingCode] = useState('HOLE-4H');
  const [uploadDrawingName, setUploadDrawingName] = useState('Flange 4 Holes Mounting Drawing');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFilePreview, setUploadFilePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const directFileInputRef = useRef(null);
  const uploadFormSectionRef = useRef(null);
  const customHoleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // Blueprint Inspection Modal state
  const [inspectModalImage, setInspectModalImage] = useState(null);

  // Fetch hole image configurations from server
  const fetchHoleConfigurations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getHoleImages();
      if (res.success && Array.isArray(res.holeImages)) {
        setConfigurations(res.holeImages);
      } else {
        setError('Failed to load hole image configurations from server');
      }
    } catch (err) {
      console.error('Failed to load hole configurations:', err);
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoleConfigurations();
  }, []);

  // Sort and present all hole configurations (supporting multiple variants of the same hole count)
  const holeConfigs = useMemo(() => {
    if (!Array.isArray(configurations)) return [];
    return [...configurations].sort((a, b) => {
      if (a.holes !== b.holes) return a.holes - b.holes;
      return (a.drawingCode || '').localeCompare(b.drawingCode || '');
    });
  }, [configurations]);

  const generateNewDrawingCode = (count) => {
    const existingSameHoles = holeConfigs.filter((c) => c.holes === count && c.drawingId);
    if (existingSameHoles.length === 0) {
      return `HOLE-${count}H`;
    }
    return `HOLE-${count}H-V${existingSameHoles.length + 1}`;
  };

  // Handle Preset Hole Count button change (4, 8, 12)
  const handlePresetSelect = (count) => {
    setIsCustomMode(false);
    setUploadHoles(count);
    if (!editingConfigId) {
      setUploadDrawingCode(generateNewDrawingCode(count));
      setUploadDrawingName(`Flange ${count} Holes Mounting Drawing`);
      setUploadDescription('');
      if (!uploadFile) setUploadFilePreview(null);
    }
  };

  // Handle Custom Hole Count change
  const handleCustomHoleChange = (rawVal) => {
    const val = parseInt(rawVal, 10);
    if (!isNaN(val) && val > 0) {
      setUploadHoles(val);
      if (!editingConfigId) {
        setUploadDrawingCode(generateNewDrawingCode(val));
        setUploadDrawingName(`Flange ${val} Holes Mounting Drawing`);
      }
    } else if (rawVal === '') {
      setUploadHoles('');
    }
  };

  // Switch form to "Edit Existing Pattern" mode
  const handleSelectCardForEdit = (cfg, shouldTriggerFileInput = false) => {
    setEditingConfigId(cfg.drawingId || null);
    setEditingCode(cfg.drawingCode || '');
    setUploadHoles(cfg.holes);
    setIsCustomMode(!DEFAULT_STANDARD_HOLES.includes(cfg.holes));
    setUploadDrawingCode(cfg.drawingCode || `HOLE-${cfg.holes}H`);
    setUploadDrawingName(cfg.drawingName || `Flange ${cfg.holes} Holes Mounting Drawing`);
    setUploadDescription(cfg.description || '');
    setUploadFile(null);
    setUploadFilePreview(cfg.imageUrl || null);
    setFormError('');

    uploadFormSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (shouldTriggerFileInput) {
      setTimeout(() => {
        directFileInputRef.current?.click();
      }, 250);
    }
  };

  // Add another variant of the SAME hole count (e.g. another 4-hole pattern with different description)
  const handleAddAnotherVariant = (holesCount) => {
    setEditingConfigId(null);
    setEditingCode('');
    setUploadHoles(holesCount);
    setIsCustomMode(!DEFAULT_STANDARD_HOLES.includes(holesCount));
    const nextCode = generateNewDrawingCode(holesCount);
    setUploadDrawingCode(nextCode);
    setUploadDrawingName(`Flange ${holesCount} Holes Mounting Drawing (${nextCode.split('-').pop()})`);
    setUploadDescription('');
    setUploadFile(null);
    setUploadFilePreview(null);
    setFormError('');

    uploadFormSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 250);
  };

  // Reset form to clean "Add New Pattern" mode
  const handleCancelEdit = () => {
    setEditingConfigId(null);
    setEditingCode('');
    setUploadHoles(4);
    setIsCustomMode(false);
    setUploadDrawingCode(generateNewDrawingCode(4));
    setUploadDrawingName('Flange 4 Holes Mounting Drawing');
    setUploadDescription('');
    setUploadFile(null);
    setUploadFilePreview(null);
    setFormError('');
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setFormError('Invalid file format. Please select a PNG, JPG, or JPEG drawing image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds 10 MB limit. Please select an optimized technical drawing.');
      return;
    }

    setFormError('');
    setUploadFile(file);

    const reader = new FileReader();
    reader.onload = () => setUploadFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Submit manual upload / pattern creation or update
  const handleDirectSubmit = async (e) => {
    if (e) e.preventDefault();

    const targetHoles = parseInt(uploadHoles, 10);
    if (!targetHoles || targetHoles <= 0) {
      setFormError('Please enter a valid positive number for hole count (e.g. 4, 6, 8, 12, 16).');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      if (editingConfigId) {
        formData.append('id', editingConfigId);
        formData.append('drawingId', editingConfigId);
      } else {
        formData.append('isNewVariant', 'true');
      }

      formData.append('holes', String(targetHoles));
      formData.append('holeConfig', `${targetHoles} Holes`);
      formData.append('drawingCode', uploadDrawingCode.trim() || `HOLE-${targetHoles}H`);
      formData.append('drawingName', uploadDrawingName.trim() || `Flange ${targetHoles} Holes Mounting Drawing`);
      formData.append('description', uploadDescription.trim());

      if (uploadFile) {
        formData.append('image', uploadFile);
      } else if (uploadFilePreview) {
        formData.append('fileUrl', uploadFilePreview);
      }

      const res = await saveHoleImage(formData);
      if (res.success) {
        const msg = editingConfigId
          ? `Hole pattern '${uploadDrawingCode}' updated successfully.`
          : `New pattern variant for ${targetHoles} Holes created successfully.`;
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 5000);
        setUploadFile(null);
        setBrokenImages((prev) => ({ ...prev, [targetHoles]: false }));
        handleCancelEdit();
        fetchHoleConfigurations();
      } else {
        setFormError(res.message || 'Failed to save configuration');
      }
    } catch (err) {
      console.error('Failed to save hole image:', err);
      setFormError(err.response?.data?.message || err.message || 'Server error while saving hole pattern');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete hole pattern
  const handleDelete = async (cfg) => {
    const isCustom = cfg.isCustom || !DEFAULT_STANDARD_HOLES.includes(cfg.holes);
    const confirmPrompt = isCustom || cfg.description
      ? `Are you sure you want to permanently delete the pattern '${cfg.drawingCode}' (${cfg.holeConfig})?`
      : `Are you sure you want to remove the technical drawing for ${cfg.holes} Holes?`;

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      if (cfg.drawingId) {
        await deleteHoleImage(cfg.drawingId);
      }
      setSuccessMsg(`Hole configuration '${cfg.drawingCode}' removed.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingConfigId === cfg.drawingId) {
        handleCancelEdit();
      }
      fetchHoleConfigurations();
    } catch (err) {
      console.error('Failed to delete hole pattern:', err);
      setError(err.response?.data?.message || 'Failed to remove hole configuration');
    }
  };

  const configuredCount = holeConfigs.filter((c) => c.isConfigured && !brokenImages[c.holes]).length;

  return (
    <div className="space-y-4">
      {/* Top Industrial Header Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-slate-900 text-white">
                <Disc size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Flange Hole Drawings &amp; Multi-Variant Pattern Management
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                MASTER SPECIFICATION
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Configure multiple flange hole patterns (including different types/descriptions for the same hole count, e.g. multiple 4-hole variants).
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleAddAnotherVariant(4)}
              className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus size={15} />
              <span>Add New Pattern Variant</span>
            </button>
            <button
              type="button"
              onClick={() => {
                uploadFormSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                directFileInputRef.current?.click();
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <UploadCloud size={15} />
              <span>Upload Drawing</span>
            </button>
          </div>
        </div>

        {/* Technical Status Strip */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[11px]">Configuration Status:</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${configuredCount > 0 ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              {configuredCount} of {holeConfigs.length} Pattern Variants Configured with Drawings
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>Multi-Variant Allowed: <strong className="text-slate-800">Yes (Same hole count with different descriptions)</strong></span>
            <span>•</span>
            <span>Formats: <strong className="text-slate-800">PNG, JPG, JPEG (Max 10MB)</strong></span>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* ========================================================================= */}
      {/* 1. DIRECT ON-PAGE MANUAL UPLOAD & MULTI-VARIANT PATTERN FORM              */}
      {/* ========================================================================= */}
      <div
        ref={uploadFormSectionRef}
        className={`bg-white border-2 rounded-lg p-5 shadow-xs space-y-4 transition-all ${
          editingConfigId ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded text-white ${editingConfigId ? 'bg-blue-600' : 'bg-slate-800'}`}>
              {editingConfigId ? <Edit size={16} /> : <Plus size={16} />}
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>{editingConfigId ? `Edit Pattern: ${editingCode || `HOLE-${uploadHoles}H`}` : `Add New Hole Pattern Variant`}</span>
                {editingConfigId ? (
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-semibold border border-blue-200 normal-case">
                    Editing Mode
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 normal-case">
                    New Variant Mode
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                {editingConfigId
                  ? 'Update this specific pattern configuration, engineering description, or CAD blueprint.'
                  : `Creating a new pattern variant. You can create multiple different types of ${uploadHoles || ''} holes with different descriptions.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingConfigId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <X size={12} />
                <span>Cancel Edit / Switch to New</span>
              </button>
            ) : null}

            {uploadHoles ? (
              <span className="px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-900 text-white shadow-2xs">
                {uploadHoles} HOLES PATTERN
              </span>
            ) : null}
          </div>
        </div>

        {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

        {/* Hidden Native File Input */}
        <input
          type="file"
          ref={directFileInputRef}
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        <form onSubmit={handleDirectSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Configuration Controls (Holes, Metadata, Description) */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Select Hole Count (Presets + Custom Input) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    1. Hole Count Specification *
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {uploadHoles ? `${uploadHoles} Holes selected` : 'Select or type hole count'}
                  </span>
                </div>

                {/* Quick Presets Buttons + Custom Toggle */}
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[4, 8, 12].map((cnt) => {
                    const isSelected = uploadHoles === cnt && !isCustomMode;
                    const countVariants = holeConfigs.filter((c) => c.holes === cnt && c.drawingId).length;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handlePresetSelect(cnt)}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs">{cnt} Holes</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {countVariants > 1 ? `${countVariants} Variants` : `FLG-${String(cnt).padStart(2, '0')}H`}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      setTimeout(() => customHoleInputRef.current?.focus(), 100);
                    }}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isCustomMode || !DEFAULT_STANDARD_HOLES.includes(Number(uploadHoles))
                        ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                        : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border-purple-200'
                    }`}
                  >
                    <span className="font-bold text-xs">+ Custom</span>
                    <span className={`text-[10px] font-mono ${isCustomMode || !DEFAULT_STANDARD_HOLES.includes(Number(uploadHoles)) ? 'text-purple-200' : 'text-purple-600'}`}>
                      Any Count
                    </span>
                  </button>
                </div>

                {/* Direct Number Input for Hole Count */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    Hole Count (Number):
                  </span>
                  <input
                    ref={customHoleInputRef}
                    type="number"
                    min="1"
                    max="128"
                    step="1"
                    value={uploadHoles || ''}
                    onChange={(e) => {
                      setIsCustomMode(true);
                      handleCustomHoleChange(e.target.value);
                    }}
                    placeholder="e.g. 4, 6, 8"
                    className="w-28 px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded focus:border-slate-900 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">
                    flange mounting holes
                  </span>
                </div>
              </div>

              {/* Technical Code & Name Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Drawing Code (Unique)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Identifies this variant</span>
                  </label>
                  <input
                    type="text"
                    value={uploadDrawingCode}
                    onChange={(e) => setUploadDrawingCode(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
                    placeholder={`HOLE-${uploadHoles || 'X'}H-V1`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Drawing Name
                  </label>
                  <input
                    type="text"
                    value={uploadDrawingName}
                    onChange={(e) => setUploadDrawingName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
                    placeholder={`Flange ${uploadHoles || 'X'} Holes Mounting Drawing`}
                  />
                </div>
              </div>

              {/* Engineering Description & Technical Notes (Prominent & Differentiator) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>2. Engineering Description &amp; Technical Notes *</span>
                  <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                    Differentiates this type/variant
                  </span>
                </label>
                <textarea
                  ref={descriptionInputRef}
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-900 focus:outline-none leading-relaxed resize-none font-sans"
                  placeholder="e.g. 4 holes corner offset, PCD 450mm, Ø12mm hole size (or: Standard centered 4 holes, PCD 380mm, M8 bolts)"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Different types of {uploadHoles || 4} holes are distinguished by this description on CAD blueprints and sales requirements.
                </p>
              </div>
            </div>

            {/* Right Column: File Drag & Drop Dropzone + Live Blueprint Preview */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>3. CAD Technical Drawing Image</span>
                  <span className="text-[10px] text-slate-500 font-normal">PNG, JPG, JPEG (Max 10MB)</span>
                </label>

                {/* Drag & Drop Dropzone */}
                <div
                  onClick={() => directFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50/70 hover:bg-slate-100/70 rounded-lg p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-11 h-11 rounded-full bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">
                      {uploadFile ? uploadFile.name : 'Click to browse or drop drawing file'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Technical CAD drawing file for {uploadHoles || 'custom'} holes
                    </p>
                  </div>
                  {uploadFile && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      <CheckCircle2 size={12} className="text-emerald-700" />
                      <span>SELECTED: {(uploadFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              {uploadFilePreview && (
                <div className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText size={12} className="text-slate-600" />
                      Live Drawing Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadFilePreview(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 text-xs cursor-pointer inline-flex items-center gap-1"
                    >
                      <X size={12} /> Clear
                    </button>
                  </div>
                  <div
                    className="h-28 rounded border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden relative"
                    style={{
                      backgroundColor: '#f8fafc',
                      backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}
                  >
                    <img
                      src={uploadFilePreview}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                      onError={() => {
                        if (!uploadFile) setUploadFilePreview(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  className={`w-full font-bold py-2.5 text-xs shadow-xs text-white ${
                    editingConfigId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <UploadCloud size={15} className="mr-2" />
                  {editingConfigId
                    ? `Update Pattern: ${editingCode || `${uploadHoles} Holes`}`
                    : (uploadFile
                        ? `Save & Upload New ${uploadHoles || ''} Holes Variant`
                        : `Save New ${uploadHoles || ''} Holes Pattern Variant`)}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC FLANGE HOLE SPECIFICATION CARDS GRID                           */}
      {/* ========================================================================= */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Configured Flange Hole Patterns</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              ({holeConfigs.length} patterns configured across all variants)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-mono">
              {configuredCount} of {holeConfigs.length} Drawings Active
            </span>
            <button
              type="button"
              onClick={() => handleAddAnotherVariant(4)}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add Pattern</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
            <RefreshCw size={20} className="animate-spin text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading technical drawing configurations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holeConfigs.map((cfg, idx) => {
              const cardKey = cfg.drawingId || cfg.drawingCode || `holes-${cfg.holes}`;
              const isBroken = Boolean(brokenImages[cardKey]);
              const hasValidImage = Boolean(cfg.isConfigured && cfg.imageUrl && !isBroken);

              // Check if there are multiple variants of the same hole count
              const sameHoleVariants = holeConfigs.filter((c) => c.holes === cfg.holes);
              const isMultiVariant = sameHoleVariants.length > 1;
              const variantIndex = sameHoleVariants.findIndex((c) => (c.drawingId && c.drawingId === cfg.drawingId) || c.drawingCode === cfg.drawingCode);
              const isCurrentlyEditing = editingConfigId && cfg.drawingId && editingConfigId === cfg.drawingId;

              return (
                <div
                  key={cfg.drawingId || `${cfg.holes}-${cfg.drawingCode}-${idx}`}
                  className={`bg-white rounded-lg border flex flex-col overflow-hidden shadow-2xs transition-all ${
                    isCurrentlyEditing ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {cfg.holeConfig} Pattern
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                          FLG-{String(cfg.holes).padStart(2, '0')}H
                        </span>
                        {isMultiVariant && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                            Type #{variantIndex + 1}
                          </span>
                        )}
                        {!DEFAULT_STANDARD_HOLES.includes(cfg.holes) && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Code: <strong>{cfg.drawingCode}</strong>
                      </p>
                    </div>

                    {hasValidImage ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-700" /> Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <AlertCircle size={11} className="text-slate-400" /> No Drawing
                      </span>
                    )}
                  </div>

                  {/* Engineering Description Snippet */}
                  <div className="px-3 py-2 border-b border-slate-100 bg-white">
                    {cfg.description ? (
                      <div className="p-2 bg-slate-50 border border-slate-200/80 rounded text-slate-700 text-[11px] leading-relaxed">
                        <span className="font-semibold text-slate-800 block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-0.5">
                          Description / Specs:
                        </span>
                        {cfg.description}
                      </div>
                    ) : (
                      <div className="p-1.5 bg-slate-50/50 border border-dashed border-slate-200 rounded text-slate-400 text-[11px] italic">
                        Standard flange mounting specification for {cfg.holes} holes.
                      </div>
                    )}
                  </div>

                  {/* CAD Drawing Blueprint Canvas */}
                  <div
                    className="p-3 flex-1 flex flex-col items-center justify-center relative min-h-[190px]"
                    style={{
                      backgroundColor: '#f8fafc',
                      backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}
                  >
                    {hasValidImage ? (
                      <div
                        onClick={() => setInspectModalImage(cfg)}
                        className="group relative w-full h-40 bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center p-2 cursor-pointer shadow-2xs"
                        title="Click to view full CAD blueprint"
                      >
                        <img
                          src={cfg.imageUrl}
                          alt={`${cfg.holeConfig} CAD Drawing`}
                          className="max-h-full max-w-full object-contain"
                          onError={() => {
                            setBrokenImages((prev) => ({ ...prev, [cardKey]: true }));
                          }}
                        />

                        {/* Technical Blueprint Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="px-3 py-1.5 rounded bg-white text-slate-900 text-xs font-semibold shadow-xs flex items-center gap-1.5">
                            <Eye size={13} /> Inspect Blueprint
                          </span>
                        </div>

                        {/* Corner Format Tag */}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-slate-900/80 text-white font-mono text-[9px] uppercase tracking-wider">
                          {cfg.format || 'CAD IMAGE'}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 border border-dashed border-slate-300 rounded bg-white/80 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center mb-2 border border-slate-200">
                          <FileText size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          {isBroken ? 'Drawing Image Unreachable' : 'No Drawing Attached'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 max-w-[200px]">
                          {isBroken
                            ? 'The saved image could not be loaded. Please re-upload drawing.'
                            : `Flange CAD technical drawing for this ${cfg.holes} holes pattern is not uploaded.`}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSelectCardForEdit(cfg, true)}
                          className="mt-3 px-3 py-1.5 rounded text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <UploadCloud size={13} /> Upload Drawing
                        </button>
                      </div>
                    )}

                    {/* Technical Meta Information */}
                    {hasValidImage && (
                      <div className="w-full mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Pattern: <strong>{cfg.holeConfig}</strong></span>
                        {cfg.updatedAt && (
                          <span>Updated: {new Date(cfg.updatedAt).toLocaleDateString('en-GB')}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Action Controls */}
                  <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      {hasValidImage && (
                        <button
                          type="button"
                          onClick={() => setInspectModalImage(cfg)}
                          className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="View Full CAD Blueprint"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelectCardForEdit(cfg, false)}
                        className={`px-2 py-1 rounded text-xs font-medium border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                          isCurrentlyEditing
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                        title="Edit Pattern Details & Description"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddAnotherVariant(cfg.holes)}
                        className="px-2 py-1 rounded text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title={`Add another type of ${cfg.holes} holes with different description`}
                      >
                        <Plus size={11} /> +Another
                      </button>
                      {cfg.drawingId && (
                        <button
                          type="button"
                          onClick={() => handleDelete(cfg)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete this Pattern"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <Button
                      variant={hasValidImage ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleSelectCardForEdit(cfg, true)}
                      className={`text-xs font-semibold shadow-2xs ${!hasValidImage ? 'bg-slate-900 hover:bg-slate-800 text-white' : ''}`}
                    >
                      <UploadCloud size={13} className="mr-1" />
                      {hasValidImage ? 'Replace' : 'Upload'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= BLUEPRINT INSPECTION MODAL ================= */}
      {inspectModalImage && (
        <Modal
          isOpen={Boolean(inspectModalImage)}
          onClose={() => setInspectModalImage(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-slate-900 text-white">
                <FileSpreadsheet size={15} />
              </span>
              <span className="font-bold text-slate-900 text-sm">
                CAD Blueprint: {inspectModalImage.drawingName || `${inspectModalImage.holeConfig} Flange`}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {inspectModalImage.drawingCode}
              </span>
            </div>
          }
          maxWidth="840px"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span>PATTERN: {inspectModalImage.holeConfig}</span>
                <span>•</span>
                <span>CODE: {inspectModalImage.drawingCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const cfg = inspectModalImage;
                    setInspectModalImage(null);
                    handleSelectCardForEdit(cfg, true);
                  }}
                >
                  <UploadCloud size={13} className="mr-1" /> Replace Drawing
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setInspectModalImage(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            {/* Dark Engineering Drafting Viewport */}
            <div
              className="flex items-center justify-center rounded-lg p-6 min-h-[380px] border border-slate-800 relative overflow-hidden"
              style={{
                backgroundColor: '#090d16',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              <img
                src={inspectModalImage.imageUrl}
                alt={inspectModalImage.drawingName}
                className="max-h-[460px] max-w-full object-contain rounded shadow-lg"
              />
            </div>

            {/* Industrial CAD Title Block */}
            <div className="border border-slate-300 rounded bg-slate-50 p-3 font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Drawing Number</span>
                <span className="font-bold text-slate-900">{inspectModalImage.drawingCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Hole Configuration</span>
                <span className="font-bold text-slate-900">{inspectModalImage.holeConfig} Pattern</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Standard</span>
                <span className="font-bold text-slate-900">Standard Flange Profile</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Status</span>
                <span className="font-bold text-emerald-700">Active Specification</span>
              </div>
            </div>

            {/* Custom Description Block if available */}
            {inspectModalImage.description && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                <span className="font-bold text-slate-900 block text-[10px] uppercase font-mono tracking-wider mb-1">
                  Engineering Notes &amp; Technical Description:
                </span>
                <p className="leading-relaxed">{inspectModalImage.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HoleImageManagementTab;
