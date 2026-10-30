import React, { useState, useEffect, useMemo } from 'react';
import { useGetEmployeesQuery } from '../../features/employees/employeesApi';
import { useGetDepartmentsQuery } from '../../features/departments/departmentsApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import EmployeeFormModal from './EmployeeFormModal';
import EmployeeDetailModal from './EmployeeDetailModal';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

const EmployeeList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('EMPLOYEE_CREATE');
  const canEdit = hasPermission('EMPLOYEE_EDIT');

  // Pagination states (25 records per page)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: pageSize,
    };
    if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== 'all') params.status = statusFilter;
    if (departmentFilter !== 'all') params.department = departmentFilter;
    if (sortBy) params.sortBy = sortBy;
    return params;
  }, [page, pageSize, debouncedSearch, statusFilter, departmentFilter, sortBy]);

  // RTK Query hooks
  const { data: employeeData, isLoading: loading, error: queryError, refetch } = useGetEmployeesQuery(queryParams);
  const { data: deptData } = useGetDepartmentsQuery();

  const employees = employeeData?.employees || [];
  const totalRecords = typeof employeeData?.total === 'number' ? employeeData.total : (employeeData?.count || 0);
  const totalPages = employeeData?.totalPages || Math.ceil(totalRecords / pageSize) || 1;
  const departments = deptData?.departments || [];

  const error = queryError?.data?.message || (queryError ? 'Failed to connect to server' : '');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setSortBy('name_asc');
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // DataTable column configurations
  const columns = [
    {
      key: 'employeeCode',
      header: 'Code',
      width: '110px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Full Name',
      width: '200px',
      render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>,
    },
    {
      key: 'department',
      header: 'Department',
      width: '160px',
      render: (val) => val?.departmentName ? val.departmentName : <span className="text-muted">Unassigned</span>,
    },
    {
      key: 'designation',
      header: 'Designation',
      width: '160px',
    },
    {
      key: 'email',
      header: 'Email',
      width: '180px',
      render: (val) => val ? val : <span className="text-muted">—</span>,
    },
    {
      key: 'joiningDate',
      header: 'Joining Date',
      width: '130px',
      render: (val) => formatDate(val),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (val) => <StatusBadge status={val} />,
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
              setSelectedEmployee(row);
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
                setEditingEmployee(row);
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

  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== 'all' ||
    departmentFilter !== 'all' ||
    sortBy !== 'name_asc'
  );

  return (
    <div>
      <PageHeader
        title="Employee Master"
        description="Manage staff directory, department assignments, and permission roles."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Organization' },
          { label: 'Employees' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={() => fetchEmployeeData()}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => {
                  setEditingEmployee(null);
                  setIsFormOpen(true);
                }}
              >
                Add Employee
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Filter Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search by code, name, designation, department, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} className="text-muted" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '140px' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </Select>
            </div>

            {departments.length > 0 && (
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.departmentName}
                  </option>
                ))}
              </Select>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={15} className="text-muted" />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: '170px' }}
              >
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="code_asc">Code: Ascending</option>
                <option value="code_desc">Code: Descending</option>
                <option value="joining_newest">Joining: Newest</option>
                <option value="joining_oldest">Joining: Oldest</option>
                <option value="newest">Recently Added</option>
                <option value="oldest">Oldest Added</option>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={handleClearFilters}
                title="Reset Filters"
                style={{ color: 'var(--neutral-600)' }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Data Table Component */}
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          emptyTitle="No employee records found"
          emptyDescription={
            hasActiveFilters
              ? 'Try adjusting your search query or filters.'
              : 'Click "Add Employee" above to create your first employee record.'
          }
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            totalRecords: totalRecords,
            pageSize: pageSize,
            recordLabel: 'employees',
            onPageChange: handlePageChange,
          }}
        />

        {/* Access Level Indicator */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <EmployeeFormModal
        employee={editingEmployee}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => refetch()}
      />

      <EmployeeDetailModal
        employee={selectedEmployee}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(emp) => {
          setEditingEmployee(emp);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default EmployeeList;
