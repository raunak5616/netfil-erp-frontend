import React, { useState, useEffect } from 'react';
import { createEmployee, updateEmployee, getDepartments } from '../../services/employeeService';
import { AlertCircle, CheckCircle2, FileText, Upload, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const EmployeeFormModal = ({ employee, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!employee;

  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    department: '',
    designation: '',
    email: '',
    mobile: '',
    joiningDate: '',
    status: 'active',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [removeDocument, setRemoveDocument] = useState(false);
  const [fileError, setFileError] = useState('');

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch departments for dropdown
  useEffect(() => {
    if (!isOpen) return;

    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const res = await getDepartments();
        if (res.success && Array.isArray(res.departments)) {
          setDepartments(res.departments);
        }
      } catch (err) {
        console.warn("Could not load departments list:", err.message);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepts();
  }, [isOpen]);

  // Populate form data on edit or reset on create
  useEffect(() => {
    if (employee) {
      let formattedDate = '';
      if (employee.joiningDate) {
        formattedDate = new Date(employee.joiningDate).toISOString().split('T')[0];
      }

      setFormData({
        employeeCode: employee.employeeCode || '',
        fullName: employee.fullName || '',
        department: employee.department?._id || employee.department || '',
        designation: employee.designation || '',
        email: employee.email || '',
        mobile: employee.mobile || '',
        joiningDate: formattedDate,
        status: employee.status || 'active',
      });
    } else {
      setFormData({
        employeeCode: '',
        fullName: '',
        department: '',
        designation: '',
        email: '',
        mobile: '',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    }

    setSelectedFile(null);
    setRemoveDocument(false);
    setFileError('');
    setErrorMessage('');
    setSuccessMessage('');
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'employeeCode' ? value.toUpperCase() : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Only PDF files are allowed.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('Employee document must not exceed 5 MB.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setRemoveDocument(false);
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFileError('');
  };

  const handleRemoveExistingDocument = () => {
    setSelectedFile(null);
    setRemoveDocument(true);
    setFileError('');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validate = () => {
    if (!isEditMode && !formData.employeeCode.trim()) {
      return 'Employee code is required.';
    }
    if (!formData.fullName.trim()) {
      return 'Full name is required.';
    }
    if (!formData.department) {
      return 'Please select a department.';
    }
    if (!formData.designation.trim()) {
      return 'Designation is required.';
    }
    if (!formData.joiningDate) {
      return 'Joining date is required.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    if (fileError) {
      return fileError;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = new FormData();
      if (!isEditMode) {
        data.append('employeeCode', formData.employeeCode);
      }
      data.append('fullName', formData.fullName);
      data.append('department', formData.department);
      data.append('designation', formData.designation);
      if (formData.email) data.append('email', formData.email);
      if (formData.mobile) data.append('mobile', formData.mobile);
      data.append('joiningDate', formData.joiningDate);
      data.append('status', formData.status);

      if (selectedFile) {
        data.append('document', selectedFile);
      }

      if (isEditMode && removeDocument) {
        data.append('removeDocument', 'true');
      }

      if (isEditMode) {
        const res = await updateEmployee(employee._id, data);
        if (res.success) {
          setSuccessMessage('Employee updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createEmployee(data);
        if (res.success) {
          setSuccessMessage('Employee created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to save employee.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Employee (${formData.employeeCode})` : 'Add New Employee'}
      maxWidth="580px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Employee' : 'Create Employee'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Employee Code {!isEditMode && <span className="required">*</span>}
            </label>
            <input
              type="text"
              name="employeeCode"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder="e.g. EMP002"
              value={formData.employeeCode}
              onChange={handleChange}
              disabled={isEditMode || submitting}
              style={isEditMode ? { backgroundColor: 'var(--neutral-100)' } : {}}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Department <span className="required">*</span>
            </label>
            <select
              name="department"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              value={formData.department}
              onChange={handleChange}
              disabled={submitting || loadingDepts}
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentName} ({dept.departmentCode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Designation <span className="required">*</span>
            </label>
            <input
              type="text"
              name="designation"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder="e.g. Senior Engineer"
              value={formData.designation}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder="employee@company.com"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder="+91 9876543210"
              value={formData.mobile}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Joining Date <span className="required">*</span>
            </label>
            <input
              type="date"
              name="joiningDate"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              value={formData.joiningDate}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Status <span className="required">*</span>
            </label>
            <select
              name="status"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              value={formData.status}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Employee Document (PDF) Upload Section */}
        <div className="pt-3 border-t border-slate-200">
          <label className="form-label font-semibold text-slate-800 flex items-center justify-between">
            <span>Employee Document (PDF)</span>
            <span className="text-[11px] font-normal text-slate-500">Maximum size: 5 MB</span>
          </label>

          {fileError && (
            <div className="text-red-600 text-xs mb-2 flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{fileError}</span>
            </div>
          )}

          {selectedFile ? (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileText size={16} className="text-red-600 shrink-0" />
                <span className="font-medium text-slate-800 truncate">{selectedFile.name}</span>
                <span className="text-slate-400">—</span>
                <span className="text-slate-500 shrink-0">{formatFileSize(selectedFile.size)}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveSelectedFile}
                className="text-red-600 hover:text-red-700 text-xs font-semibold px-2 py-1"
                disabled={submitting}
              >
                [ Remove ]
              </button>
            </div>
          ) : isEditMode && employee?.employeeDocument && !removeDocument ? (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileText size={16} className="text-blue-600 shrink-0" />
                <span className="font-medium text-slate-800 truncate">
                  {employee.employeeDocument.fileName || 'employee_document.pdf'}
                </span>
                <span className="text-slate-400">—</span>
                <span className="text-slate-500 shrink-0">
                  {formatFileSize(employee.employeeDocument.fileSize)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-blue-600 hover:text-blue-700 text-xs font-semibold px-1 py-0.5">
                  [ Replace ]
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveExistingDocument}
                  className="text-red-600 hover:text-red-700 text-xs font-semibold px-1 py-0.5"
                  disabled={submitting}
                >
                  [ Remove ]
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 bg-white border border-dashed border-slate-300 rounded text-xs">
              <span className="text-slate-500">
                {isEditMode && removeDocument ? 'Document will be removed on update' : 'No document uploaded'}
              </span>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 text-xs font-medium transition-colors">
                <Upload size={14} />
                <span>{isEditMode && removeDocument ? 'Upload PDF' : 'Choose PDF'}</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={submitting}
                />
              </label>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;
