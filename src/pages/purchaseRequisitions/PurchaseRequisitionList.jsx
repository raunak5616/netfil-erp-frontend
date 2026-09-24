import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPurchaseRequisitions,
  deletePurchaseRequisition
} from '../../services/purchaseRequisitionService';
import { getDepartments } from '../../services/departmentService';
import { getEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/FormField';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Building2,
  User,
  AlertCircle
} from 'lucide-react';

const PurchaseRequisitionList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('PURCHASE_REQUISITION_CREATE');
  const canEdit = hasPermission('PURCHASE_REQUISITION_EDIT');
  const canCancel = hasPermission('PURCHASE_REQUISITION_CANCEL');

  const [requisitions, setRequisitions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Confirm Delete / Cancel Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRequisitions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (departmentFilter !== 'all') params.department = departmentFilter;
      if (employeeFilter !== 'all') params.requestingEmployee = employeeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getPurchaseRequisitions(params);

      if (res.success && Array.isArray(res.purchaseRequisitions)) {
        setRequisitions(res.purchaseRequisitions);
        if (res.pagination) {
          setTotalCount(res.pagination.totalCount || 0);
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setError('Unexpected response structure from server');
      }
    } catch (err) {
      console.error('Failed to fetch Purchase Requisitions:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        getDepartments().catch(() => ({ success: false, departments: [] })),
        getEmployees().catch(() => ({ success: false, employees: [] }))
      ]);

      if (deptRes.success && Array.isArray(deptRes.departments)) {
        setDepartments(deptRes.departments.filter((d) => d.status === 'active'));
      }
      if (empRes.success && Array.isArray(empRes.employees)) {
        setEmployees(empRes.employees.filter((e) => e.status === 'active'));
      }
    } catch (err) {
      console.error('Failed to fetch master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequisitions();
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, priorityFilter, departmentFilter, employeeFilter, startDate, endDate, page, limit]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchRequisitions();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDepartmentFilter('all');
    setEmployeeFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setActionLoading(deleteTarget._id);
    setError('');
    try {
      const res = await deletePurchaseRequisition(deleteTarget._id);
      if (res.success) {
        setSuccessMessage(res.message || 'Purchase Requisition action completed');
        fetchRequisitions();
      } else {
        setError(res.message || 'Failed to delete/cancel Purchase Requisition');
      }
    } catch (err) {
      console.error('Delete/Cancel PR error:', err);
      setError(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'prNumber',
        header: 'PR Number',
        render: (val, row) => (
          <button
            type="button"
            onClick={() => navigate(`/purchase-requisitions/${row._id}`)}
            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
            title="View PR Details"
          >
            {val}
          </button>
        )
      },
      {
        key: 'prDate',
        header: 'PR Date',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'requestingEmployee',
        header: 'Requester',
        render: (_, row) => (
          <div>
            <div className="font-semibold text-slate-900">
              {row.requestingEmployee?.fullName || row.requestingEmployee?.employeeCode || '—'}
            </div>
            {row.requestingEmployee?.designation && (
              <div className="text-[11px] text-slate-500">{row.requestingEmployee.designation}</div>
            )}
          </div>
        )
      },
      {
        key: 'department',
        header: 'Department',
        render: (_, row) => (
          <span className="font-medium text-slate-700">
            {row.department?.departmentName || row.department?.departmentCode || '—'}
          </span>
        )
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (val) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${getPriorityBadgeClass(val)}`}>
            {val || 'MEDIUM'}
          </span>
        )
      },
      {
        key: 'requiredDate',
        header: 'Required Date',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'totalQuantity',
        header: 'Total Items / Qty',
        align: 'right',
        render: (_, row) => {
          const itemCount = row.items?.length || 0;
          const totalQty = (row.items || []).reduce((sum, item) => sum + (Number(item.requestedQuantity) || 0), 0);
          return (
            <div className="text-right">
              <span className="font-semibold text-slate-900">{totalQty.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-slate-500 block">({itemCount} line {itemCount === 1 ? 'item' : 'items'})</span>
            </div>
          );
        }
      },
      {
        key: 'status',
        header: 'Status',
        render: (val) => <StatusBadge status={val} />
      },
      {
        key: 'createdBy',
        header: 'Created By',
        render: (_, row) => (
          <span className="text-slate-600">
            {row.createdBy?.fullName || row.createdBy?.username || '—'}
          </span>
        )
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (_, row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate(`/purchase-requisitions/${row._id}`)}
              title="View Details"
            >
              <Eye size={13} className="mr-1" /> View
            </Button>

            {canEdit && row.status === 'DRAFT' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate(`/purchase-requisitions/${row._id}/edit`)}
                title="Edit Draft PR"
              >
                <Edit size={13} className="mr-1" /> Edit
              </Button>
            )}

            {canCancel && !['CANCELLED', 'CLOSED'].includes(row.status) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteTarget(row)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                title={row.status === 'DRAFT' ? 'Delete Draft PR' : 'Cancel PR'}
              >
                <Trash2 size={13} className="mr-1" />
                {row.status === 'DRAFT' ? 'Delete' : 'Cancel'}
              </Button>
            )}
          </div>
        )
      }
    ],
    [canEdit, canCancel, navigate]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Requisitions"
        subtitle="Manage and track internal material purchase requisitions across departments."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchRequisitions}
              disabled={loading}
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/purchase-requisitions/create')}
              >
                <Plus size={14} className="mr-1.5" />
                Create Purchase Requisition
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

      {/* Filter Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PR No, purpose, items, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="w-36">
            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="w-44">
            <Select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentName}
                </option>
              ))}
            </Select>
          </div>

          {/* Requesting Employee Filter */}
          <div className="w-44">
            <Select
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Requesters</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName || emp.employeeCode}
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-600 text-slate-800 bg-white"
              title="From Date"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-600 text-slate-800 bg-white"
              title="To Date"
            />
          </div>

          {/* Buttons */}
          <Button type="submit" variant="primary" size="sm">
            <Filter size={13} className="mr-1" /> Search
          </Button>

          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all' || employeeFilter !== 'all' || startDate || endDate) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={requisitions}
        loading={loading}
        emptyTitle="No Purchase Requisitions found"
        emptyDescription={
          canCreate
            ? "Click '+ Create Purchase Requisition' to submit a new internal material request."
            : "No purchase requisition records match your selected criteria."
        }
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          totalRecords: totalCount,
          onPageChange: (newPage) => setPage(newPage)
        }}
      />

      {/* Confirmation Modal for Delete / Cancel */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title={deleteTarget.status === 'DRAFT' ? 'Delete Draft Purchase Requisition' : 'Cancel Purchase Requisition'}
          message={`Are you sure you want to ${deleteTarget.status === 'DRAFT' ? 'permanently delete draft' : 'cancel'} Purchase Requisition "${deleteTarget.prNumber}"? This action cannot be undone.`}
          confirmLabel={deleteTarget.status === 'DRAFT' ? 'Delete Draft' : 'Cancel Requisition'}
          variant="danger"
          loading={actionLoading === deleteTarget._id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default PurchaseRequisitionList;
