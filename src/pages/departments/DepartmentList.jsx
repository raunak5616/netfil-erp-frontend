import React, { useState, useMemo } from 'react';
import { useGetDepartmentsQuery } from '../../features/departments/departmentsApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import DepartmentFormModal from './DepartmentFormModal';
import DepartmentDetailModal from './DepartmentDetailModal';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw 
} from 'lucide-react';

const DepartmentList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('DEPARTMENT_CREATE');
  const canEdit = hasPermission('DEPARTMENT_EDIT');

  // Redux Toolkit Query - automated caching and deduplication
  const {
    data: deptData,
    isLoading: loading,
    isFetching,
    error: apiError,
    refetch,
  } = useGetDepartmentsQuery();

  const departments = useMemo(() => {
    return Array.isArray(deptData?.departments) ? deptData.departments : [];
  }, [deptData]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      if (statusFilter !== 'all' && dept.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (dept.departmentCode || '').toLowerCase();
      const name = (dept.departmentName || '').toLowerCase();

      return code.includes(term) || name.includes(term);
    });
  }, [departments, searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      key: 'departmentCode',
      header: 'Code',
      width: '130px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department Name',
      width: '260px',
      render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      width: '140px',
      render: (val) => formatDate(val),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '140px',
      render: (_, row) => (
        <div style={{ display: 'inline-flex', gap: '4px' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedDepartment(row);
              setIsDetailOpen(true);
            }}
          >
            View
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => {
                setEditingDepartment(row);
                setIsFormOpen(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  const errorMessage = apiError ? (apiError.data?.message || 'Failed to load departments') : '';

  return (
    <div>
      <PageHeader
        title="Department Master"
        description="Manage organizational departments and operational units."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Organization' },
          { label: 'Departments' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={isFetching} onClick={refetch}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingDepartment(null);
                  setIsFormOpen(true);
                }}
              >
                Add Department
              </Button>
            )}
          </>
        }
      />

      {errorMessage && <Alert type="danger" message={errorMessage} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search by department code or name..."
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
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>
          </div>
        </div>

        {/* Data Table Component */}
        <DataTable
          columns={columns}
          data={filteredDepartments}
          loading={loading}
          emptyTitle="No department records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Department" above to create your first department record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Showing {filteredDepartments.length} of {departments.length} total departments</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <DepartmentFormModal
        department={editingDepartment}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={refetch}
      />

      <DepartmentDetailModal
        department={selectedDepartment}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(dept) => {
          setEditingDepartment(dept);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default DepartmentList;
