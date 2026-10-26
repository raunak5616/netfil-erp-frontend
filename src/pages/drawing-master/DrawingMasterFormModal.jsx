import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import { getFilterGrades } from '../../services/filterGradeService';
import { createDrawing, updateDrawing } from '../../services/drawingMasterService';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
  Search,
  X,
  Check,
  Star,
  Layers,
  ChevronDown,
  ChevronUp,
  Box,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const DrawingMasterFormModal = ({ isOpen, onClose, onSuccess, initialData = null, defaultDrawingType = 'BOX' }) => {
  const isEdit = Boolean(initialData?._id);

  const resolveInitialType = () => {
    if (initialData?.drawingType) {
      const dt = initialData.drawingType.toUpperCase();
      return dt === 'STANDARD' ? 'BOX' : dt;
    }
    if (initialData?.designCode) return 'FLANGE';
    const norm = (defaultDrawingType || 'BOX').toUpperCase();
    return norm === 'STANDARD' ? 'BOX' : norm;
  };

  const [formData, setFormData] = useState({
    drawingCode: '',
    drawingName: '',
    drawingType: resolveInitialType(), // 'BOX' | 'FLANGE' | 'FINE' | 'HEPA'
    constructionType: 'FLANGE', // 'FLANGE' | 'BOX'
    holes: '',
    filterGrades: [], // Array of FilterGrade _id strings
    defaultForGrades: [], // Array of FilterGrade _id strings where this drawing is default
    description: '',
    isDefault: false,
    status: 'active'
  });

  const [filterGradesList, setFilterGradesList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState('image'); // 'image' | 'pdf'

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Dropdown UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [gradeSearch, setGradeSearch] = useState('');
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load Filter Grades on modal open
  useEffect(() => {
    if (!isOpen) return;

    const loadGrades = async () => {
      setLoadingGrades(true);
      try {
        const res = await getFilterGrades();
        if (res.success && Array.isArray(res.filterGrades)) {
          // Keep active filter grades plus any grades currently attached to this drawing
          const initialIds = new Set(
            (Array.isArray(initialData?.filterGrades) ? initialData.filterGrades : [initialData?.filterGrade])
              .filter(Boolean)
              .map(g => String(g._id || g))
          );
          setFilterGradesList(
            res.filterGrades.filter(g => g.status === 'active' || initialIds.has(String(g._id)))
          );
        }
      } catch (err) {
        console.error('Failed to load filter grades:', err);
        setError('Failed to load filter grades master.');
      } finally {
        setLoadingGrades(false);
      }
    };

    loadGrades();
  }, [isOpen, initialData]);

  // Set initial form state
  useEffect(() => {
    if (initialData) {
      // Extract assigned grades
      const initGrades = Array.isArray(initialData.filterGrades) && initialData.filterGrades.length > 0
        ? initialData.filterGrades.map(g => String(g._id || g))
        : (initialData.filterGrade ? [String(initialData.filterGrade._id || initialData.filterGrade)] : []);

      // Extract per-grade defaults
      const initDefaults = Array.isArray(initialData.defaultForGrades) && initialData.defaultForGrades.length > 0
        ? initialData.defaultForGrades.map(g => String(g._id || g))
        : (initialData.isDefault ? [...initGrades] : []);

      const rawType = initialData.drawingType ? initialData.drawingType.toUpperCase() : (initialData.designCode ? 'FLANGE' : 'BOX');
      const resolvedType = rawType === 'STANDARD' ? 'BOX' : rawType;

      setFormData({
        drawingCode: initialData.drawingCode || initialData.designCode || '',
        drawingName: initialData.drawingName || initialData.designName || '',
        drawingType: resolvedType,
        constructionType: initialData.constructionType || (initialData.designCode?.startsWith('BOX') ? 'BOX' : 'FLANGE'),
        holes: (initialData.holes !== undefined && initialData.holes !== null)
          ? String(initialData.holes)
          : (initialData.holeCount !== undefined && initialData.holeCount !== null)
            ? String(initialData.holeCount)
            : '',
        filterGrades: initGrades,
        defaultForGrades: initDefaults,
        description: initialData.description || '',
        isDefault: initDefaults.length > 0 || Boolean(initialData.isDefault),
        status: initialData.status || 'active'
      });
      setSelectedFile(null);
      const effectiveUrl = initialData.fileUrl || initialData.referenceImage || initialData.referenceDrawing;
      if (effectiveUrl) {
        setFilePreview(effectiveUrl);
        const isPdf = initialData.format === 'pdf' || effectiveUrl.toLowerCase().endsWith('.pdf');
        setFileType(isPdf ? 'pdf' : 'image');
      } else {
        setFilePreview(null);
      }
    } else {
      const resolvedDefault = (defaultDrawingType || 'BOX').toUpperCase();
      const normDefault = resolvedDefault === 'STANDARD' ? 'BOX' : resolvedDefault;
      setFormData({
        drawingCode: '',
        drawingName: '',
        drawingType: normDefault,
        constructionType: normDefault === 'FLANGE' ? 'FLANGE' : '',
        holes: '',
        filterGrades: [],
        defaultForGrades: [],
        description: '',
        isDefault: false,
        status: 'active'
      });
      setSelectedFile(null);
      setFilePreview(null);
      setFileType('image');
    }
    setError('');
    setGradeSearch('');
    setIsDropdownOpen(false);
  }, [initialData, isOpen]);

  // Filtered grades for search
  const filteredGrades = useMemo(() => {
    if (!gradeSearch.trim()) return filterGradesList;
    const term = gradeSearch.toLowerCase().trim();
    return filterGradesList.filter(g =>
      (g.filterGrade || '').toLowerCase().includes(term) ||
      (g.eurovent || '').toLowerCase().includes(term) ||
      (g.iso || '').toLowerCase().includes(term)
    );
  }, [filterGradesList, gradeSearch]);

  // Toggle grade assignment
  const handleToggleGrade = (gradeId) => {
    const gid = String(gradeId);
    setFormData(prev => {
      const exists = prev.filterGrades.includes(gid);
      const newGrades = exists
        ? prev.filterGrades.filter(id => id !== gid)
        : [...prev.filterGrades, gid];

      // If removed, also remove from defaultForGrades
      const newDefaults = exists
        ? prev.defaultForGrades.filter(id => id !== gid)
        : (prev.isDefault ? [...prev.defaultForGrades, gid] : prev.defaultForGrades);

      return {
        ...prev,
        filterGrades: newGrades,
        defaultForGrades: newDefaults,
        isDefault: newDefaults.length > 0
      };
    });
  };

  // Select all visible grades
  const handleSelectAll = () => {
    const visibleIds = filteredGrades.map(g => String(g._id));
    setFormData(prev => {
      const merged = Array.from(new Set([...prev.filterGrades, ...visibleIds]));
      return {
        ...prev,
        filterGrades: merged,
        defaultForGrades: prev.isDefault ? merged : prev.defaultForGrades
      };
    });
  };

  // Clear all grades
  const handleClearAll = () => {
    setFormData(prev => ({
      ...prev,
      filterGrades: [],
      defaultForGrades: [],
      isDefault: false
    }));
  };

  // Toggle per-grade default status
  const handleToggleGradeDefault = (gradeId) => {
    const gid = String(gradeId);
    setFormData(prev => {
      const isDef = prev.defaultForGrades.includes(gid);
      const newDefaults = isDef
        ? prev.defaultForGrades.filter(id => id !== gid)
        : [...prev.defaultForGrades, gid];

      return {
        ...prev,
        defaultForGrades: newDefaults,
        isDefault: newDefaults.length > 0
      };
    });
  };

  // Global default toggle
  const handleToggleGlobalDefault = (checked) => {
    setFormData(prev => ({
      ...prev,
      isDefault: checked,
      defaultForGrades: checked ? [...prev.filterGrades] : []
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'application/pdf'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isAllowedExt = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'pdf'].includes(ext);

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      setError('Invalid file type. Please upload a PNG, JPG, JPEG, WEBP, SVG, or PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setError('');
    setSelectedFile(file);

    const isPdf = file.type === 'application/pdf' || ext === 'pdf';
    setFileType(isPdf ? 'pdf' : 'image');

    if (isPdf) {
      setFilePreview(file.name);
    } else {
      const objectUrl = URL.createObjectURL(file);
      setFilePreview(objectUrl);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (isEdit && initialData?.fileUrl) {
      setFilePreview(initialData.fileUrl);
      const isPdf = initialData.format === 'pdf' || initialData.fileUrl.toLowerCase().endsWith('.pdf');
      setFileType(isPdf ? 'pdf' : 'image');
    } else {
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.drawingCode.trim()) {
      setError('Drawing Code is required.');
      return;
    }

    if (!formData.drawingName.trim()) {
      setError('Drawing Name is required.');
      return;
    }

    if (['STANDARD', 'BOX'].includes(formData.drawingType) && (!formData.filterGrades || formData.filterGrades.length === 0)) {
      setError('Please select at least one assigned Filter Grade for box drawings.');
      return;
    }

    if (formData.drawingType === 'FLANGE' && formData.holes !== '' && formData.holes !== null && formData.holes !== undefined) {
      const parsedHoles = Number(formData.holes);
      if (!Number.isInteger(parsedHoles) || parsedHoles <= 0) {
        setError('Holes must be a valid positive integer.');
        return;
      }
    }

    if (!isEdit && !selectedFile) {
      setError('Please upload a drawing file or image.');
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('drawingCode', formData.drawingCode.trim().toUpperCase());
      data.append('drawingName', formData.drawingName.trim());
      data.append('drawingType', formData.drawingType);
      if (formData.drawingType === 'FLANGE') {
        data.append('constructionType', formData.constructionType || 'FLANGE');
        if (formData.holes !== '' && formData.holes !== null && formData.holes !== undefined) {
          const parsedHoles = Number(formData.holes);
          data.append('holes', String(parsedHoles));
          data.append('holeCount', String(parsedHoles));
        } else {
          data.append('holes', '');
          data.append('holeCount', '');
        }
        data.append('handleQuantity', '2');
      } else {
        data.append('constructionType', '');
        data.append('holes', '');
        data.append('holeCount', '');
      }
      data.append('filterGrades', JSON.stringify(formData.filterGrades));
      data.append('defaultForGrades', JSON.stringify(formData.defaultForGrades));
      if (formData.filterGrades.length > 0) {
        data.append('filterGrade', formData.filterGrades[0]); // Legacy field fallback
      }
      data.append('description', formData.description.trim());
      data.append('isDefault', formData.defaultForGrades.length > 0 ? 'true' : 'false');
      data.append('status', formData.status);

      if (selectedFile) {
        data.append('drawingFile', selectedFile);
      }

      if (isEdit) {
        await updateDrawing(initialData._id, data);
      } else {
        await createDrawing(data);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save drawing:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save drawing record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Drawing — ${initialData?.drawingCode}` : 'Add New Engineering Drawing'}
      maxWidth="720px"
      zIndex={1150}
      footer={
        <div className="flex justify-end gap-2.5 w-full">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Update Drawing' : 'Save Drawing'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Drawing Type Selector */}
        <div>
          <label className="form-label font-semibold text-slate-700 block mb-1">
            Drawing Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Box */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, drawingType: 'BOX', holes: '', constructionType: '' }))}
              className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                formData.drawingType === 'BOX' || formData.drawingType === 'STANDARD'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Box size={16} className={`shrink-0 ${formData.drawingType === 'BOX' || formData.drawingType === 'STANDARD' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs">Box</span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">Box casing filter drawing</span>
            </button>

            {/* 2. Flange */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, drawingType: 'FLANGE', constructionType: prev.constructionType || 'FLANGE' }))}
              className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                formData.drawingType === 'FLANGE'
                  ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layers size={16} className={`shrink-0 ${formData.drawingType === 'FLANGE' ? 'text-purple-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs">Flange</span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">Flange profile & bolt holes</span>
            </button>

            {/* 3. Fine */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, drawingType: 'FINE', holes: '', constructionType: '' }))}
              className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                formData.drawingType === 'FINE'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className={`shrink-0 ${formData.drawingType === 'FINE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs">Fine</span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">Fine filter (F5–F9 / ePM)</span>
            </button>

            {/* 4. HEPA */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, drawingType: 'HEPA', holes: '', constructionType: '' }))}
              className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                formData.drawingType === 'HEPA'
                  ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-1 ring-amber-600 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className={`shrink-0 ${formData.drawingType === 'HEPA' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs">HEPA</span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">HEPA (H10–H14 / ISO)</span>
            </button>
          </div>
        </div>

        {/* Flange Drawing Configuration (Holes, Handles, Construction Type) */}
        {formData.drawingType === 'FLANGE' && (
          <div className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label font-semibold text-purple-900 block mb-1">
                  Holes <span className="text-[11px] font-normal text-purple-600">(Optional)</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 4, 8, 12 (leave empty if none)"
                  value={formData.holes}
                  onChange={(e) => setFormData(prev => ({ ...prev, holes: e.target.value }))}
                  className="text-xs font-mono"
                />
                <span className="text-[10px] text-purple-700/80 mt-0.5 block">
                  Number of flange mounting holes (Optional - leave empty for solid flange / no holes)
                </span>
              </div>

              <div>
                <label className="form-label font-semibold text-purple-900 block mb-1">
                  Handles
                </label>
                <div className="flex items-center h-[38px] px-3 bg-purple-100/60 border border-purple-200 rounded-lg text-xs font-medium text-purple-900">
                  <span>2 Handles (Fixed)</span>
                </div>
                <span className="text-[10px] text-purple-700/80 mt-0.5 block">
                  Standard fixed handle quantity
                </span>
              </div>
            </div>

            <div>
              <label className="form-label font-semibold text-purple-900 block mb-1">
                Construction Type *
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="radio"
                    name="constructionType"
                    value="FLANGE"
                    checked={formData.constructionType === 'FLANGE'}
                    onChange={() => setFormData(prev => ({ ...prev, constructionType: 'FLANGE' }))}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Flange Type (with outer flange mounting)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="radio"
                    name="constructionType"
                    value="BOX"
                    checked={formData.constructionType === 'BOX'}
                    onChange={() => setFormData(prev => ({ ...prev, constructionType: 'BOX' }))}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Box Type (standard box casing without flange)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label font-semibold text-slate-700">
              Drawing Code *
            </label>
            <Input
              type="text"
              placeholder={
                formData.drawingType === 'FLANGE'
                  ? "e.g. FLG-004 or BOX-002"
                  : formData.drawingType === 'FINE'
                    ? "e.g. DRW-FINE-F8-01"
                    : formData.drawingType === 'HEPA'
                      ? "e.g. DRW-HEPA-H14-01"
                      : "e.g. DRW-BOX-STD-01"
              }
              value={formData.drawingCode}
              onChange={(e) => setFormData({ ...formData, drawingCode: e.target.value.toUpperCase() })}
              required
              className="font-mono text-xs uppercase"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Unique engineering identifier</span>
          </div>

          <div>
            <label className="form-label font-semibold text-slate-700">
              Drawing Name *
            </label>
            <Input
              type="text"
              placeholder={
                formData.drawingType === 'FLANGE'
                  ? "e.g. Flange Profile 4 (Double Gasket)"
                  : formData.drawingType === 'FINE'
                    ? "e.g. Fine Filter F8 Compact Drawing"
                    : formData.drawingType === 'HEPA'
                      ? "e.g. HEPA Filter H14 Standard Drawing"
                      : "e.g. Box Filter Standard Drawing"
              }
              value={formData.drawingName}
              onChange={(e) => setFormData({ ...formData, drawingName: e.target.value })}
              required
              className="text-xs"
            />
          </div>
        </div>

        {/* Multiple Filter Grades Selector */}
        <div className="space-y-2" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <label className="form-label font-semibold text-slate-700 m-0">
              {['STANDARD', 'BOX'].includes(formData.drawingType)
                ? `Assigned Filter Grades * (${formData.filterGrades.length} selected)`
                : `Assigned Filter Grades (Optional - ${formData.filterGrades.length} selected, leave empty for Universal)`}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Searchable Multi-select trigger */}
          <div className="relative">
            <div
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="w-full min-h-[38px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg cursor-pointer flex items-center justify-between gap-2 hover:border-blue-500 transition-colors shadow-2xs"
            >
              <div className="flex flex-wrap gap-1.5 items-center flex-1">
                {formData.filterGrades.length === 0 ? (
                  <span className="text-slate-400 text-xs">
                    {loadingGrades ? 'Loading grades master...' : 'Search and select Filter Grades...'}
                  </span>
                ) : (
                  formData.filterGrades.map((gid) => {
                    const gradeObj = filterGradesList.find(g => String(g._id) === String(gid));
                    const isDef = formData.defaultForGrades.includes(String(gid));
                    return (
                      <span
                        key={gid}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{gradeObj ? gradeObj.filterGrade : 'Grade'}</span>
                        {gradeObj?.eurovent && (
                          <span className="text-[9px] text-blue-600">({gradeObj.eurovent})</span>
                        )}
                        {isDef && (
                          <Star size={10} className="fill-emerald-600 text-emerald-600 ml-0.5" title="Default drawing for this grade" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleGrade(gid);
                          }}
                          className="text-blue-500 hover:text-red-600 rounded-full ml-0.5 p-0.5"
                          title="Remove grade"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
              <div className="text-slate-400 shrink-0">
                {isDropdownOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in duration-100">
                {/* Search Header */}
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={gradeSearch}
                    onChange={(e) => setGradeSearch(e.target.value)}
                    placeholder="Search by grade name, Eurovent, or ISO..."
                    className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                    autoFocus
                  />
                  {gradeSearch && (
                    <button
                      type="button"
                      onClick={() => setGradeSearch('')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Grade List */}
                <div className="max-h-52 overflow-y-auto p-1 divide-y divide-slate-50">
                  {filteredGrades.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      No matching Filter Grades found
                    </div>
                  ) : (
                    filteredGrades.map((g) => {
                      const isSelected = formData.filterGrades.includes(String(g._id));
                      return (
                        <div
                          key={g._id}
                          onClick={() => handleToggleGrade(g._id)}
                          className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/70 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer pointer-events-none"
                            />
                            <div>
                              <span className="text-xs font-semibold">{g.filterGrade}</span>
                              <div className="text-[10px] text-slate-500">
                                {[g.eurovent ? `EU: ${g.eurovent}` : '', g.iso ? `ISO: ${g.iso}` : ''].filter(Boolean).join(' • ') || 'Standard Specification'}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check size={14} className="text-blue-600 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Select one or multiple Filter Grades compatible with this drawing.
          </span>
        </div>

        {/* Per-Grade Default Management Card */}
        {formData.filterGrades.length > 0 && (
          <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block text-xs">
                  Default Drawing Assignment
                </span>
                <span className="text-[11px] text-slate-500">
                  Designate which of the selected Filter Grades will use this drawing as their default.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => handleToggleGlobalDefault(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-xs font-medium text-slate-700">Default for All</span>
              </label>
            </div>

            {/* Individual grade default chips */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-blue-100">
              {formData.filterGrades.map((gid) => {
                const gradeObj = filterGradesList.find(g => String(g._id) === String(gid));
                const isDef = formData.defaultForGrades.includes(String(gid));
                return (
                  <button
                    key={gid}
                    type="button"
                    onClick={() => handleToggleGradeDefault(gid)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border ${
                      isDef
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Star
                      size={12}
                      className={isDef ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'}
                    />
                    <span>{gradeObj ? gradeObj.filterGrade : 'Grade'}</span>
                    <span className="text-[10px] opacity-75">
                      {isDef ? '(Default)' : '(Click to set default)'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status & Remarks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label font-semibold text-slate-700">
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="text-xs"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Inactive drawings are excluded from selection</span>
          </div>

          <div>
            <label className="form-label font-semibold text-slate-700">
              Engineering Remarks (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Flange tolerance notes, revision 2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>

        {/* Drawing File Upload Zone */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
              <UploadCloud size={15} className="text-blue-600" />
              Drawing File or Image {isEdit ? '(Replace File)' : '*'}
            </label>
            <span className="text-[11px] text-slate-500">PNG, JPG, SVG, WEBP or PDF (Max 10MB)</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
            className="hidden"
          />

          {!filePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto">
                <UploadCloud size={20} />
              </div>
              <div className="text-xs text-slate-700 font-medium">
                Click or drag & drop to upload drawing
              </div>
              <p className="text-[10px] text-slate-400">
                Uploaded files are stored securely in dedicated Cloudinary storage
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl bg-white p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-600" />
                  {selectedFile ? `Ready to upload: ${selectedFile.name}` : 'Current Drawing File'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Replace
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Cancel Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Live Preview Before Saving */}
              <div className="flex justify-center items-center bg-slate-50 p-2 rounded-lg border border-slate-200 min-h-[160px] max-h-[240px] overflow-hidden">
                {fileType === 'pdf' ? (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <FileText size={48} className="text-red-500 mb-1" />
                    <span className="font-semibold text-slate-800 text-xs">
                      {selectedFile ? selectedFile.name : (initialData?.fileName || `${formData.drawingCode}.pdf`)}
                    </span>
                    <span className="text-[10px] text-slate-500">PDF Drawing Asset</span>
                  </div>
                ) : (
                  <img
                    src={filePreview}
                    alt="Drawing Preview"
                    className="max-h-[220px] object-contain rounded"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default DrawingMasterFormModal;
