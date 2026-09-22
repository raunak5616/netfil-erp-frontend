import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input } from '../../components/ui/FormField';
import { CheckSquare, Square, Shield, Search, Sparkles } from 'lucide-react';

const RoleFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  roleToEdit = null,
  allPermissions = [],
}) => {
  const isEditMode = !!roleToEdit;

  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups = {};
    allPermissions.forEach((perm) => {
      const moduleName = perm.module || 'General';
      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }
      groups[moduleName].push(perm);
    });
    return groups;
  }, [allPermissions]);

  useEffect(() => {
    if (!isOpen) return;

    if (roleToEdit) {
      setRoleName(roleToEdit.roleName || '');
      setDescription(roleToEdit.description || '');
      const existingIds = (roleToEdit.permissions || [])
        .map((p) => (typeof p === 'string' ? p : p._id))
        .filter(Boolean);
      setSelectedPermissionIds(existingIds);
    } else {
      setRoleName('');
      setDescription('');
      setSelectedPermissionIds([]);
    }

    setSearchQuery('');
    setErrorMessage('');
  }, [isOpen, roleToEdit]);

  if (!isOpen) return null;

  const togglePermission = (permId) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const selectAllGlobal = () => {
    const allIds = allPermissions.map((p) => p._id);
    setSelectedPermissionIds(allIds);
  };

  const clearAllGlobal = () => {
    setSelectedPermissionIds([]);
  };

  const selectModule = (moduleName) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    const modulePermIds = modulePerms.map((p) => p._id);
    setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...modulePermIds])));
  };

  const clearModule = (moduleName) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    const modulePermIdSet = new Set(modulePerms.map((p) => p._id));
    setSelectedPermissionIds((prev) => prev.filter((id) => !modulePermIdSet.has(id)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setErrorMessage('Role name is required');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        roleName: roleName.trim(),
        description: description.trim(),
        permissionIds: selectedPermissionIds,
      };

      await onSuccess(payload, roleToEdit?._id);
      onClose();
    } catch (err) {
      console.error("Role save error:", err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Role: ${roleToEdit.roleName}` : 'Create New Role'}
      maxWidth="850px"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Role Name" required>
            <Input
              name="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Sales Executive, Quality Auditor"
              required
            />
          </FormField>

          <FormField label="Description">
            <Input
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role's duties"
            />
          </FormField>
        </div>

        {/* Permissions Section Header & Controls */}
        <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Role Permissions Assignment</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Explicitly select capabilities for this role. Unselected capabilities will be strictly forbidden.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Selected Permissions: {selectedPermissionIds.length}
              </span>

              <button
                type="button"
                onClick={selectAllGlobal}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllGlobal}
                className="px-2.5 py-1 text-xs font-medium text-red-600 bg-white border border-slate-300 rounded hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Search permissions filter */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter permissions or modules..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Grouped Modules List */}
          <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {Object.keys(groupedPermissions).map((moduleName) => {
              const modulePerms = groupedPermissions[moduleName].filter(
                (p) =>
                  !searchQuery.trim() ||
                  p.permissionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.permissionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  moduleName.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (modulePerms.length === 0) return null;

              const allModuleSelected = modulePerms.every((p) =>
                selectedPermissionIds.includes(p._id)
              );

              return (
                <div key={moduleName} className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                  {/* Module Header */}
                  <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                      {moduleName} ({modulePerms.filter((p) => selectedPermissionIds.includes(p._id)).length}/{modulePerms.length})
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectModule(moduleName)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        [Select Module]
                      </button>
                      <button
                        type="button"
                        onClick={() => clearModule(moduleName)}
                        className="text-[11px] text-slate-500 hover:text-red-600 font-medium cursor-pointer"
                      >
                        [Clear]
                      </button>
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {modulePerms.map((perm) => {
                      const isSelected = selectedPermissionIds.includes(perm._id);
                      return (
                        <div
                          key={perm._id}
                          onClick={() => togglePermission(perm._id)}
                          className={`
                            flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-all select-none
                            ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }
                          `}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                              <Square size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{perm.permissionName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.permissionCode}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Total capabilities selected: <strong>{selectedPermissionIds.length}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {isEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RoleFormModal;
