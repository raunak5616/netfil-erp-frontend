import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import {
  useCreateDrawingMutation,
  useUpdateDrawingMutation,
  useGetHoleConfigurationsQuery
} from '../../features/drawingMaster/drawingMasterApi';
import { useGetFilterGradesQuery } from '../../features/masterData/masterDataApi';
import { getVersionedImageUrl } from '../../services/drawingMasterService';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Search,
  X,
  Check,
  Star,
  Layers,
  ChevronDown,
  ChevronUp,
  Box,
  Sparkles,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Disc
} from 'lucide-react';

const DrawingMasterFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  defaultDrawingType = 'BOX',
  defaultCategory = 'FINE_PRE',
  onHoleImageTabSelect = null
}) => {
  const isEdit = Boolean(initialData?._id);

  // Normalization helper for Category
  const resolveInitialCategory = () => {
    if (initialData?.filterCategory) {
      const cat = String(initialData.filterCategory).toUpperCase();
      if (cat.includes('HEPA')) return 'HEPA';
      return 'FINE_PRE';
    }
    if (initialData?.drawingType?.toUpperCase() === 'HEPA') return 'HEPA';
    if (initialData?.drawingType?.toUpperCase() === 'FINE') return 'FINE_PRE';
    const norm = (defaultCategory || 'FINE_PRE').toUpperCase();
    return norm.includes('HEPA') ? 'HEPA' : 'FINE_PRE';
  };

  // Normalization helper for Drawing Type
  const resolveInitialType = () => {
    if (initialData?.drawingType) {
      const dt = initialData.drawingType.toUpperCase();
      if (dt === 'FLANGE') return 'FLANGE';
      return 'BOX';
    }
    if (initialData?.designCode) return 'FLANGE';
    const norm = (defaultDrawingType || 'BOX').toUpperCase();
    return norm === 'FLANGE' ? 'FLANGE' : 'BOX';
  };

  const resolveInitialHoleConfig = () => {
    if (initialData?.holeConfig && initialData.holeConfig.toLowerCase() !== 'ing1') {
      return String(initialData.holeConfig).trim();
    }
    if (initialData?.holes !== undefined && initialData?.holes !== null && initialData?.holes !== '') {
      return `${initialData.holes} Holes`;
    }
    return '12 Holes';
  };

  const [formData, setFormData] = useState({
    filterCategory: resolveInitialCategory(), // 'FINE_PRE' | 'HEPA'
    drawingType: resolveInitialType(), // 'BOX' | 'FLANGE'
    holesSlotHandle: true,
    holesBranch: 'Normal', // Only 'Normal' supported; Check for Size is excluded
    holeConfig: resolveInitialHoleConfig(), // '12 Holes', '8 Holes', '4 Holes', '2 Holes', or custom
    holes: initialData?.holes !== undefined && initialData?.holes !== null ? String(initialData.holes) : '12',
    constructionType: 'FLANGE',
    drawingCode: '',
    drawingName: '',
    filterGrades: [],
    defaultForGrades: [],
    description: '',
    isDefault: false,
    status: 'active'
  });

  const [availableHoleConfigs, setAvailableHoleConfigs] = useState(['12 Holes', '8 Holes', '4 Holes', '2 Holes']);
  const [customHoleInput, setCustomHoleInput] = useState('');
  const [showAddCustomHole, setShowAddCustomHole] = useState(false);

  const [filterGradesList, setFilterGradesList] = useState([]);

  // Three-view filter drawing state
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [frontFileType, setFrontFileType] = useState('image');

  const [sideFile, setSideFile] = useState(null);
  const [sidePreview, setSidePreview] = useState(null);
  const [sideFileType, setSideFileType] = useState('image');

  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [picFileType, setPicFileType] = useState('image');

  const frontInputRef = useRef(null);
  const sideInputRef = useRef(null);
  const picInputRef = useRef(null);

  const [error, setError] = useState('');

  // Dropdown UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [gradeSearch, setGradeSearch] = useState('');
  const dropdownRef = useRef(null);

  // RTK Query Hooks
  const { data: holeConfigData } = useGetHoleConfigurationsQuery(
    { category: formData.filterCategory },
    { skip: formData.drawingType !== 'FLANGE' }
  );

  const { data: filterGradesData, isLoading: loadingGrades } = useGetFilterGradesQuery(
    undefined,
    { skip: !isOpen }
  );

  const [createDrawing, { isLoading: creating }] = useCreateDrawingMutation();
  const [updateDrawing, { isLoading: updating }] = useUpdateDrawingMutation();

  const submitting = creating || updating;

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

  // Fetch available hole configurations for category
  useEffect(() => {
    if (holeConfigData?.success && Array.isArray(holeConfigData.options)) {
      setAvailableHoleConfigs(holeConfigData.options.filter(opt => opt && opt.toLowerCase() !== 'ing1'));
    }
  }, [holeConfigData]);

  // Load Filter Grades on modal open
  useEffect(() => {
    if (!isOpen || !filterGradesData?.filterGrades) return;

    const initialIds = new Set(
      (Array.isArray(initialData?.filterGrades) ? initialData.filterGrades : [initialData?.filterGrade])
        .filter(Boolean)
        .map(g => String(g._id || g))
    );
    setFilterGradesList(
      filterGradesData.filterGrades.filter(g => g.status === 'active' || initialIds.has(String(g._id)))
    );
  }, [isOpen, filterGradesData, initialData]);

  // Set initial form state
  useEffect(() => {
    if (initialData) {
      const initGrades = Array.isArray(initialData.filterGrades) && initialData.filterGrades.length > 0
        ? initialData.filterGrades.map(g => String(g._id || g))
        : (initialData.filterGrade ? [String(initialData.filterGrade._id || initialData.filterGrade)] : []);

      const initDefaults = Array.isArray(initialData.defaultForGrades) && initialData.defaultForGrades.length > 0
        ? initialData.defaultForGrades.map(g => String(g._id || g))
        : (initialData.isDefault ? [...initGrades] : []);

      const cat = resolveInitialCategory();
      const dt = resolveInitialType();
      const holeCfg = resolveInitialHoleConfig();
      const holesVal = (initialData.holes !== undefined && initialData.holes !== null)
        ? String(initialData.holes)
        : (initialData.holeCount !== undefined && initialData.holeCount !== null)
          ? String(initialData.holeCount)
          : '';

      setFormData({
        filterCategory: cat,
        drawingType: dt,
        holesSlotHandle: true,
        holesBranch: 'Normal',
        holeConfig: holeCfg,
        holes: holesVal,
        constructionType: initialData.constructionType || (dt === 'BOX' ? 'BOX' : 'FLANGE'),
        drawingCode: initialData.drawingCode || initialData.designCode || '',
        drawingName: initialData.drawingName || initialData.designName || '',
        filterGrades: initGrades,
        defaultForGrades: initDefaults,
        description: initialData.description || '',
        isDefault: initDefaults.length > 0 || Boolean(initialData.isDefault),
        status: initialData.status || 'active'
      });

      // Populate Three Views
      const frontUrl = initialData.frontViewImage?.url || initialData.fileUrl || initialData.holeImageUrl || initialData.referenceImage || initialData.referenceDrawing || null;
      const sideUrl = initialData.sideViewImage?.url || null;
      const picUrl = initialData.pictorialViewImage?.url || null;

      setFrontFile(null);
      setFrontPreview(frontUrl);
      setFrontFileType(frontUrl && (frontUrl.toLowerCase().endsWith('.pdf') || initialData.format === 'pdf') ? 'pdf' : 'image');

      setSideFile(null);
      setSidePreview(sideUrl);
      setSideFileType(sideUrl && sideUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');

      setPicFile(null);
      setPicPreview(picUrl);
      setPicFileType(picUrl && picUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
    } else {
      const cat = resolveInitialCategory();
      const dt = resolveInitialType();
      setFormData({
        filterCategory: cat,
        drawingType: dt,
        holesSlotHandle: true,
        holesBranch: 'Normal',
        holeConfig: dt === 'FLANGE' ? '12 Holes' : '',
        holes: dt === 'FLANGE' ? '12' : '',
        constructionType: dt === 'FLANGE' ? 'FLANGE' : 'BOX',
        drawingCode: '',
        drawingName: '',
        filterGrades: [],
        defaultForGrades: [],
        description: '',
        isDefault: false,
        status: 'active'
      });
      setFrontFile(null);
      setFrontPreview(null);
      setFrontFileType('image');

      setSideFile(null);
      setSidePreview(null);
      setSideFileType('image');

      setPicFile(null);
      setPicPreview(null);
      setPicFileType('image');
    }
    setError('');
    setGradeSearch('');
    setIsDropdownOpen(false);
  }, [initialData, isOpen]);

  // Handle Category Switch
  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      filterCategory: category
    }));
  };

  // Handle Drawing Type Switch
  const handleDrawingTypeChange = (type) => {
    setFormData(prev => {
      const isFlg = type === 'FLANGE';
      return {
        ...prev,
        drawingType: type,
        constructionType: isFlg ? 'FLANGE' : 'BOX',
        holeConfig: isFlg ? (prev.holeConfig || '12 Holes') : '',
        holes: isFlg ? (prev.holes || '12') : ''
      };
    });
  };

  // Handle Hole Config Selection
  const handleHoleConfigSelect = (configName) => {
    const match = configName.match(/^(\d+)\s*Holes?/i);
    const parsedHoles = match ? match[1] : '';

    setFormData(prev => ({
      ...prev,
      holeConfig: configName,
      holes: parsedHoles
    }));
  };

  // Add Custom Hole Option
  const handleAddCustomHoleConfig = (e) => {
    e.preventDefault();
    const trimmed = customHoleInput.trim();
    if (!trimmed) return;

    if (!availableHoleConfigs.includes(trimmed)) {
      setAvailableHoleConfigs(prev => [...prev, trimmed]);
    }
    handleHoleConfigSelect(trimmed);
    setCustomHoleInput('');
    setShowAddCustomHole(false);
  };

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

  // Handle view file selection (Section A: Front, Section B: Side, Section C: 3D/Pictorial)
  const handleViewFileChange = (viewKey, file) => {
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'application/pdf'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isAllowedExt = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'pdf'].includes(ext);

    const viewLabel = viewKey === 'front' ? 'Front View' : viewKey === 'side' ? 'Side View' : '3D / Pictorial View';

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      setError(`Invalid file type for ${viewLabel}. Please upload a PNG, JPG, JPEG, WEBP, or SVG file.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(`File size for ${viewLabel} exceeds the 10 MB limit.`);
      return;
    }

    setError('');
    const isPdf = file.type === 'application/pdf' || ext === 'pdf';
    const previewUrl = isPdf ? file.name : URL.createObjectURL(file);

    if (viewKey === 'front') {
      setFrontFile(file);
      setFrontPreview(previewUrl);
      setFrontFileType(isPdf ? 'pdf' : 'image');
    } else if (viewKey === 'side') {
      setSideFile(file);
      setSidePreview(previewUrl);
      setSideFileType(isPdf ? 'pdf' : 'image');
    } else if (viewKey === 'pic') {
      setPicFile(file);
      setPicPreview(previewUrl);
      setPicFileType(isPdf ? 'pdf' : 'image');
    }
  };

  const handleRemoveViewFile = (viewKey) => {
    if (viewKey === 'front') {
      setFrontFile(null);
      const existing = initialData?.frontViewImage?.url || initialData?.fileUrl || initialData?.holeImageUrl || initialData?.referenceImage || null;
      setFrontPreview(isEdit ? existing : null);
      if (frontInputRef.current) frontInputRef.current.value = '';
    } else if (viewKey === 'side') {
      setSideFile(null);
      const existing = initialData?.sideViewImage?.url || null;
      setSidePreview(isEdit ? existing : null);
      if (sideInputRef.current) sideInputRef.current.value = '';
    } else if (viewKey === 'pic') {
      setPicFile(null);
      const existing = initialData?.pictorialViewImage?.url || null;
      setPicPreview(isEdit ? existing : null);
      if (picInputRef.current) picInputRef.current.value = '';
    }
  };

  // Validation before submission
  const validateForm = () => {
    if (!formData.drawingCode.trim()) {
      setError('Drawing Code is required.');
      return false;
    }

    if (!formData.drawingName.trim()) {
      setError('Drawing Name is required.');
      return false;
    }

    if (formData.drawingType === 'BOX' && (!formData.filterGrades || formData.filterGrades.length === 0)) {
      setError('Please select at least one assigned Filter Grade for Box drawings.');
      return false;
    }

    if (formData.drawingType === 'FLANGE') {
      if (formData.holes !== '' && formData.holes !== null && formData.holes !== undefined) {
        const parsedHoles = Number(formData.holes);
        if (!Number.isInteger(parsedHoles) || parsedHoles <= 0) {
          setError('Holes must be a valid positive integer.');
          return false;
        }
      }
    }

    // Require all three views for new configuration
    const missingViews = [];
    if (!frontFile && !frontPreview) missingViews.push('Front View');
    if (!sideFile && !sidePreview) missingViews.push('Side View');
    if (!picFile && !picPreview) missingViews.push('3D / Pictorial View');

    if (missingViews.length > 0) {
      setError(`All three drawings are required: ${missingViews.join(', ')} missing.`);
      return false;
    }

    return true;
  };

  // Save handler: Saves drawing configuration and three image references
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('drawingCode', formData.drawingCode.trim().toUpperCase());
      data.append('drawingName', formData.drawingName.trim());
      data.append('filterCategory', formData.filterCategory);
      data.append('drawingType', formData.drawingType);

      if (formData.drawingType === 'FLANGE') {
        data.append('holesSlotHandle', 'true');
        data.append('holesBranch', 'Normal');
        data.append('holeConfig', formData.holeConfig || '12 Holes');
        data.append('constructionType', 'FLANGE');

        if (formData.holes !== '' && formData.holes !== null && formData.holes !== undefined) {
          const parsedHoles = Number(formData.holes);
          data.append('holes', String(parsedHoles));
          data.append('holeCount', String(parsedHoles));
        } else {
          data.append('holes', '');
          data.append('holeCount', '');
        }
        data.append('handleQuantity', '2'); // Fixed 2 handles
      } else {
        data.append('holesSlotHandle', 'false');
        data.append('holesBranch', '');
        data.append('holeConfig', '');
        data.append('holes', '');
        data.append('holeCount', '');
        data.append('constructionType', 'BOX');
      }

      data.append('filterGrades', JSON.stringify(formData.filterGrades));
      data.append('defaultForGrades', JSON.stringify(formData.defaultForGrades));
      if (formData.filterGrades.length > 0) {
        data.append('filterGrade', formData.filterGrades[0]);
      }
      data.append('description', formData.description.trim());
      data.append('isDefault', formData.defaultForGrades.length > 0 ? 'true' : 'false');
      data.append('status', formData.status);

      // Append three views independently
      if (frontFile) {
        data.append('frontViewImage', frontFile);
        data.append('drawingFile', frontFile); // backwards compatibility
      }
      if (sideFile) {
        data.append('sideViewImage', sideFile);
      }
      if (picFile) {
        data.append('pictorialViewImage', picFile);
      }
      if (isEdit) {
        await updateDrawing({ id: initialData._id, data }).unwrap();
      } else {
        await createDrawing(data).unwrap();
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save drawing configuration:', err);
      setError(err.data?.message || err.message || 'Failed to save drawing configuration.');
    }
  };

  const isFinePre = formData.filterCategory === 'FINE_PRE';
  const isHepa = formData.filterCategory === 'HEPA';
  const isFlange = formData.drawingType === 'FLANGE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>{isEdit ? `Edit Drawing Configuration — ${initialData?.drawingCode}` : 'Filter Drawing Configuration Master'}</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
            isFinePre ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {isFinePre ? 'Fine / Pre' : 'HEPA'}
          </span>
        </div>
      }
      maxWidth="940px"
      zIndex={1150}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Drawing Master • Image &amp; Configuration Management
          </div>
          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {isEdit ? 'Update Drawing Configuration' : 'Save Drawing Configuration'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* ================= SECTION 1: Filter Category ================= */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[10px]">1</span>
              Filter Category *
            </label>
            <span className="text-[10px] text-slate-500">Fine/Pre and HEPA configurations are strictly isolated</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category: Fine/Pre */}
            <button
              type="button"
              onClick={() => handleCategoryChange('FINE_PRE')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                isFinePre
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isFinePre ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs">Fine / Pre Filter</div>
                  <div className="text-[10px] text-slate-500">Pre-filtration &amp; fine grade filters</div>
                </div>
              </div>
              {isFinePre && <CheckCircle size={16} className="text-emerald-600 shrink-0" />}
            </button>

            {/* Category: HEPA */}
            <button
              type="button"
              onClick={() => handleCategoryChange('HEPA')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                isHepa
                  ? 'border-amber-600 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/30 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isHepa ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs">HEPA Filter</div>
                  <div className="text-[10px] text-slate-500">High efficiency particulate air filters</div>
                </div>
              </div>
              {isHepa && <CheckCircle size={16} className="text-amber-600 shrink-0" />}
            </button>
          </div>
        </div>

        {/* ================= SECTION 2: Drawing Type ================= */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[10px]">2</span>
              Drawing Type *
            </label>
            <span className="text-[10px] text-slate-500">Select Box or Flange structure</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Box Type */}
            <button
              type="button"
              onClick={() => handleDrawingTypeChange('BOX')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                formData.drawingType === 'BOX'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/30 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${formData.drawingType === 'BOX' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Box size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs">Box Type</div>
                  <div className="text-[10px] text-slate-500">Box casing without flange mounting</div>
                </div>
              </div>
              {formData.drawingType === 'BOX' && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
            </button>

            {/* Flange Type */}
            <button
              type="button"
              onClick={() => handleDrawingTypeChange('FLANGE')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                formData.drawingType === 'FLANGE'
                  ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-2 ring-purple-500/30 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${formData.drawingType === 'FLANGE' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Layers size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs">Flange Type</div>
                  <div className="text-[10px] text-slate-500">Flange profile with holes/slot &amp; handles</div>
                </div>
              </div>
              {formData.drawingType === 'FLANGE' && <CheckCircle size={16} className="text-purple-600 shrink-0" />}
            </button>
          </div>
        </div>

        {/* ================= Flange Details Notice (Hole Selection Interface Removed) ================= */}
        {isFlange && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="font-bold text-slate-900 text-xs">Flange Configuration (Fixed 2 Handles)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-200 text-slate-800">
                Fixed 2 Handles
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Standard 2 handles apply to flange designs. Flange hole drawings for <strong>4 Holes</strong>, <strong>8 Holes</strong>, and <strong>12 Holes</strong> are configured and uploaded in the dedicated <strong>Hole Image Management</strong> tab.
            </p>
            {onHoleImageTabSelect && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onHoleImageTabSelect}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Disc size={13} className="text-slate-700" />
                  <span>Open Hole Image Management Tab &rarr;</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 3: Three-View Filter Drawing Configuration ================= */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px]">3</span>
                <UploadCloud size={16} className="text-blue-600" />
                Three-View Filter Drawing Configuration *
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload three distinct drawings per configuration. These views will appear horizontally on the Sales Order drawing PDF: <strong>Front View &rarr; Side View &rarr; 3D / Pictorial View</strong>.
              </p>
            </div>
            <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs">
              Category: <strong className={isFinePre ? 'text-emerald-700' : 'text-amber-700'}>{isFinePre ? 'Fine / Pre' : 'HEPA'}</strong> • Type: <strong className="text-blue-700">{formData.drawingType}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* ---------------- SECTION A: Front View Image ---------------- */}
            <div className="border border-slate-200 rounded-xl bg-white p-3.5 flex flex-col justify-between shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-1 pb-1 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[9px] font-bold">A</span>
                    <span>Front View Drawing *</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Front elevation of the filter</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  Front View
                </span>
              </div>

              <input
                type="file"
                ref={frontInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleViewFileChange('front', f);
                }}
                accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
                className="hidden"
              />

              {!frontPreview ? (
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] space-y-1.5 group"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
                    <UploadCloud size={18} />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">
                    Upload Front View
                  </div>
                  <p className="text-[9px] text-slate-400">
                    PNG, JPG, JPEG, WEBP, SVG (Max 10MB)
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-blue-600 font-semibold group-hover:underline">
                    Browse files
                  </span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[130px]" title={frontFile ? frontFile.name : 'Front View Asset'}>
                      <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{frontFile ? frontFile.name : 'Saved Front View'}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => frontInputRef.current?.click()}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Replace Front View image"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveViewFile('front')}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                        title="Remove Front View image"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="relative bg-slate-50 border border-slate-200 rounded-lg h-[150px] p-2 flex items-center justify-center overflow-hidden">
                    {frontFileType === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <FileText size={36} className="text-red-500 mb-1" />
                        <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">
                          {frontFile?.name || `${formData.drawingCode || 'Drawing'}_front.pdf`}
                        </span>
                        <span className="text-[9px] text-slate-400">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={frontFile ? frontPreview : getVersionedImageUrl(frontPreview, initialData?.updatedAt)}
                        alt="Front View Drawing"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-medium backdrop-blur-xs">
                      1. Front (Left)
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="font-medium text-blue-700">Front Elevation</span>
                <span className="text-slate-400 font-mono">1. Left View</span>
              </div>
            </div>

            {/* ---------------- SECTION B: Side View Image ---------------- */}
            <div className="border border-slate-200 rounded-xl bg-white p-3.5 flex flex-col justify-between shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-1 pb-1 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white inline-flex items-center justify-center text-[9px] font-bold">B</span>
                    <span>Side View Drawing *</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Side elevation of the filter</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                  Side View
                </span>
              </div>

              <input
                type="file"
                ref={sideInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleViewFileChange('side', f);
                }}
                accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
                className="hidden"
              />

              {!sidePreview ? (
                <div
                  onClick={() => sideInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] space-y-1.5 group"
                >
                  <div className="w-9 h-9 rounded-full bg-teal-50 group-hover:bg-teal-100 text-teal-600 flex items-center justify-center transition-colors">
                    <UploadCloud size={18} />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">
                    Upload Side View
                  </div>
                  <p className="text-[9px] text-slate-400">
                    PNG, JPG, JPEG, WEBP, SVG (Max 10MB)
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-teal-600 font-semibold group-hover:underline">
                    Browse files
                  </span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[130px]" title={sideFile ? sideFile.name : 'Side View Asset'}>
                      <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{sideFile ? sideFile.name : 'Saved Side View'}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => sideInputRef.current?.click()}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 cursor-pointer"
                        title="Replace Side View image"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveViewFile('side')}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                        title="Remove Side View image"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="relative bg-slate-50 border border-slate-200 rounded-lg h-[150px] p-2 flex items-center justify-center overflow-hidden">
                    {sideFileType === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <FileText size={36} className="text-red-500 mb-1" />
                        <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">
                          {sideFile?.name || `${formData.drawingCode || 'Drawing'}_side.pdf`}
                        </span>
                        <span className="text-[9px] text-slate-400">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={sideFile ? sidePreview : getVersionedImageUrl(sidePreview, initialData?.updatedAt)}
                        alt="Side View Drawing"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-medium backdrop-blur-xs">
                      2. Side (Centre)
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="font-medium text-teal-700">Side Elevation</span>
                <span className="text-slate-400 font-mono">2. Centre View</span>
              </div>
            </div>

            {/* ---------------- SECTION C: 3D / Pictorial View Image ---------------- */}
            <div className="border border-slate-200 rounded-xl bg-white p-3.5 flex flex-col justify-between shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-1 pb-1 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white inline-flex items-center justify-center text-[9px] font-bold">C</span>
                    <span>3D / Pictorial View Drawing *</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Three-dimensional view</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                  3D View
                </span>
              </div>

              <input
                type="file"
                ref={picInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleViewFileChange('pic', f);
                }}
                accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
                className="hidden"
              />

              {!picPreview ? (
                <div
                  onClick={() => picInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/30 rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] space-y-1.5 group"
                >
                  <div className="w-9 h-9 rounded-full bg-purple-50 group-hover:bg-purple-100 text-purple-600 flex items-center justify-center transition-colors">
                    <UploadCloud size={18} />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">
                    Upload 3D / Pictorial View
                  </div>
                  <p className="text-[9px] text-slate-400">
                    PNG, JPG, JPEG, WEBP, SVG (Max 10MB)
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-purple-600 font-semibold group-hover:underline">
                    Browse files
                  </span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[130px]" title={picFile ? picFile.name : '3D View Asset'}>
                      <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{picFile ? picFile.name : 'Saved 3D View'}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => picInputRef.current?.click()}
                        className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 cursor-pointer"
                        title="Replace 3D View image"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveViewFile('pic')}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                        title="Remove 3D View image"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="relative bg-slate-50 border border-slate-200 rounded-lg h-[150px] p-2 flex items-center justify-center overflow-hidden">
                    {picFileType === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <FileText size={36} className="text-red-500 mb-1" />
                        <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">
                          {picFile?.name || `${formData.drawingCode || 'Drawing'}_3d.pdf`}
                        </span>
                        <span className="text-[9px] text-slate-400">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={picFile ? picPreview : getVersionedImageUrl(picPreview, initialData?.updatedAt)}
                        alt="3D / Pictorial View Drawing"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-medium backdrop-blur-xs">
                      3. 3D (Right)
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="font-medium text-purple-700">3D / Pictorial</span>
                <span className="text-slate-400 font-mono">3. Right View</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 5: Identifiers, Filter Grades, & Metadata ================= */}
        <div className="border-t border-slate-200 pt-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label font-semibold text-slate-700">
                Drawing Code *
              </label>
              <Input
                type="text"
                placeholder={
                  isFlange
                    ? (isFinePre ? "e.g. FLG-FINE-01" : "e.g. FLG-HEPA-01")
                    : (isFinePre ? "e.g. BOX-FINE-01" : "e.g. BOX-HEPA-01")
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
                  isFlange
                    ? `${isFinePre ? 'Fine' : 'HEPA'} Flange ${formData.holeConfig || ''} Drawing`
                    : `${isFinePre ? 'Fine' : 'HEPA'} Box Filter Drawing`
                }
                value={formData.drawingName}
                onChange={(e) => setFormData({ ...formData, drawingName: e.target.value })}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Multiple Filter Grades Selector */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="form-label font-semibold text-slate-700 m-0">
                {formData.drawingType === 'BOX'
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
                      {loadingGrades ? 'Loading grades master...' : 'Search and select compatible Filter Grades...'}
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
                            className="text-blue-500 hover:text-red-600 rounded-full ml-0.5 p-0.5 cursor-pointer"
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
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
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
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto p-1 divide-y divide-slate-50">
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
                                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 pointer-events-none"
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
          </div>

          {/* Per-Grade Default Assignment */}
          {formData.filterGrades.length > 0 && (
            <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block text-xs">
                    Default Drawing Assignment
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Designate which filter grades will use this drawing as their default.
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

              <div className="flex flex-wrap gap-2 pt-1 border-t border-blue-100">
                {formData.filterGrades.map((gid) => {
                  const gradeObj = filterGradesList.find(g => String(g._id) === String(gid));
                  const isDef = formData.defaultForGrades.includes(String(gid));
                  return (
                    <button
                      key={gid}
                      type="button"
                      onClick={() => handleToggleGradeDefault(gid)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border cursor-pointer ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>

            <div>
              <label className="form-label font-semibold text-slate-700">
                Engineering Remarks (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. Normal branch 12-hole flange drawing"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default DrawingMasterFormModal;
