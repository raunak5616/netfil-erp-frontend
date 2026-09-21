import React, { useState, useEffect } from 'react';
import { updateUser } from '../../services/userService';
import { getEmployees } from '../../services/employeeService';
import { getRoles } from '../../services/roleService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { Search, X, ShieldCheck } from 'lucide-react';

const EditUserModal = ({ user, isOpen, onClose, onSuccess, existingUsers = [] }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    username: '',
    isActive: true,
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Other user account employee IDs (excluding current user)
  const otherUsersEmployeeIds = new Set(
    existingUsers
      .filter((u) => u._id !== user?._id)
      .map((u) => u.employee?._id || u.employee)
      .filter(Boolean)
  );

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchData = async () => {
      setLoadingData(true);
      setErrorMessage('');
      try {
        const [empRes, roleRes] = await Promise.all([
          getEmployees(),
          getRoles(),
        ]);

        if (empRes.success && Array.isArray(empRes.employees)) {
          setEmployees(empRes.employees);
        }
        if (roleRes.success && Array.isArray(roleRes.roles)) {
          setRoles(roleRes.roles);
        }
      } catch (err) {
        console.error("Failed to load employees or roles:", err);
        setErrorMessage("Could not load employee or role options. Please try again.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();

    // Populate user data
    setFormData({
      employeeId: user.employee?._id || user.employee || '',
      username: user.username || '',
      isActive: user.isActive ?? true,
    });

    const initialRoles = Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles.map((r) => (typeof r === 'string' ? r : r._id))
      : user.role
      ? [typeof user.role === 'string' ? user.role : user.role._id]
      : [];

    setSelectedRoleIds(initialRoles);
    setRoleSearchTerm('');
    setSuccessMessage('');
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value,
    }));
  };

  const toggleRoleSelection = (roleId) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const removeRoleSelection = (roleId) => {
    setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
  };

  const filteredRoles = roles.filter((r) => {
    if (!roleSearchTerm.trim()) return true;
    const term = roleSearchTerm.toLowerCase();
    const name = (r.roleName || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    return name.includes(term) || desc.includes(term);
  });

  const validate = () => {
    if (!formData.employeeId) {
      return 'Please select an employee.';
    }
    if (otherUsersEmployeeIds.has(formData.employeeId)) {
      return 'This employee is already linked to another active user account.';
    }
    if (!selectedRoleIds || selectedRoleIds.length === 0) {
      return 'At least one assigned role is required.';
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
      const res = await updateUser(user._id, {
        employeeId: formData.employeeId,
        roleIds: selectedRoleIds,
        isActive: formData.isActive === 'true' || formData.isActive === true,
      });

      if (res.success) {
        setSuccessMessage('User account updated successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to update user account.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit User Account (${user.username})`}
      maxWidth="540px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {errorMessage && (
          <div style={{ gridColumn: 'span 2' }}>
            <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
          </div>
        )}

        {successMessage && (
          <div style={{ gridColumn: 'span 2' }}>
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {/* Username (Read-Only) */}
        <FormField label="Username" fullWidth helperText="System login identifier (read-only)">
          <Input
            name="username"
            value={formData.username}
            disabled
            style={{ backgroundColor: 'var(--neutral-100)', cursor: 'not-allowed', fontWeight: 600 }}
          />
        </FormField>

        {/* Employee Selection */}
        <FormField label="Linked Employee" required fullWidth helperText="Select the corporate employee linked to this login.">
          <Select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            disabled={submitting || loadingData}
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => {
              const isOtherUserEmployee = otherUsersEmployeeIds.has(emp._id);
              return (
                <option key={emp._id} value={emp._id} disabled={isOtherUserEmployee}>
                  {emp.employeeCode} — {emp.fullName} ({emp.department?.departmentName || 'No Dept'}) {isOtherUserEmployee ? ' [Linked to another account]' : ''}
                </option>
              );
            })}
          </Select>
        </FormField>

        {/* Searchable Multi-Role Selection */}
        <FormField label="Assigned System Roles" required fullWidth helperText="Search and assign system roles for permissions.">
          <div style={{ border: '1px solid var(--neutral-300)', borderRadius: '6px', padding: '10px', backgroundColor: '#ffffff' }}>
            <div className="search-input-wrap" style={{ marginBottom: '8px' }}>
              <Search size={15} style={{ color: 'var(--neutral-400)', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <Input
                placeholder="Search roles..."
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
                disabled={submitting || loadingData}
                style={{ fontSize: '13px', paddingLeft: '32px' }}
              />
            </div>

            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid var(--neutral-200)',
                borderRadius: '4px',
                backgroundColor: 'var(--neutral-50)',
                padding: '4px 0'
              }}
            >
              {loadingData ? (
                <div style={{ padding: '12px', fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center' }}>
                  Loading roles...
                </div>
              ) : filteredRoles.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center' }}>
                  No roles found.
                </div>
              ) : (
                filteredRoles.map((r) => {
                  const isSelected = selectedRoleIds.includes(r._id);
                  return (
                    <label
                      key={r._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent',
                        fontSize: '13px',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRoleSelection(r._id)}
                        disabled={submitting}
                        style={{ cursor: 'pointer', accentColor: 'var(--primary-600)' }}
                      />
                      <span style={{ fontWeight: isSelected ? 600 : 400, color: 'var(--neutral-900)' }}>
                        {r.roleName}
                      </span>
                      {r.description && (
                        <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                          ({r.description})
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {selectedRoleIds.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '4px' }}>
                  Assigned Roles ({selectedRoleIds.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedRoleIds.map((roleId) => {
                    const roleObj = roles.find((r) => r._id === roleId);
                    const roleName = roleObj?.roleName || 'Role';
                    return (
                      <span
                        key={roleId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: 'var(--primary-100)',
                          color: 'var(--primary-800)',
                          border: '1px solid var(--primary-200)',
                          borderRadius: '14px',
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <ShieldCheck size={12} color="var(--primary-700)" />
                        {roleName}
                        <button
                          type="button"
                          onClick={() => removeRoleSelection(roleId)}
                          disabled={submitting}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0',
                            marginLeft: '2px',
                            color: 'var(--primary-700)'
                          }}
                          title={`Remove ${roleName}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </FormField>

        {/* Account Status */}
        <FormField label="Account Status" required fullWidth>
          <Select
            name="isActive"
            value={String(formData.isActive)}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="true">Active (Login Enabled)</option>
            <option value="false">Inactive (Login Blocked)</option>
          </Select>
        </FormField>
      </form>
    </Modal>
  );
};

export default EditUserModal;
