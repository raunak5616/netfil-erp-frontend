import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPurchaseEnquiries,
  deletePurchaseEnquiry
} from '../../services/purchaseEnquiryService';
import { getDepartments } from '../../services/departmentService';
import { getClients } from '../../services/clientService';
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
  FileText,
  UserCheck
} from 'lucide-react';

const STATUS_DISPLAY_MAP = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  RESPONSE_PENDING: 'Response Pending',
  RECEIVED: 'Response Received',
  EVALUATED: 'Evaluated',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled'
};

const PurchaseEnquiryList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('PURCHASE_ENQUIRY_CREATE');
  const canEdit = hasPermission('PURCHASE_ENQUIRY_EDIT');
  const canCancel = hasPermission('PURCHASE_ENQUIRY_CANCEL');

  const [enquiries, setEnquiries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Confirm Delete / Cancel Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (supplierFilter !== 'all') params.supplier = supplierFilter;
      if (departmentFilter !== 'all') params.department = departmentFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getPurchaseEnquiries(params);

      if (res.success && Array.isArray(res.purchaseEnquiries)) {
        setEnquiries(res.purchaseEnquiries);
        if (res.pagination) {
          setTotalCount(res.pagination.totalCount || 0);
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setError('Unexpected response structure from server');
      }
    } catch (err) {
      console.error('Failed to fetch Purchase Enquiries:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [deptRes, supplierRes] = await Promise.all([
        getDepartments().catch(() => ({ success: false, departments: [] })),
        getClients({ partyType: 'SUPPLIER', status: 'active' }).catch(() => ({ success: false, clients: [], parties: [] }))
      ]);

      if (deptRes.success && Array.isArray(deptRes.departments)) {
        setDepartments(deptRes.departments.filter((d) => d.status === 'active'));
      }
      const rawSuppliers = supplierRes.clients || supplierRes.parties || [];
      if (Array.isArray(rawSuppliers)) {
        setSuppliers(rawSuppliers.filter((s) => s.status === 'active' && ['SUPPLIER', 'BOTH'].includes(s.partyType)));
      }
    } catch (err) {
      console.error('Failed to fetch PE master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnquiries();
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, supplierFilter, departmentFilter, startDate, endDate, page, limit]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchEnquiries();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSupplierFilter('all');
    setDepartmentFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setActionLoading(deleteTarget._id);
    setError('');
    try {
      const res = await deletePurchaseEnquiry(deleteTarget._id);
      if (res.success) {
        setSuccessMessage(res.message || 'Purchase Enquiry action completed');
        fetchEnquiries();
      } else {
        setError(res.message || 'Failed to delete/cancel Purchase Enquiry');
      }
    } catch (err) {
      console.error('Delete/Cancel PE error:', err);
      setError(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'enquiryNumber',
        header: 'Enquiry No.',
        render: (val, row) => (
          <button
            type="button"
            onClick={() => navigate(`/purchase-enquiries/${row._id}`)}
            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
            title="View Enquiry Details"
          >
            {val}
          </button>
        )
      },
      {
        key: 'enquiryDate',
        header: 'Enquiry Date',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'prNumber',
        header: 'PR Reference',
        render: (val, row) => (
          <span className="font-mono font-semibold text-slate-700">
            {val || row.purchaseRequisition?.prNumber || 'Direct PE'}
          </span>
        )
      },
      {
        key: 'supplier',
        header: 'Supplier',
        render: (_, row) => (
          <div>
            <div className="font-semibold text-slate-900">
              {row.supplierName || row.supplier?.companyName || '—'}
            </div>
            {row.supplier?.partyCode && (
              <div className="text-[11px] text-slate-500 font-mono">{row.supplier.partyCode}</div>
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
        key: 'expectedResponseDate',
        header: 'Expected Response',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'validityDate',
        header: 'Validity Date',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'totalRequestedQuantity',
        header: 'Total Qty',
        align: 'right',
        render: (val, row) => {
          const qty = val !== undefined && val !== null
            ? Number(val)
            : (row.items || []).reduce((sum, i) => sum + (Number(i.requestedQuantity) || 0), 0);
          const itemCount = row.items?.length || 0;
          return (
            <div className="text-right">
              <span className="font-semibold text-slate-900">{qty.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-slate-500 block">({itemCount} line {itemCount === 1 ? 'item' : 'items'})</span>
            </div>
          );
        }
      },
      {
        key: 'status',
        header: 'Status',
        render: (val) => (
          <StatusBadge status={val} label={STATUS_DISPLAY_MAP[val] || val} />
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
              onClick={() => navigate(`/purchase-enquiries/${row._id}`)}
              title="View Details"
            >
              <Eye size={13} className="mr-1" /> View
            </Button>

            {canEdit && row.status === 'DRAFT' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate(`/purchase-enquiries/${row._id}/edit`)}
                title="Edit Draft PE"
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
                title={row.status === 'DRAFT' ? 'Delete Draft PE' : 'Cancel PE'}
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
        title="Purchase Enquiries"
        subtitle="Manage competitive supplier quotation inquiries for materials & services."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchEnquiries}
              disabled={loading}
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/purchase-enquiries/create')}
              >
                <Plus size={14} className="mr-1.5" />
                Create Purchase Enquiry
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
              placeholder="Search by PE No, PR No, Supplier, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="RESPONSE_PENDING">Response Pending</option>
              <option value="RECEIVED">Response Received</option>
              <option value="EVALUATED">Evaluated</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>

          {/* Supplier Filter */}
          <div className="w-44">
            <Select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.companyName}
                </option>
              ))}
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

          {(searchTerm || statusFilter !== 'all' || supplierFilter !== 'all' || departmentFilter !== 'all' || startDate || endDate) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={enquiries}
        loading={loading}
        emptyTitle="No Purchase Enquiries found"
        emptyDescription={
          canCreate
            ? "Click '+ Create Purchase Enquiry' to generate a new enquiry for supplier quotes."
            : "No purchase enquiry records match your selected filter criteria."
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
          title={deleteTarget.status === 'DRAFT' ? 'Delete Draft Purchase Enquiry' : 'Cancel Purchase Enquiry'}
          message={`Are you sure you want to ${deleteTarget.status === 'DRAFT' ? 'permanently delete draft' : 'cancel'} Purchase Enquiry "${deleteTarget.enquiryNumber}"? This action cannot be undone.`}
          confirmLabel={deleteTarget.status === 'DRAFT' ? 'Delete Draft' : 'Cancel Enquiry'}
          variant="danger"
          loading={actionLoading === deleteTarget._id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default PurchaseEnquiryList;
