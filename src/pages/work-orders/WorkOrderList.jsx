import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getWorkOrders } from '../../services/workOrderService';
import { getSalesOrders } from '../../services/salesOrderService';
import { getItems } from '../../services/itemService';
import { getPlants } from '../../services/plantService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';

import WorkOrderCreateModal from './WorkOrderCreateModal';
import WorkOrderEditModal from './WorkOrderEditModal';
import WorkOrderDetailModal from './WorkOrderDetailModal';
import WorkOrderActionModal from './WorkOrderActionModal';

import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit3,
  ArrowRight,
  Play,
  CheckCircle2,
  XCircle,
  Wrench
} from 'lucide-react';

const WorkOrderList = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('WORK_ORDER_CREATE');
  const canEdit = hasPermission('WORK_ORDER_EDIT');
  const canRelease = hasPermission('WORK_ORDER_RELEASE');
  const canStart = hasPermission('WORK_ORDER_START');
  const canComplete = hasPermission('WORK_ORDER_COMPLETE');
  const canCancel = hasPermission('WORK_ORDER_CANCEL');

  const location = useLocation();
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [parentItems, setParentItems] = useState([]);
  const [plants, setPlants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesOrderFilter, setSalesOrderFilter] = useState('all');
  const [parentItemFilter, setParentItemFilter] = useState('all');
  const [plantFilter, setPlantFilter] = useState('all');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [initialOrderBOM, setInitialOrderBOM] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedWorkOrderForEdit, setSelectedWorkOrderForEdit] = useState(null);

  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedWorkOrderForAction, setSelectedWorkOrderForAction] = useState(null);

  // Handle location state navigation from Order BOM page
  useEffect(() => {
    if (location.state?.createFromOrderBOM) {
      setInitialOrderBOM(location.state.createFromOrderBOM);
      setIsCreateOpen(true);
      // Clear location state to prevent modal reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchWorkOrdersData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (salesOrderFilter !== 'all') params.salesOrder = salesOrderFilter;
      if (parentItemFilter !== 'all') params.parentItem = parentItemFilter;
      if (plantFilter !== 'all') params.plant = plantFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [woRes, soRes, itemRes, plantRes] = await Promise.all([
        getWorkOrders(params),
        getSalesOrders({ limit: 100 }).catch(() => ({ success: false, salesOrders: [] })),
        getItems().catch(() => ({ success: false, items: [] })),
        getPlants({ status: 'active' }).catch(() => ({ success: false, plants: [] }))
      ]);

      if (woRes.success && Array.isArray(woRes.workOrders)) {
        setWorkOrders(woRes.workOrders);
        if (woRes.total !== undefined) setTotalRecords(woRes.total);
      } else {
        setError('Unexpected response format from server');
      }

      if (soRes.success && Array.isArray(soRes.salesOrders)) {
        setSalesOrders(soRes.salesOrders);
      }

      if (itemRes.success && Array.isArray(itemRes.items)) {
        setParentItems(itemRes.items);
      }

      if (plantRes.success && Array.isArray(plantRes.plants)) {
        setPlants(plantRes.plants);
      }
    } catch (err) {
      console.error('Failed to fetch Work Orders:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrdersData();
  }, [statusFilter, salesOrderFilter, parentItemFilter, plantFilter, page, limit]);

  // Client-side search filtering fallback
  const filteredWorkOrders = useMemo(() => {
    if (!searchTerm.trim()) return workOrders;
    const term = searchTerm.toLowerCase();
    return workOrders.filter((w) => {
      const woNo = (w.workOrderNo || '').toLowerCase();
      const obomCode = (w.orderBOM?.orderBOMCode || '').toLowerCase();
      const soNo = (w.salesOrder?.salesOrderNo || '').toLowerCase();
      const parentCode = (w.parentItem?.itemCode || '').toLowerCase();
      const parentName = (w.parentItem?.itemName || '').toLowerCase();
      const remarks = (w.remarks || '').toLowerCase();
      return (
        woNo.includes(term) ||
        obomCode.includes(term) ||
        soNo.includes(term) ||
        parentCode.includes(term) ||
        parentName.includes(term) ||
        remarks.includes(term)
      );
    });
  }, [workOrders, searchTerm]);

  const handleOpenActionModal = (wo, type) => {
    setSelectedWorkOrderForAction(wo);
    setActionType(type);
    setIsActionOpen(true);
  };

  // Work Order List Table Columns
  const columns = useMemo(
    () => [
      {
        key: 'workOrderNo',
        header: 'Work Order No.',
        sortable: true,
        render: (val, row) => (
          <button
            type="button"
            onClick={() => {
              setSelectedWorkOrderId(row._id);
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
            title="View Work Order Details & Component Requirements"
          >
            {val}
          </button>
        )
      },
      {
        key: 'orderBOM',
        header: 'Order BOM Source',
        sortable: true,
        render: (_, row) => (
          <span style={{ fontWeight: 600, color: 'var(--neutral-900)' }} className="font-mono">
            {row.orderBOM?.orderBOMCode || 'N/A'}
          </span>
        )
      },
      {
        key: 'salesOrder',
        header: 'Sales Order',
        sortable: true,
        render: (_, row) => (
          <span style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
            {row.salesOrder?.salesOrderNo || 'N/A'}
          </span>
        )
      },
      {
        key: 'parentItem',
        header: 'Parent Finished Product',
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
        key: 'productionQuantity',
        header: 'Planned Qty',
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
        key: 'plant',
        header: 'Factory Plant',
        sortable: true,
        render: (_, row) => (
          <span style={{ fontSize: '12px', color: 'var(--neutral-800)' }}>
            {row.plant?.plantName || row.plant?.plantCode || 'Unassigned'}
          </span>
        )
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (val) => <StatusBadge status={val} />
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
                setSelectedWorkOrderId(row._id);
                setIsDetailOpen(true);
              }}
              title="View Work Order Detail"
            >
              <Eye size={14} style={{ marginRight: '3px' }} /> View
            </Button>

            {/* DRAFT Actions */}
            {canEdit && row.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setSelectedWorkOrderForEdit(row);
                  setIsEditOpen(true);
                }}
                title="Edit Draft Work Order"
              >
                <Edit3 size={13} style={{ marginRight: '3px' }} /> Edit
              </Button>
            )}

            {canRelease && row.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenActionModal(row, 'RELEASE')}
                title="Release Work Order to Production"
              >
                <ArrowRight size={13} style={{ marginRight: '3px' }} /> Release
              </Button>
            )}

            {/* RELEASED Actions */}
            {canStart && row.status === 'RELEASED' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenActionModal(row, 'START')}
                title="Start Production"
              >
                <Play size={13} style={{ marginRight: '3px' }} color="var(--primary-600)" /> Start
              </Button>
            )}

            {/* IN_PROGRESS Actions */}
            {canComplete && row.status === 'IN_PROGRESS' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenActionModal(row, 'COMPLETE')}
                title="Complete Work Order"
              >
                <CheckCircle2 size={13} style={{ marginRight: '3px' }} color="var(--success-600)" /> Complete
              </Button>
            )}

            {/* Cancel Action */}
            {canCancel && ['DRAFT', 'RELEASED'].includes(row.status) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleOpenActionModal(row, 'CANCEL')}
                style={{ color: 'var(--danger-600)' }}
                title="Cancel Work Order"
              >
                <XCircle size={13} style={{ marginRight: '3px' }} /> Cancel
              </Button>
            )}
          </div>
        )
      }
    ],
    [canEdit, canRelease, canStart, canComplete, canCancel]
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Work Order Management (Manufacturing Jobs)"
        subtitle="Manage and track manufacturing execution jobs derived from factory-received Order BOMs."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWorkOrdersData}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setInitialOrderBOM(null);
                  setIsCreateOpen(true);
                }}
              >
                <Plus size={14} style={{ marginRight: '6px' }} /> Create Work Order
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
                placeholder="Search by WO No, Order BOM, Sales Order, Item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchWorkOrdersData();
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '170px' }}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="RELEASED">Released</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select
              value={salesOrderFilter}
              onChange={(e) => {
                setSalesOrderFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '200px' }}
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
              style={{ width: '200px' }}
            >
              <option value="all">All Parent Finished Items</option>
              {parentItems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.itemCode} — {p.itemName}
                </option>
              ))}
            </Select>

            <Select
              value={plantFilter}
              onChange={(e) => {
                setPlantFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '180px' }}
            >
              <option value="all">All Plants</option>
              {plants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.plantCode} — {p.plantName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredWorkOrders}
          loading={loading}
          emptyTitle="No Work Orders found"
          emptyDescription="Click '+ Create Work Order' to generate a manufacturing job from a factory-received Order BOM."
        />
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <WorkOrderCreateModal
          isOpen={isCreateOpen}
          initialOrderBOM={initialOrderBOM}
          onClose={() => {
            setIsCreateOpen(false);
            setInitialOrderBOM(null);
          }}
          onSuccess={() => {
            setIsCreateOpen(false);
            setInitialOrderBOM(null);
            fetchWorkOrdersData();
          }}
        />
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedWorkOrderId && (
        <WorkOrderDetailModal
          isOpen={isDetailOpen}
          workOrderId={selectedWorkOrderId}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedWorkOrderId(null);
          }}
          onWorkOrderUpdated={fetchWorkOrdersData}
        />
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedWorkOrderForEdit && (
        <WorkOrderEditModal
          isOpen={isEditOpen}
          workOrder={selectedWorkOrderForEdit}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedWorkOrderForEdit(null);
          }}
          onSuccess={() => {
            setIsEditOpen(false);
            setSelectedWorkOrderForEdit(null);
            fetchWorkOrdersData();
          }}
        />
      )}

      {/* Action Modal */}
      {isActionOpen && selectedWorkOrderForAction && actionType && (
        <WorkOrderActionModal
          isOpen={isActionOpen}
          actionType={actionType}
          workOrder={selectedWorkOrderForAction}
          onClose={() => {
            setIsActionOpen(false);
            setSelectedWorkOrderForAction(null);
            setActionType(null);
          }}
          onSuccess={() => {
            setIsActionOpen(false);
            setSelectedWorkOrderForAction(null);
            setActionType(null);
            fetchWorkOrdersData();
          }}
        />
      )}
    </div>
  );
};

export default WorkOrderList;
