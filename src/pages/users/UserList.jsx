import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, updateUserStatus } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/FormField';
import CreateUserModal from './CreateUserModal';
import UserDetailModal from './UserDetailModal';
import EditUserModal from './EditUserModal';
import ChangePasswordModal from './ChangePasswordModal';
import { 
  UserPlus, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck,
  Eye,
  Edit,
  KeyRound,
  UserCheck,
  UserX
} from 'lucide-react';

const UserList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('USER_CREATE');
  const canEdit = hasPermission('USER_EDIT');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedViewUser, setSelectedViewUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedEditUser, setSelectedEditUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedPasswordUser, setSelectedPasswordUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [selectedStatusUser, setSelectedStatusUser] = useState(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter === 'active' && !u.isActive) return false;
      if (statusFilter === 'inactive' && u.isActive) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const uname = (u.username || '').toLowerCase();
      const empCode = (u.employee?.employeeCode || '').toLowerCase();
      const empName = (u.employee?.fullName || '').toLowerCase();
      const rolesNames = (u.roles || []).map((r) => (typeof r === 'string' ? r : r?.roleName || '')).join(' ').toLowerCase();
      const legacyRole = (u.role?.roleName || '').toLowerCase();

      return (
        uname.includes(term) ||
        empCode.includes(term) ||
        empName.includes(term) ||
        rolesNames.includes(term) ||
        legacyRole.includes(term)
      );
    });
  }, [users, searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenView = (userDoc) => {
    setSelectedViewUser(userDoc);
    setIsViewModalOpen(true);
  };

  const handleOpenEdit = (userDoc) => {
    setSelectedEditUser(userDoc);
    setIsEditModalOpen(true);
  };

  const handleOpenPassword = (userDoc) => {
    setSelectedPasswordUser(userDoc);
    setIsPasswordModalOpen(true);
  };

  const handleToggleStatusClick = (userDoc) => {
    setSelectedStatusUser(userDoc);
    setIsStatusConfirmOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!selectedStatusUser) return;
    setStatusSubmitting(true);
    setError('');
    try {
      const nextStatus = !selectedStatusUser.isActive;
      const res = await updateUserStatus(selectedStatusUser._id, nextStatus);
      if (res.success) {
        setIsStatusConfirmOpen(false);
        setSelectedStatusUser(null);
        await fetchUserData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'Username',
      width: '140px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'employee',
      header: 'Linked Employee',
      width: '220px',
      render: (emp) => (
        emp ? (
          <div>
            <strong style={{ color: 'var(--neutral-900)' }}>{emp.fullName}</strong>
            <div className="font-mono text-muted" style={{ fontSize: '11.5px' }}>{emp.employeeCode}</div>
          </div>
        ) : (
          <span className="text-muted">Unlinked</span>
        )
      ),
    },
    {
      key: 'roles',
      header: 'Assigned Roles',
      width: '220px',
      render: (roles, userDoc) => {
        const rolesList = Array.isArray(roles) && roles.length > 0
          ? roles
          : userDoc?.role
          ? [userDoc.role]
          : [];

        if (rolesList.length === 0) {
          return <span className="text-muted">No Roles</span>;
        }

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {rolesList.map((r, idx) => {
              const name = typeof r === 'string' ? r : r?.roleName || 'Role';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'var(--neutral-100)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: '1px solid var(--neutral-200)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--neutral-800)'
                  }}
                >
                  <ShieldCheck size={12} color="var(--primary-700)" />
                  <span>{name}</span>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Account Status',
      width: '130px',
      render: (active) => <StatusBadge status={active ? 'active' : 'inactive'} label={active ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      width: '150px',
      render: (val) => formatDate(val),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '170px',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => handleOpenView(row)}
            className="p-1.5 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="View User Details"
          >
            <Eye size={15} />
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 rounded text-slate-600 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Edit User Account"
              >
                <Edit size={15} />
              </button>

              <button
                type="button"
                onClick={() => handleOpenPassword(row)}
                className="p-1.5 rounded text-slate-600 hover:text-purple-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Change Password"
              >
                <KeyRound size={15} />
              </button>

              <button
                type="button"
                onClick={() => handleToggleStatusClick(row)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  row.isActive
                    ? 'text-slate-600 hover:text-red-700 hover:bg-red-50'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
                title={row.isActive ? 'Deactivate User Account' : 'Activate User Account'}
              >
                {row.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage ERP user login credentials and assigned system roles."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'System & Security' },
          { label: 'Users' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchUserData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create User
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="card">
        {/* Toolbar Controls */}
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search size={16} />
            <Input
              placeholder="Search by username, employee code, name, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} className="text-muted" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Inactive Accounts</option>
            </Select>
          </div>
        </div>

        {/* Data Table Component */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyTitle="No user accounts found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Create User" above to create an ERP login account for an employee.'
          }
        />

        {/* Footer Summary */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Showing {filteredUsers.length} of {users.length} total user accounts</span>
          <span>Permission Level: {canEdit ? 'Full Management (Create, Edit, Status, Password)' : canCreate ? 'Create & View Accounts' : 'View Accounts Only'}</span>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchUserData}
        existingUsers={users}
      />

      {/* View User Modal */}
      <UserDetailModal
        user={selectedViewUser}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedViewUser(null);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedEditUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditUser(null);
        }}
        onSuccess={fetchUserData}
        existingUsers={users}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        user={selectedPasswordUser}
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedPasswordUser(null);
        }}
        onSuccess={fetchUserData}
      />

      {/* Activate / Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isStatusConfirmOpen}
        onClose={() => {
          setIsStatusConfirmOpen(false);
          setSelectedStatusUser(null);
        }}
        onConfirm={handleConfirmStatusToggle}
        loading={statusSubmitting}
        title={selectedStatusUser?.isActive ? 'Deactivate User Account' : 'Activate User Account'}
        message={
          selectedStatusUser?.isActive
            ? `Are you sure you want to deactivate user account '${selectedStatusUser?.username}'? The user will no longer be able to log into the ERP. Existing records and historical transactions will remain unchanged.`
            : `Are you sure you want to activate user account '${selectedStatusUser?.username}'? The user will regain access to log into the ERP.`
        }
        confirmLabel={selectedStatusUser?.isActive ? 'Deactivate User' : 'Activate User'}
        cancelLabel="Cancel"
        variant={selectedStatusUser?.isActive ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default UserList;
