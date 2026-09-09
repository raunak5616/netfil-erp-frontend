import React, { useState, useEffect, useMemo } from 'react';
import { getEmployees } from '../../services/employeeService';
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
  RefreshCw 
} from 'lucide-react';

const EmployeeList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('EMPLOYEE_CREATE');
  const canEdit = hasPermission('EMPLOYEE_EDIT');

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployeeData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEmployees();
      if (data.success && Array.isArray(data.employees)) {
        setEmployees(data.employees);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      const name = (emp.fullName || '').toLowerCase();
      const designation = (emp.designation || '').toLowerCase();
      const deptName = (emp.department?.departmentName || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();

      return (
        code.includes(term) ||
        name.includes(term) ||
        designation.includes(term) ||
        deptName.includes(term) ||
        email.includes(term)
      );
    });
  }, [employees, searchTerm, statusFilter]);

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
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchEmployeeData}>
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

      <div className="card">
        {/* Filter Controls Toolbar */}
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search size={16} />
            <Input
              placeholder="Search by code, name, designation, department..."
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
          data={filteredEmployees}
          loading={loading}
          emptyTitle="No employee records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Employee" above to create your first employee record.'
          }
        />

        {/* Record Counter Summary Footer */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Showing {filteredEmployees.length} of {employees.length} total employees</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <EmployeeFormModal
        employee={editingEmployee}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchEmployeeData}
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
