import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPurchaseOrders,
  deletePurchaseOrder,
  updatePurchaseOrderStatus
} from '../../services/purchaseOrderService';
import { getDepartments } from '../../services/departmentService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/FormField';
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
  UserCheck,
  CheckCircle,
  Play,
  FileEdit,
  XCircle,
  Archive
} from 'lucide-react';

const PO_TYPE_LABELS = {
  GENERAL_PO: 'General PO',
  ADMIN_STATIONERY: 'Admin / Stationery',
  CAPITAL: 'Capital',
  CONSUMABLE: 'Consumable',
  EDD: 'EDD',
  OTHERS: 'Others',
  PACKING: 'Packing',
  LABOUR_SUBCONTRACT: 'Labour Subcontract',
  INSERT_TOOLS: 'Insert Tools',
  RAW_MATERIAL: 'Raw Material',
  SERVICE: 'Service',
  MAINTENANCE: 'Maintenance'
};

const STATUS_DISPLAY_MAP = {
  DRAFT: 'Draft',
  CHECKED: 'Checked',
  RELEASED: 'Released',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled'
};

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('PURCHASE_ORDER_CREATE');
  const canEdit = hasPermission('PURCHASE_ORDER_EDIT');
  const canCheck = hasPermission('PURCHASE_ORDER_CHECK');
  const canRelease = hasPermission('PURCHASE_ORDER_RELEASE');
  const canClose = hasPermission('PURCHASE_ORDER_CLOSE');
  const canCancel = hasPermission('PURCHASE_ORDER_CANCEL');
  const canAmend = hasPermission('PURCHASE_ORDER_AMENDMENT_CREATE');

  const [orders, setOrders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [poTypeFilter, setPoTypeFilter] = useState('all');
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

  // Workflow Quick Action Modal State
  const [workflowTarget, setWorkflowTarget] = useState(null);
  const [workflowAction, setWorkflowAction] = useState(null);
  const [workflowRemarks, setWorkflowRemarks] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (poTypeFilter !== 'all') params.poType = poTypeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (supplierFilter !== 'all') params.supplier = supplierFilter;
      if (departmentFilter !== 'all') params.department = departmentFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getPurchaseOrders(params);

      if (res.success && Array.isArray(res.purchaseOrders)) {
        setOrders(res.purchaseOrders);
        if (res.pagination) {
          setTotalCount(res.pagination.totalCount || 0);
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setError('Unexpected response structure from server');
      }
    } catch (err) {
      console.error('Failed to fetch Purchase Orders:', err);
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
      console.error('Failed to fetch PO master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, poTypeFilter, statusFilter, supplierFilter, departmentFilter, startDate, endDate, page, limit]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setPoTypeFilter('all');
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
      const res = await deletePurchaseOrder(deleteTarget._id);
      if (res.success) {
        setSuccessMessage(res.message || 'Purchase Order action completed');
        fetchOrders();
      } else {
        setError(res.message || 'Failed to delete/cancel Purchase Order');
      }
    } catch (err) {
      console.error('Delete/Cancel PO error:', err);
      setError(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const handleWorkflowExecute = async () => {
    if (!workflowTarget || !workflowAction) return;

    setActionLoading(workflowTarget._id);
    setError('');
    try {
      const res = await updatePurchaseOrderStatus(workflowTarget._id, workflowAction, workflowRemarks);
      if (res.success) {
        setSuccessMessage(res.message || `Purchase Order status updated to ${res.purchaseOrder?.status || 'new status'}`);
        fetchOrders();
        setWorkflowTarget(null);
        setWorkflowAction(null);
        setWorkflowRemarks('');
      } else {
        setError(res.message || 'Workflow action failed');
      }
    } catch (err) {
      console.error('PO Workflow error:', err);
      setError(err.response?.data?.message || 'Failed to execute workflow action');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'poNumber',
        header: 'PO Number',
        render: (val, row) => (
          <div>
            <button
              type="button"
              onClick={() => navigate(`/purchase-orders/${row._id}`)}
              className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
              title="View PO Details"
            >
              {val}
            </button>
            {row.amendmentCount > 0 && (
              <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 ml-1.5">
                +{row.amendmentCount} AM
              </span>
            )}
          </div>
        )
      },
      {
        key: 'poDate',
        header: 'PO Date',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'poType',
        header: 'PO Type',
        render: (val) => (
          <span className="font-medium text-slate-700 text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {PO_TYPE_LABELS[val] || val}
          </span>
        )
      },
      {
        key: 'supplier',
        header: 'Supplier',
        render: (_, row) => (
          <div>
            <div className="font-semibold text-slate-900">
              {row.supplierNameSnapshot || row.supplier?.companyName || '—'}
            </div>
            {(row.supplierCodeSnapshot || row.supplier?.partyCode) && (
              <div className="text-[11px] text-slate-500 font-mono">{row.supplierCodeSnapshot || row.supplier?.partyCode}</div>
            )}
          </div>
        )
      },
      {
        key: 'prNumber',
        header: 'PR Ref',
        render: (_, row) => (
          <span className="font-mono text-slate-700 text-xs">
            {row.prNumberSnapshot || row.purchaseRequisition?.prNumber || '—'}
          </span>
        )
      },
      {
        key: 'enquiryNumber',
        header: 'PE Ref',
        render: (_, row) => (
          <span className="font-mono text-slate-700 text-xs">
            {row.enquiryNumberSnapshot || row.purchaseEnquiry?.enquiryNumber || '—'}
          </span>
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
        key: 'expectedDeliveryDate',
        header: 'Expected Delivery',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'totalQuantity',
        header: 'Total Qty',
        align: 'right',
        render: (val, row) => {
          const qty = val !== undefined && val !== null
            ? Number(val)
            : (row.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
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
        key: 'grandTotal',
        header: 'Grand Total',
        align: 'right',
        render: (val, row) => (
          <div className="text-right font-bold text-slate-900">
            {row.currency || '₹'} {(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )
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
              onClick={() => navigate(`/purchase-orders/${row._id}`)}
              title="View Details"
            >
              <Eye size={13} className="mr-1" /> View
            </Button>

            {/* DRAFT Actions */}
            {canEdit && row.status === 'DRAFT' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate(`/purchase-orders/${row._id}/edit`)}
                title="Edit Draft PO"
              >
                <Edit size={13} className="mr-1" /> Edit
              </Button>
            )}

            {canCheck && row.status === 'DRAFT' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setWorkflowTarget(row);
                  setWorkflowAction('CHECK');
                  setWorkflowRemarks('Checked Purchase Order');
                }}
                className="text-blue-600 hover:bg-blue-50"
                title="Check PO"
              >
                <CheckCircle size={13} className="mr-1" /> Check
              </Button>
            )}

            {/* CHECKED Actions */}
            {canRelease && row.status === 'CHECKED' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setWorkflowTarget(row);
                  setWorkflowAction('RELEASE');
                  setWorkflowRemarks('Released Purchase Order to Supplier');
                }}
                className="text-emerald-600 hover:bg-emerald-50"
                title="Release PO"
              >
                <Play size={13} className="mr-1" /> Release
              </Button>
            )}

            {/* RELEASED Actions */}
            {canAmend && row.status === 'RELEASED' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate(`/purchase-orders/${row._id}`)}
                className="text-purple-600 hover:bg-purple-50"
                title="Amend PO"
              >
                <FileEdit size={13} className="mr-1" /> Amend
              </Button>
            )}

            {canClose && row.status === 'RELEASED' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setWorkflowTarget(row);
                  setWorkflowAction('CLOSE');
                  setWorkflowRemarks('Closed Purchase Order');
                }}
                className="text-slate-700 hover:bg-slate-100"
                title="Close PO"
              >
                <Archive size={13} className="mr-1" /> Close
              </Button>
            )}

            {/* Delete / Cancel Action */}
            {canCancel && !['CANCELLED', 'CLOSED'].includes(row.status) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteTarget(row)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                title={row.status === 'DRAFT' ? 'Delete Draft PO' : 'Cancel PO'}
              >
                <Trash2 size={13} className="mr-1" />
                {row.status === 'DRAFT' ? 'Delete' : 'Cancel'}
              </Button>
            )}
          </div>
        )
      }
    ],
    [canEdit, canCheck, canRelease, canClose, canCancel, canAmend, navigate]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage official commercial purchase orders, authorization workflows, and amendments."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/purchase-orders/create')}
              >
                <Plus size={14} className="mr-1.5" />
                Create Purchase Order
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
              placeholder="Search by PO No, Supplier, PR No, PE No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
            />
          </div>

          {/* PO Type Filter */}
          <div className="w-40">
            <Select
              value={poTypeFilter}
              onChange={(e) => {
                setPoTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All PO Types</option>
              {Object.entries(PO_TYPE_LABELS).map(([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CHECKED">Checked</option>
              <option value="RELEASED">Released</option>
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

          {(searchTerm || poTypeFilter !== 'all' || statusFilter !== 'all' || supplierFilter !== 'all' || departmentFilter !== 'all' || startDate || endDate) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyTitle="No Purchase Orders found"
        emptyDescription={
          canCreate
            ? "Click '+ Create Purchase Order' to issue a new commercial purchase order."
            : "No purchase order records match your selected filter criteria."
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
          title={deleteTarget.status === 'DRAFT' ? 'Delete Draft Purchase Order' : 'Cancel Purchase Order'}
          message={`Are you sure you want to ${deleteTarget.status === 'DRAFT' ? 'permanently delete draft' : 'cancel'} Purchase Order "${deleteTarget.poNumber}"? This action cannot be undone.`}
          confirmLabel={deleteTarget.status === 'DRAFT' ? 'Delete Draft' : 'Cancel Order'}
          variant="danger"
          loading={actionLoading === deleteTarget._id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Workflow Quick Action Modal */}
      {workflowTarget && workflowAction && (
        <Modal
          isOpen={!!workflowTarget}
          onClose={() => {
            setWorkflowTarget(null);
            setWorkflowAction(null);
            setWorkflowRemarks('');
          }}
          title={`Confirm Action: ${workflowAction}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Are you sure you want to execute <strong>{workflowAction}</strong> on Purchase Order <code>{workflowTarget.poNumber}</code>?
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Remarks / Notes</label>
              <Textarea
                placeholder="Enter notes or justification..."
                value={workflowRemarks}
                onChange={(e) => setWorkflowRemarks(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setWorkflowTarget(null);
                  setWorkflowAction(null);
                  setWorkflowRemarks('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleWorkflowExecute}
                loading={actionLoading === workflowTarget._id}
              >
                Confirm {workflowAction}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrderList;
