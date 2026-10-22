import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import { getFilterGrades } from '../../services/filterGradeService';
import { createDrawing, updateDrawing } from '../../services/drawingMasterService';
import { UploadCloud, FileText, Image as ImageIcon, CheckCircle, Trash2 } from 'lucide-react';

const DrawingMasterFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const isEdit = Boolean(initialData?._id);

  const [formData, setFormData] = useState({
    drawingCode: '',
    drawingName: '',
    filterGrade: '',
    description: '',
    isDefault: false,
    status: 'active'
  });

  const [filterGrades, setFilterGrades] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState('image'); // 'image' | 'pdf'

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Load Filter Grades on mount or open
  useEffect(() => {
    if (!isOpen) return;

    const loadGrades = async () => {
      setLoadingGrades(true);
      try {
        const res = await getFilterGrades();
        if (res.success && Array.isArray(res.filterGrades)) {
          // Show active filter grades
          setFilterGrades(res.filterGrades.filter(g => g.status === 'active' || (initialData?.filterGrade?._id === g._id)));
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
      setFormData({
        drawingCode: initialData.drawingCode || '',
        drawingName: initialData.drawingName || '',
        filterGrade: initialData.filterGrade?._id || initialData.filterGrade || '',
        description: initialData.description || '',
        isDefault: Boolean(initialData.isDefault),
        status: initialData.status || 'active'
      });
      setSelectedFile(null);
      if (initialData.fileUrl) {
        setFilePreview(initialData.fileUrl);
        const isPdf = initialData.format === 'pdf' || initialData.fileUrl.toLowerCase().endsWith('.pdf');
        setFileType(isPdf ? 'pdf' : 'image');
      } else {
        setFilePreview(null);
      }
    } else {
      setFormData({
        drawingCode: '',
        drawingName: '',
        filterGrade: '',
        description: '',
        isDefault: false,
        status: 'active'
      });
      setSelectedFile(null);
      setFilePreview(null);
      setFileType('image');
    }
    setError('');
  }, [initialData, isOpen]);

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

    if (!formData.filterGrade) {
      setError('Please select an assigned Filter Grade.');
      return;
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
      data.append('filterGrade', formData.filterGrade);
      data.append('description', formData.description.trim());
      data.append('isDefault', formData.isDefault ? 'true' : 'false');
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
      maxWidth="680px"
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

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label font-semibold text-slate-700">
              Drawing Code *
            </label>
            <Input
              type="text"
              placeholder="e.g. DRW-H14-FLG-01"
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
              placeholder="e.g. HEPA Filter H14 Flange Drawing"
              value={formData.drawingName}
              onChange={(e) => setFormData({ ...formData, drawingName: e.target.value })}
              required
              className="text-xs"
            />
          </div>
        </div>

        {/* Filter Grade & Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label font-semibold text-slate-700">
              Assigned Filter Grade *
            </label>
            <Select
              value={formData.filterGrade}
              onChange={(e) => setFormData({ ...formData, filterGrade: e.target.value })}
              required
              className="text-xs"
              disabled={loadingGrades}
            >
              <option value="">{loadingGrades ? 'Loading grades...' : 'Select Filter Grade'}</option>
              {filterGrades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.filterGrade} {g.eurovent ? `(${g.eurovent})` : ''} {g.iso ? `[${g.iso}]` : ''}
                </option>
              ))}
            </Select>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Source of truth: Filter Grade Master</span>
          </div>

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
        </div>

        {/* Description / Remarks */}
        <div>
          <label className="form-label font-semibold text-slate-700">
            Description / Engineering Remarks (Optional)
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800"
            placeholder="Additional CAD specifications, tolerance, revision notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Default Designation Toggle */}
        <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-900 block text-xs">Set as Default Drawing for this Grade</span>
            <span className="text-[11px] text-slate-500">
              When items with this Filter Grade are selected, this drawing will be picked automatically.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
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
                    <span className="font-semibold text-slate-800 text-xs">{selectedFile ? selectedFile.name : (initialData?.fileName || `${formData.drawingCode}.pdf`)}</span>
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
