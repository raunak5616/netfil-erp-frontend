import React, { useState, useEffect, useMemo } from 'react';
import { getRoles, createRole, updateRole } from '../../services/roleService';
import { getPermissions } from '../../services/permissionService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import RoleFormModal from './RoleFormModal';
import Modal from '../../components/ui/Modal';
import { 
  Shield, 
  ShieldPlus, 
  Search, 
  RefreshCw, 
  Edit, 
  Eye, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

const RoleList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('ROLE_CREATE');
  const canEdit = hasPermission('ROLE_EDIT');

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedEditRole, setSelectedEditRole] = useState(null);

  const [selectedViewRole, setSelectedViewRole] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [roleRes, permRes] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);

      if (roleRes.success && Array.isArray(roleRes.roles)) {
        setRoles(roleRes.roles);
      }
      if (permRes.success && Array.isArray(permRes.permissions)) {
        setPermissions(permRes.permissions);
      }
    } catch (err) {
      console.error("Failed to load roles or permissions:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const name = (r.roleName || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const perms = (r.permissions || []).map((p) => typeof p === 'string' ? p : `${p.permissionCode} ${p.permissionName}`).join(' ').toLowerCase();

      return name.includes(term) || desc.includes(term) || perms.includes(term);
    });
  }, [roles, searchTerm]);

  const handleOpenCreate = () => {
    setSelectedEditRole(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (roleDoc) => {
    setSelectedEditRole(roleDoc);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (roleDoc) => {
    setSelectedViewRole(roleDoc);
    setIsViewModalOpen(true);
  };

  const handleSaveRole = async (payload, roleId) => {
    if (roleId) {
      const res = await updateRole(roleId, payload);
      if (res.success) {
        await fetchData();
      }
    } else {
      const res = await createRole(payload);
      if (res.success) {
        await fetchData();
      }
    }
  };

  const columns = [
    {
      key: 'roleName',
      header: 'Role Name',
      render: (roleName, row) => (
        <div className="flex items-center gap-2">
          <Shield size={16} className={(roleName || '').toLowerCase() === 'admin' ? 'text-purple-600' : 'text-blue-600'} />
          <span className="font-semibold text-slate-800">{roleName}</span>
          {(roleName || '').toLowerCase() === 'admin' && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded border border-purple-200 uppercase">
              Superadmin
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (desc) => (
        <span className="text-slate-600 text-xs">
          {desc || <em className="text-slate-400">No description provided</em>}
        </span>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions Granted',
      render: (perms) => {
        const count = Array.isArray(perms) ? perms.length : 0;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`
                px-2.5 py-1 rounded-full text-xs font-semibold border
                ${
                  count > 0
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }
              `}
            >
              {count} {count === 1 ? 'Permission' : 'Permissions'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenView(row)}
            title="View Capabilities"
          >
            <Eye size={15} />
            <span>View</span>
          </Button>

          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Role & Permissions"
            >
              <Edit size={15} />
              <span>Edit</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role & Access Control Management"
        subtitle="Create security roles and assign explicit permission capabilities across NETFIL ERP modules."
        actions={
          canCreate && (
            <Button variant="primary" onClick={handleOpenCreate}>
              <ShieldPlus size={16} />
              <span>Create New Role</span>
            </Button>
          )
        }
      />

      {error && <Alert type="danger">{error}</Alert>}

      {/* Filter and Table Container */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search roles or permissions..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button variant="outline" size="sm" onClick={fetchData} loading={loading}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filteredRoles}
          loading={loading}
          emptyMessage="No roles found matching criteria."
        />
      </div>

      {/* Create / Edit Role Modal */}
      <RoleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleSaveRole}
        roleToEdit={selectedEditRole}
        allPermissions={permissions}
      />

      {/* View Role Permissions Detail Modal */}
      {selectedViewRole && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Role Details: ${selectedViewRole.roleName}`}
          maxWidth="650px"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</h4>
              <p className="text-sm text-slate-800 mt-1">
                {selectedViewRole.description || 'No description available.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assigned Capabilities ({selectedViewRole.permissions?.length || 0})
                </h4>
              </div>

              {!selectedViewRole.permissions || selectedViewRole.permissions.length === 0 ? (
                <Alert type="warning">
                  This role currently has <strong>NO PERMISSIONS</strong> assigned. Users with this role cannot perform protected actions.
                </Alert>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-md custom-scrollbar">
                  {selectedViewRole.permissions.map((perm) => {
                    const isObj = typeof perm === 'object' && perm !== null;
                    const code = isObj ? perm.permissionCode : perm;
                    const name = isObj ? perm.permissionName : perm;
                    const moduleName = isObj ? perm.module : 'System';

                    return (
                      <div
                        key={isObj ? perm._id : perm}
                        className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span className="font-medium text-slate-800">{name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({code})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {moduleName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RoleList;
