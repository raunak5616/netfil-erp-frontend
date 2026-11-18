import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  useCreateFaceVelocityMutation,
  useUpdateFaceVelocityMutation,
  useGetFilterGradesQuery,
} from '../../features/masterData/masterDataApi';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { Gauge, Layers, Ruler, Activity, X, Search, Check, CheckSquare, Square } from 'lucide-react';

const FaceVelocityFormModal = ({
  configData,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!configData;

  const [createConfigMutation] = useCreateFaceVelocityMutation();
  const [updateConfigMutation] = useUpdateFaceVelocityMutation();
  const { data: gradesData } = useGetFilterGradesQuery();

  const filterGrades = gradesData?.filterGrades || [];

  // Multi-select state for Filter Grades
  const [selectedGradeIds, setSelectedGradeIds] = useState([]);
  const [gradeSearchTerm, setGradeSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    minDepth: '',
    maxDepth: '',
    pleatsPerFeet: '',
    faceVelocity: '',
    status: 'active',
    remarks: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (configData && isOpen) {
      // Extract multiple grades or fallback to single grade
      let initialGrades = [];
      if (Array.isArray(configData.filterGrades) && configData.filterGrades.length > 0) {
        initialGrades = configData.filterGrades.map((g) => String(g?._id || g));
      } else if (configData.filterGrade) {
        initialGrades = [String(configData.filterGrade?._id || configData.filterGrade)];
      }

      setSelectedGradeIds(initialGrades);
      setFormData({
        minDepth: configData.minDepth !== undefined ? String(configData.minDepth) : '',
        maxDepth: configData.maxDepth !== undefined ? String(configData.maxDepth) : '',
        pleatsPerFeet: configData.pleatsPerFeet !== undefined ? String(configData.pleatsPerFeet) : '',
        faceVelocity: configData.faceVelocity !== undefined ? String(configData.faceVelocity) : '',
        status: configData.status || 'active',
        remarks: configData.remarks || '',
      });
    } else if (isOpen) {
      setSelectedGradeIds([]);
      setFormData({
        minDepth: '',
        maxDepth: '',
        pleatsPerFeet: '',
        faceVelocity: '',
        status: 'active',
        remarks: '',
      });
    }
    setGradeSearchTerm('');
    setIsDropdownOpen(false);
    setError('');
  }, [configData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // Grade selection handlers
  const handleToggleGrade = (gradeId) => {
    const idStr = String(gradeId);
    setSelectedGradeIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
    if (error) setError('');
  };

  const handleRemoveGrade = (gradeId, e) => {
    if (e) e.stopPropagation();
    const idStr = String(gradeId);
    setSelectedGradeIds((prev) => prev.filter((id) => id !== idStr));
  };

  const handleSelectAllGrades = () => {
    const allIds = filterGrades.map((g) => String(g._id));
    setSelectedGradeIds(allIds);
  };

  const handleClearAllGrades = () => {
    setSelectedGradeIds([]);
  };

  // Filtered grades based on search input
  const filteredAvailableGrades = useMemo(() => {
    if (!gradeSearchTerm.trim()) return filterGrades;
    const term = gradeSearchTerm.toLowerCase();
    return filterGrades.filter((g) => {
      const name = (g.filterGrade || '').toLowerCase();
      const euro = (g.eurovent || '').toLowerCase();
      const iso = (g.iso || '').toLowerCase();
      return name.includes(term) || euro.includes(term) || iso.includes(term);
    });
  }, [filterGrades, gradeSearchTerm]);

  // Selected grade objects for rendering chips
  const selectedGradeObjects = useMemo(() => {
    return selectedGradeIds
      .map((id) => filterGrades.find((g) => String(g._id) === String(id)))
      .filter(Boolean);
  }, [selectedGradeIds, filterGrades]);

  const validateForm = () => {
    if (!selectedGradeIds || selectedGradeIds.length === 0) {
      return 'Please select at least one Filter Grade.';
    }

    const minD = Number(formData.minDepth);
    if (!formData.minDepth || isNaN(minD) || minD <= 0) {
      return 'Minimum Depth must be a positive number in mm.';
    }

    const maxD = Number(formData.maxDepth);
    if (!formData.maxDepth || isNaN(maxD) || maxD <= 0) {
      return 'Maximum Depth must be a positive number in mm.';
    }

    if (minD > maxD) {
      return 'Minimum Depth cannot be greater than Maximum Depth.';
    }

    const pleats = Number(formData.pleatsPerFeet);
    if (!formData.pleatsPerFeet || isNaN(pleats) || pleats <= 0) {
      return 'No. of Pleats Per Feet must be a positive number.';
    }

    const fv = Number(formData.faceVelocity);
    if (!formData.faceVelocity || isNaN(fv) || fv <= 0) {
      return 'Face Velocity must be a positive number (FPM).';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErr = validateForm();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        filterGrades: selectedGradeIds,
        filterGrade: selectedGradeIds[0],
        minDepth: Number(formData.minDepth),
        maxDepth: Number(formData.maxDepth),
        pleatsPerFeet: Number(formData.pleatsPerFeet),
        faceVelocity: Number(formData.faceVelocity),
        status: formData.status,
        remarks: formData.remarks?.trim() || '',
      };

      if (isEdit) {
        await updateConfigMutation({
          id: configData._id,
          ...payload,
        }).unwrap();
      } else {
        await createConfigMutation(payload).unwrap();
      }

      if (onSuccess) {
        onSuccess(isEdit ? 'Configuration updated successfully.' : 'Configuration created successfully.');
      }
      onClose();
    } catch (err) {
      console.error('Failed to save Face Velocity configuration:', err);
      setError(err?.data?.message || err?.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Face Velocity Configuration' : 'Add Face Velocity Configuration'}
      maxWidth="720px"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            * Multiple filter grades can share identical engineering parameters
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="text-xs px-3.5 py-1.5"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              className="text-xs px-4 py-1.5 font-semibold"
            >
              {loading ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update Configuration' : 'Save Configuration')}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && <Alert variant="error" message={error} />}

        {/* Section 1: Filter Grades Multi-Select & Status */}
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Layers size={14} className="text-primary-600" />
              <span>Assigned Filter Grades & Status</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllGrades}
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearAllGrades}
                className="text-slate-500 hover:text-red-600 font-medium hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Selected Grades Removable Chips */}
          <div className="min-h-[46px] p-2 bg-white rounded-lg border border-slate-200/90 flex flex-wrap items-center gap-1.5 shadow-2xs">
            {selectedGradeObjects.length > 0 ? (
              selectedGradeObjects.map((g) => (
                <span
                  key={g._id}
                  className="inline-flex items-center gap-1.5 font-semibold text-xs text-primary-800 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200"
                >
                  <Layers size={12} className="text-primary-600" />
                  <span>{g.filterGrade}</span>
                  {g.eurovent && <span className="text-[10px] text-primary-600 font-normal">({g.eurovent})</span>}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveGrade(g._id, e)}
                    className="p-0.5 rounded-full hover:bg-primary-200 text-primary-500 hover:text-primary-900 transition-colors"
                    title={`Remove ${g.filterGrade}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic px-1">
                No Filter Grades selected yet. Click the dropdown below to select grades.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Searchable Multi-Select Dropdown */}
            <div className="sm:col-span-2 relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Filter Grades <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="w-full h-[38px] px-3 text-left bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedGradeIds.length > 0
                    ? `${selectedGradeIds.length} Grade(s) Selected`
                    : '-- Click to select Filter Grades --'}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search filter grades..."
                      value={gradeSearchTerm}
                      onChange={(e) => setGradeSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-primary-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredAvailableGrades.length > 0 ? (
                      filteredAvailableGrades.map((g) => {
                        const isSelected = selectedGradeIds.includes(String(g._id));
                        return (
                          <div
                            key={g._id}
                            onClick={() => handleToggleGrade(g._id)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? 'bg-primary-50 text-primary-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckSquare size={14} className="text-primary-600 shrink-0" />
                              ) : (
                                <Square size={14} className="text-slate-400 shrink-0" />
                              )}
                              <span>{g.filterGrade}</span>
                              {g.eurovent && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({g.eurovent})
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <Check size={13} className="text-primary-600 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-2 text-center text-xs text-slate-400 italic">
                        No filter grades match '{gradeSearchTerm}'
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <FormField label="Configuration Status" required>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </div>
        </div>

        {/* Section 2: Depth Range */}
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Ruler size={14} className="text-primary-600" />
              <span>Depth Range (MM)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Min Depth mm" required>
              <Input
                type="number"
                name="minDepth"
                value={formData.minDepth}
                onChange={handleChange}
                placeholder="e.g. 25"
                min="1"
                step="1"
                disabled={loading}
                required
              />
            </FormField>

            <FormField label="Max Depth mm" required>
              <Input
                type="number"
                name="maxDepth"
                value={formData.maxDepth}
                onChange={handleChange}
                placeholder="e.g. 60"
                min="1"
                step="1"
                disabled={loading}
                required
              />
            </FormField>
          </div>

          {formData.minDepth && formData.maxDepth && (
            <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200/60 flex items-center justify-between">
              <span>Applies to any filter depth between:</span>
              <span className="font-semibold text-primary-600">
                {formData.minDepth} mm – {formData.maxDepth} mm
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Engineering Specifications */}
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Activity size={14} className="text-primary-600" />
            <span>Engineering Performance Specifications</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Pleats / Foot" required>
              <Input
                type="number"
                name="pleatsPerFeet"
                value={formData.pleatsPerFeet}
                onChange={handleChange}
                placeholder="e.g. 11"
                min="1"
                step="1"
                disabled={loading}
                required
              />
            </FormField>

            <FormField label="Face Velocity (FPM)" required>
              <Input
                type="number"
                name="faceVelocity"
                value={formData.faceVelocity}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="1"
                step="1"
                disabled={loading}
                required
              />
            </FormField>
          </div>
        </div>

        {/* Section 4: Remarks */}
        <FormField label="Remarks / Engineering Notes">
          <Textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Optional reference notes (e.g. Standard 2-inch mini-pleat specification for Pre-Filter grades)"
            rows={2}
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default FaceVelocityFormModal;
