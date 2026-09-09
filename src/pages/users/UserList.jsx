import React, { useState, useEffect, useMemo } from 'react';
import { getUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import CreateUserModal from './CreateUserModal';
import { 
  UserPlus, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';

const UserList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('USER_CREATE');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const columns = [
    {
      key: 'username',
      header: 'Username',
      width: '150px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'employee',
      header: 'Linked Employee',
      width: '240px',
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
      width: '240px',
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
      width: '160px',
      render: (val) => formatDate(val),
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
          <span>Permission Level: {canCreate ? 'Create & View Accounts' : 'View Accounts Only'}</span>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchUserData}
        existingUsers={users}
      />
    </div>
  );
};

export default UserList;
