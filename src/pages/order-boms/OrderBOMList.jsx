import React, { useState, useEffect, useMemo } from 'react';
import { getOrderBOMs } from '../../services/orderBomService';
import { getSalesOrders } from '../../services/salesOrderService';
import { getItems } from '../../services/itemService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';

import OrderBOMCreateModal from './OrderBOMCreateModal';
import OrderBOMDetailModal from './OrderBOMDetailModal';
import OrderBOMRouteModal from './OrderBOMRouteModal';

import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  ClipboardList
} from 'lucide-react';

const OrderBOMList = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('ORDER_BOM_CREATE');
  const canEdit = hasPermission('ORDER_BOM_EDIT');
  const canRouteStore = hasPermission('ORDER_BOM_ROUTE_STORE');
  const canRouteFactory = hasPermission('ORDER_BOM_ROUTE_FACTORY');

  const [orderBOMs, setOrderBOMs] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [parentItems, setParentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesOrderFilter, setSalesOrderFilter] = useState('all');
  const [parentItemFilter, setParentItemFilter] = useState('all');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderBOMId, setSelectedOrderBOMId] = useState(null);

  // Routing Action Modal State
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [routeActionType, setRouteActionType] = useState(null);
  const [selectedOrderBOM, setSelectedOrderBOM] = useState(null);

  const fetchOrderBOMsData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (salesOrderFilter !== 'all') params.salesOrder = salesOrderFilter;
      if (parentItemFilter !== 'all') params.parentItem = parentItemFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [obomRes, soRes, itemRes] = await Promise.all([
        getOrderBOMs(params),
        getSalesOrders({ limit: 100 }).catch(() => ({ success: false, salesOrders: [] })),
        getItems().catch(() => ({ success: false, items: [] }))
      ]);

      if (obomRes.success && Array.isArray(obomRes.orderBOMs)) {
        setOrderBOMs(obomRes.orderBOMs);
        if (obomRes.total !== undefined) setTotalRecords(obomRes.total);
      } else {
        setError('Unexpected response format from server');
      }

      if (soRes.success && Array.isArray(soRes.salesOrders)) {
        setSalesOrders(soRes.salesOrders);
      }

      if (itemRes.success && Array.isArray(itemRes.items)) {
        setParentItems(itemRes.items);
      }
    } catch (err) {
      console.error('Failed to fetch Order BOMs:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBOMsData();
  }, [statusFilter, salesOrderFilter, parentItemFilter, page, limit]);

  // Client-side search fallback/filtering
  const filteredOrderBOMs = useMemo(() => {
    if (!searchTerm.trim()) return orderBOMs;
    const term = searchTerm.toLowerCase();
    return orderBOMs.filter((b) => {
      const code = (b.orderBOMCode || '').toLowerCase();
      const soNo = (b.salesOrder?.salesOrderNo || '').toLowerCase();
      const party = (b.salesOrder?.client?.companyName || b.salesOrder?.client?.clientCode || '').toLowerCase();
      const parentCode = (b.parentItem?.itemCode || '').toLowerCase();
      const parentName = (b.parentItem?.itemName || '').toLowerCase();
      const remarks = (b.remarks || '').toLowerCase();
      return (
        code.includes(term) ||
        soNo.includes(term) ||
        party.includes(term) ||
        parentCode.includes(term) ||
        parentName.includes(term) ||
        remarks.includes(term)
      );
    });
  }, [orderBOMs, searchTerm]);

  const handleOpenRouteModal = (obom, actionType) => {
    setSelectedOrderBOM(obom);
    setRouteActionType(actionType);
    setIsRouteOpen(true);
  };

  // Recommended list columns: Order BOM Code, Sales Order, Parent Item, Order Quantity, UOM, Master BOM Version, Status, Store, Plant, Created Date, Actions
  const columns = useMemo(
    () => [
      {
        key: 'orderBOMCode',
        header: 'Order BOM Code',
        sortable: true,
        render: (val, row) => (
          <button
            type="button"
            onClick={() => {
              setSelectedOrderBOMId(row._id);
              setIsDetailOpen(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontWeight: 700,
              color: 'var(--primary-700)',
              textAlign: 'left'
            }}
            className="font-mono hover:underline"
            title="View Order BOM Details & Component Snapshot"
          >
            {val}
          </button>
        )
      },
      {
        key: 'salesOrder',
        header: 'Sales Order',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
              {row.salesOrder?.salesOrderNo || 'N/A'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
              {row.salesOrder?.client?.companyName || row.salesOrder?.client?.clientCode || '-'}
            </div>
          </div>
        )
      },
      {
        key: 'parentItem',
        header: 'Parent Item',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
              {row.parentItem?.itemName || 'N/A'}
            </div>
            {row.parentItem?.itemCode && (
              <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
                {row.parentItem.itemCode}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'orderQuantity',
        header: 'Order Quantity',
        sortable: true,
        render: (val) => (
          <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
            {val}
          </span>
        )
      },
      {
        key: 'uom',
        header: 'UOM',
        sortable: true,
        render: (_, row) => row.uom?.uomCode || row.uom?.uomName || '-'
      },
      {
        key: 'masterBOMVersion',
        header: 'Master BOM Version',
        sortable: true,
        render: (val, row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--neutral-800)', fontSize: '12px' }}>
              {row.masterBOM?.bomCode || 'Master BOM'}
            </div>
            <span className="badge badge-primary" style={{ fontSize: '11px', padding: '1px 5px' }}>
              v{val || 1}
            </span>
          </div>
        )
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (val) => <StatusBadge status={val} />
      },
      {
        key: 'store',
        header: 'Store',
        sortable: true,
        render: (_, row) => (
          <span style={{ fontSize: '12px', color: 'var(--neutral-700)' }}>
            {row.store?.storeName || row.store?.storeCode || 'Unassigned'}
          </span>
        )
      },
      {
        key: 'plant',
        header: 'Plant',
        sortable: true,
        render: (_, row) => (
          <span style={{ fontSize: '12px', color: 'var(--neutral-700)' }}>
            {row.plant?.plantName || row.plant?.plantCode || 'Unassigned'}
          </span>
        )
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        sortable: true,
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '-')
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '240px',
        render: (_, row) => (
          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSelectedOrderBOMId(row._id);
                setIsDetailOpen(true);
              }}
              title="View Component Snapshot & Details"
            >
              <Eye size={14} style={{ marginRight: '3px' }} /> View
            </Button>

            {/* Store Routing */}
            {canRouteStore && row.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenRouteModal(row, 'SEND_TO_STORE')}
                title="Send Order BOM to Store"
              >
                <Send size={13} style={{ marginRight: '3px' }} /> Send Store
              </Button>
            )}

            {canRouteStore && row.status === 'SENT_TO_STORE' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenRouteModal(row, 'RECEIVE_BY_STORE')}
                title="Acknowledge Receipt in Store"
              >
                <CheckCircle2 size={13} style={{ marginRight: '3px' }} color="var(--success-600)" /> Recv Store
              </Button>
            )}

            {/* Factory Routing */}
            {canRouteFactory && row.status === 'RECEIVED_BY_STORE' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenRouteModal(row, 'SEND_TO_FACTORY')}
                title="Send Order BOM to Factory"
              >
                <Send size={13} style={{ marginRight: '3px' }} /> Send Factory
              </Button>
            )}

            {canRouteFactory && row.status === 'SENT_TO_FACTORY' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenRouteModal(row, 'RECEIVE_BY_FACTORY')}
                title="Acknowledge Receipt in Factory"
              >
                <CheckCircle2 size={13} style={{ marginRight: '3px' }} color="var(--success-600)" /> Recv Factory
              </Button>
            )}

            {/* Cancel Action */}
            {canEdit && ['DRAFT', 'SENT_TO_STORE', 'RECEIVED_BY_STORE'].includes(row.status) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleOpenRouteModal(row, 'CANCEL')}
                style={{ color: 'var(--danger-600)' }}
                title="Cancel Order BOM"
              >
                <XCircle size={13} style={{ marginRight: '3px' }} /> Cancel
              </Button>
            )}
          </div>
        )
      }
    ],
    [canEdit, canRouteStore, canRouteFactory]
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Order-Specific Bill of Materials (Order BOM)"
        subtitle="Generate, route, and audit order-specific component snapshots derived from released Master BOMs for active Sales Orders."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrderBOMsData}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={14} style={{ marginRight: '6px' }} /> Create Order BOM
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card">
        {/* Toolbar & Filter Controls */}
        <div className="toolbar" style={{ padding: '16px', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div className="search-input-wrap" style={{ flex: '1', minWidth: '220px' }}>
              <Search size={16} />
              <Input
                placeholder="Search by OBOM Code, Sales Order, Party, Parent Item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchOrderBOMsData();
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '180px' }}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT_TO_STORE">Sent to Store</option>
              <option value="RECEIVED_BY_STORE">Received by Store</option>
              <option value="SENT_TO_FACTORY">Sent to Factory</option>
              <option value="RECEIVED_BY_FACTORY">Received by Factory</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select
              value={salesOrderFilter}
              onChange={(e) => {
                setSalesOrderFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '220px' }}
            >
              <option value="all">All Sales Orders</option>
              {salesOrders.map((so) => (
                <option key={so._id} value={so._id}>
                  {so.salesOrderNo} ({so.client?.companyName || 'Party'})
                </option>
              ))}
            </Select>

            <Select
              value={parentItemFilter}
              onChange={(e) => {
                setParentItemFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '220px' }}
            >
              <option value="all">All Parent Finished Items</option>
              {parentItems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.itemCode} — {p.itemName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredOrderBOMs}
          loading={loading}
          emptyTitle="No Order BOMs found"
          emptyDescription="Click '+ Create Order BOM' to generate an order-specific component snapshot for a confirmed Sales Order item."
        />
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <OrderBOMCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchOrderBOMsData();
          }}
        />
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedOrderBOMId && (
        <OrderBOMDetailModal
          isOpen={isDetailOpen}
          orderBOMId={selectedOrderBOMId}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedOrderBOMId(null);
          }}
          onOrderBOMUpdated={fetchOrderBOMsData}
        />
      )}

      {/* Routing Modal */}
      {isRouteOpen && selectedOrderBOM && (
        <OrderBOMRouteModal
          isOpen={isRouteOpen}
          actionType={routeActionType}
          orderBOM={selectedOrderBOM}
          onClose={() => {
            setIsRouteOpen(false);
            setSelectedOrderBOM(null);
            setRouteActionType(null);
          }}
          onSuccess={() => {
            setIsRouteOpen(false);
            setSelectedOrderBOM(null);
            setRouteActionType(null);
            fetchOrderBOMsData();
          }}
        />
      )}
    </div>
  );
};

export default OrderBOMList;
