import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetGoodsReceiptsQuery,
  useDeleteGoodsReceiptMutation,
  useUpdateGoodsReceiptStatusMutation,
} from '../../features/purchase/purchaseApi';
import { useGetPlantsQuery, useGetStoresQuery } from '../../features/stores/storesApi';
import { useGetClientsQuery } from '../../features/masterData/masterDataApi';
import { useGetSuppliersQuery } from '../../features/suppliers/suppliersApi';
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

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [plantFilter, setPlantFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = useMemo(() => {
    const params = { page, limit };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== 'all') params.status = statusFilter;
    if (supplierFilter !== 'all') params.supplier = supplierFilter;
    if (plantFilter !== 'all') params.plant = plantFilter;
    if (storeFilter !== 'all') params.store = storeFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [page, limit, debouncedSearch, statusFilter, supplierFilter, plantFilter, storeFilter, startDate, endDate]);

  const {
    data: grData,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useGetGoodsReceiptsQuery(queryParams);

  const { data: plantsData } = useGetPlantsQuery();
  const { data: storesData } = useGetStoresQuery();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 200, status: 'active', approvalStatus: 'APPROVED' });
  const { data: clientData } = useGetClientsQuery({ partyType: 'SUPPLIER', status: 'active', limit: 200 });

  const [deleteGoodsReceiptMutation] = useDeleteGoodsReceiptMutation();
  const [updateGoodsReceiptStatusMutation] = useUpdateGoodsReceiptStatusMutation();

  const receipts = useMemo(() => {
    return grData?.goodsReceipts || [];
  }, [grData]);

  const totalCount = grData?.pagination?.totalCount || 0;
  const totalPages = grData?.pagination?.totalPages || 1;

  const plants = useMemo(() => {
    const raw = plantsData?.plants || [];
    return Array.isArray(raw) ? raw.filter((p) => p.status === 'active') : [];
  }, [plantsData]);

  const stores = useMemo(() => {
    const raw = storesData?.stores || [];
    return Array.isArray(raw) ? raw.filter((s) => s.status === 'active') : [];
  }, [storesData]);

  const suppliers = useMemo(() => {
    const list = [];
    const seen = new Set();

    const fromSuppliers = suppliersData?.data?.suppliers || suppliersData?.suppliers || [];
    if (Array.isArray(fromSuppliers)) {
      for (const s of fromSuppliers) {
        if (s._id && !seen.has(String(s._id))) {
          seen.add(String(s._id));
          list.push({
            _id: s._id,
            name: s.supplierName,
            code: s.supplierCode,
            status: s.status
          });
        }
      }
    }

    const fromParties = clientData?.clients || clientData?.parties || [];
    if (Array.isArray(fromParties)) {
      for (const p of fromParties) {
        if (p._id && !seen.has(String(p._id))) {
          seen.add(String(p._id));
          list.push({
            _id: p._id,
            name: p.companyName,
            code: p.partyCode,
            status: p.status
          });
        }
      }
    }

    return list;
  }, [suppliersData, clientData]);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Workflow Quick Action Modal State (POST or CANCEL)
  const [workflowTarget, setWorkflowTarget] = useState(null);
  const [workflowAction, setWorkflowAction] = useState(null); // 'POST' or 'CANCEL'
  const [workflowRemarks, setWorkflowRemarks] = useState('');

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setDebouncedSearch(searchTerm);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
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
      const res = await deleteGoodsReceiptMutation(deleteTarget._id).unwrap();
      setSuccessMessage(res?.message || 'Goods Receipt action completed');
    } catch (err) {
      console.error('Delete/Cancel GRN error:', err);
      setError(err?.data?.message || err.message || 'Failed to perform action');
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
      const res = await updateGoodsReceiptStatusMutation({
        id: workflowTarget._id,
        action: workflowAction,
        remarks: workflowRemarks,
      }).unwrap();
      setSuccessMessage(res?.message || `Goods Receipt status updated to ${res?.goodsReceipt?.status || 'new status'}`);
      setWorkflowTarget(null);
      setWorkflowAction(null);
      setWorkflowRemarks('');
    } catch (err) {
      console.error('GRN Workflow error:', err);
      setError(err?.data?.message || err.message || 'Failed to execute workflow action');
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
              {row.supplierNameSnapshot || row.supplier?.supplierName || row.supplier?.companyName || '—'}
            </div>
            {(row.supplierCodeSnapshot || row.supplier?.supplierCode || row.supplier?.partyCode) && (
              <div className="text-[11px] text-slate-500 font-mono">
                {row.supplierCodeSnapshot || row.supplier?.supplierCode || row.supplier?.partyCode}
              </div>
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
              onClick={() => refetch()}
              disabled={loading || isFetching}
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading || isFetching ? 'animate-spin' : ''}`} />
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
                  {sup.name} {sup.code ? `(${sup.code})` : ''}
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
