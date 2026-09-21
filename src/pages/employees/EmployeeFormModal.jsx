import React, { useState, useEffect } from 'react';
import { createEmployee, updateEmployee, getDepartments } from '../../services/employeeService';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
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
      if (isEditMode) {
        const updatePayload = {
          fullName: formData.fullName,
          department: formData.department,
          designation: formData.designation,
          email: formData.email || undefined,
          mobile: formData.mobile || undefined,
          joiningDate: formData.joiningDate,
          status: formData.status,
        };
        const res = await updateEmployee(employee._id, updatePayload);
        if (res.success) {
          setSuccessMessage('Employee updated successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        const res = await createEmployee(formData);
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
      maxWidth="540px"
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
              className="form-input"
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
              className="form-input"
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
              className="form-select"
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
              className="form-input"
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
              className="form-input"
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
              className="form-input"
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
              className="form-input"
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
              className="form-select"
              value={formData.status}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;
