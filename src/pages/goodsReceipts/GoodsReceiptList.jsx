import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGoodsReceipts,
  deleteGoodsReceipt,
  updateGoodsReceiptStatus
} from '../../services/goodsReceiptService';
import { getPlants } from '../../services/plantService';
import { getStores } from '../../services/storeService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { Select, Textarea } from '../../components/ui/FormField';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Ban,
  CheckCircle,
  Truck,
  Package
} from 'lucide-react';

const STATUS_DISPLAY_MAP = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled'
};

const GoodsReceiptList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('GOODS_RECEIPT_CREATE');
  const canEdit = hasPermission('GOODS_RECEIPT_EDIT');
  const canPost = hasPermission('GOODS_RECEIPT_POST');
  const canCancel = hasPermission('GOODS_RECEIPT_CANCEL');

  const [receipts, setReceipts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [stores, setStores] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [plantFilter, setPlantFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Workflow Quick Action Modal State (POST or CANCEL)
  const [workflowTarget, setWorkflowTarget] = useState(null);
  const [workflowAction, setWorkflowAction] = useState(null); // 'POST' or 'CANCEL'
  const [workflowRemarks, setWorkflowRemarks] = useState('');

  const fetchReceipts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (supplierFilter !== 'all') params.supplier = supplierFilter;
      if (plantFilter !== 'all') params.plant = plantFilter;
      if (storeFilter !== 'all') params.store = storeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getGoodsReceipts(params);

      if (res.success && Array.isArray(res.goodsReceipts)) {
        setReceipts(res.goodsReceipts);
        if (res.pagination) {
          setTotalCount(res.pagination.totalCount || 0);
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setError('Unexpected response structure from server');
      }
    } catch (err) {
      console.error('Failed to fetch Goods Receipts:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [plantRes, storeRes, supplierRes] = await Promise.all([
        getPlants().catch(() => ({ success: false, plants: [] })),
        getStores().catch(() => ({ success: false, stores: [] })),
        getClients({ partyType: 'SUPPLIER', status: 'active' }).catch(() => ({ success: false, clients: [], parties: [] }))
      ]);

      if (plantRes.success && Array.isArray(plantRes.plants)) {
        setPlants(plantRes.plants.filter((p) => p.status === 'active'));
      } else if (Array.isArray(plantRes)) {
        setPlants(plantRes.filter((p) => p.status === 'active'));
      }

      if (storeRes.success && Array.isArray(storeRes.stores)) {
        setStores(storeRes.stores.filter((s) => s.status === 'active'));
      } else if (Array.isArray(storeRes)) {
        setStores(storeRes.filter((s) => s.status === 'active'));
      }

      const rawSuppliers = supplierRes.clients || supplierRes.parties || [];
      if (Array.isArray(rawSuppliers)) {
        setSuppliers(rawSuppliers.filter((s) => s.status === 'active' && ['SUPPLIER', 'BOTH'].includes(s.partyType)));
      }
    } catch (err) {
      console.error('Failed to fetch GRN master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReceipts();
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, supplierFilter, plantFilter, storeFilter, startDate, endDate, page, limit]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchReceipts();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSupplierFilter('all');
    setPlantFilter('all');
    setStoreFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setActionLoading(deleteTarget._id);
    setError('');
    try {
      const res = await deleteGoodsReceipt(deleteTarget._id);
      if (res.success) {
        setSuccessMessage(res.message || 'Goods Receipt action completed');
        fetchReceipts();
      } else {
        setError(res.message || 'Failed to delete/cancel Goods Receipt');
      }
    } catch (err) {
      console.error('Delete/Cancel GRN error:', err);
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
      const res = await updateGoodsReceiptStatus(workflowTarget._id, workflowAction, workflowRemarks);
      if (res.success) {
        setSuccessMessage(res.message || `Goods Receipt status updated to ${res.goodsReceipt?.status || 'new status'}`);
        fetchReceipts();
        setWorkflowTarget(null);
        setWorkflowAction(null);
        setWorkflowRemarks('');
      } else {
        setError(res.message || 'Workflow action failed');
      }
    } catch (err) {
      console.error('GRN Workflow error:', err);
      setError(err.response?.data?.message || 'Failed to execute workflow action');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'grnNumber',
        header: 'GRN Number',
        render: (val, row) => (
          <button
            type="button"
            onClick={() => navigate(`/goods-receipts/${row._id}`)}
            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
            title="View GRN Details"
          >
            {val}
          </button>
        )
      },
      {
        key: 'grnDate',
        header: 'GRN Date',
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '—')
      },
      {
        key: 'poNumber',
        header: 'PO Number',
        render: (_, row) => (
          <button
            type="button"
            onClick={() => {
              const poId = typeof row.purchaseOrder === 'object' ? row.purchaseOrder?._id : row.purchaseOrder;
              if (poId) navigate(`/purchase-orders/${poId}`);
            }}
            className="font-mono font-medium text-slate-800 hover:text-blue-600 hover:underline cursor-pointer"
          >
            {row.poNumberSnapshot || row.purchaseOrder?.poNumber || '—'}
          </button>
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
            {row.supplier?.partyCode && (
              <div className="text-[11px] text-slate-500 font-mono">{row.supplier.partyCode}</div>
            )}
          </div>
        )
      },
      {
        key: 'supplierChallanNo',
        header: 'Supplier Challan No.',
        render: (val, row) => (
          <div>
            <span className="font-mono font-medium text-slate-800 text-xs">{val || '—'}</span>
            {row.supplierChallanDate && (
              <span className="text-[10.5px] text-slate-400 block">
                {new Date(row.supplierChallanDate).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
        )
      },
      {
        key: 'plant',
        header: 'Plant',
        render: (_, row) => (
          <span className="font-medium text-slate-700">
            {row.plant?.plantName || row.plant?.plantCode || '—'}
          </span>
        )
      },
      {
        key: 'store',
        header: 'Store',
        render: (_, row) => (
          <span className="font-medium text-slate-700">
            {row.store?.storeName || row.store?.storeCode || '—'}
          </span>
        )
      },
      {
        key: 'totalReceivedQuantity',
        header: 'Total Received Qty',
        align: 'right',
        render: (val, row) => {
          const qty = val !== undefined && val !== null
            ? Number(val)
            : (row.items || []).reduce((sum, i) => sum + (Number(i.receivedQuantity) || 0), 0);
          const itemCount = row.items?.length || 0;
          return (
            <div className="text-right">
              <span className="font-semibold text-slate-900">{qty.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-slate-500 block">({itemCount} {itemCount === 1 ? 'line' : 'lines'})</span>
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
              onClick={() => navigate(`/goods-receipts/${row._id}`)}
              title="View Details"
            >
              <Eye size={13} className="mr-1" /> View
            </Button>

            {/* DRAFT Actions */}
            {canEdit && row.status === 'DRAFT' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate(`/goods-receipts/${row._id}/edit`)}
                title="Edit Draft GRN"
              >
                <Edit size={13} className="mr-1" /> Edit
              </Button>
            )}

            {canPost && row.status === 'DRAFT' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setWorkflowTarget(row);
                  setWorkflowAction('POST');
                  setWorkflowRemarks('Posting GRN to warehouse stock');
                }}
                className="text-emerald-600 hover:bg-emerald-50"
                title="Post GRN to Stock"
              >
                <CheckCircle size={13} className="mr-1" /> Post
              </Button>
            )}

            {/* Delete DRAFT or Cancel POSTED */}
            {canCancel && (
              row.status === 'DRAFT' ? (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setDeleteTarget(row)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  title="Delete Draft GRN"
                >
                  <Trash2 size={13} className="mr-1" /> Delete
                </Button>
              ) : row.status === 'POSTED' ? (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setWorkflowTarget(row);
                    setWorkflowAction('CANCEL');
                    setWorkflowRemarks('Cancelling posted goods receipt');
                  }}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  title="Cancel Posted GRN"
                >
                  <Ban size={13} className="mr-1" /> Cancel
                </Button>
              ) : null
            )}
          </div>
        )
      }
    ],
    [canEdit, canPost, canCancel, navigate]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Receipts (GRN)"
        subtitle="Manage inward material receipts, warehouse storage assignments, and inventory stock posting."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReceipts}
              disabled={loading}
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/goods-receipts/create')}
              >
                <Plus size={14} className="mr-1.5" />
                Create Goods Receipt
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
              placeholder="Search GRN No, PO No, Supplier, Challan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
            />
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
              <option value="POSTED">Posted</option>
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

          {/* Plant Filter */}
          <div className="w-40">
            <Select
              value={plantFilter}
              onChange={(e) => {
                setPlantFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Plants</option>
              {plants.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.plantName}
                </option>
              ))}
            </Select>
          </div>

          {/* Store Filter */}
          <div className="w-40">
            <Select
              value={storeFilter}
              onChange={(e) => {
                setStoreFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Stores</option>
              {stores.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.storeName}
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
              title="From GRN Date"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-600 text-slate-800 bg-white"
              title="To GRN Date"
            />
          </div>

          {/* Buttons */}
          <Button type="submit" variant="primary" size="sm">
            <Filter size={13} className="mr-1" /> Search
          </Button>

          {(searchTerm || statusFilter !== 'all' || supplierFilter !== 'all' || plantFilter !== 'all' || storeFilter !== 'all' || startDate || endDate) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={receipts}
        loading={loading}
        emptyTitle="No Goods Receipts found"
        emptyDescription={
          canCreate
            ? "Click '+ Create Goods Receipt' to record inward material against a Released PO."
            : "No Goods Receipt records match your selected filter criteria."
        }
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          totalRecords: totalCount,
          onPageChange: (newPage) => setPage(newPage)
        }}
      />

      {/* Confirmation Modal for Delete Draft */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete Draft Goods Receipt"
          message={`Are you sure you want to permanently delete draft Goods Receipt "${deleteTarget.grnNumber}"? This action cannot be undone.`}
          confirmLabel="Delete Draft GRN"
          variant="danger"
          loading={actionLoading === deleteTarget._id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Workflow Confirmation Modal for POST / CANCEL */}
      {workflowTarget && workflowAction && (
        <Modal
          isOpen={!!workflowTarget}
          onClose={() => {
            setWorkflowTarget(null);
            setWorkflowAction(null);
            setWorkflowRemarks('');
          }}
          title={workflowAction === 'POST' ? 'Confirm POST Goods Receipt' : 'Confirm Cancel Goods Receipt'}
        >
          <div className="space-y-4">
            {workflowAction === 'POST' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle size={15} /> Posting GRN Inventory Action
                </p>
                <p>Posting this GRN will automatically:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-emerald-800">
                  <li>Increase <strong>InventoryStock</strong> quantities at assigned storage bins.</li>
                  <li>Record audit <strong>StockTransaction</strong> entries for each line item.</li>
                  <li>Update Purchase Order fulfillment status (and auto-close PO if fully fulfilled).</li>
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Are you sure you want to <strong>CANCEL</strong> Goods Receipt <code>{workflowTarget.grnNumber}</code>?
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Remarks / Justification {workflowAction === 'CANCEL' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder="Enter remarks or reason for this action..."
                value={workflowRemarks}
                onChange={(e) => setWorkflowRemarks(e.target.value)}
                rows={3}
                required={workflowAction === 'CANCEL'}
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
                variant={workflowAction === 'CANCEL' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleWorkflowExecute}
                loading={actionLoading === workflowTarget._id}
              >
                Confirm {workflowAction === 'POST' ? 'Post GRN to Stock' : 'Cancel GRN'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GoodsReceiptList;
