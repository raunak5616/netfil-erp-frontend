import React, { useState, useEffect, useMemo } from 'react';
import { getSalesOrders, updateSalesOrderStatus } from '../../services/salesOrderService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';

import SalesOrderCreateModal from './SalesOrderCreateModal';
import SalesOrderDetailModal from './SalesOrderDetailModal';
import SalesOrderEditModal from './SalesOrderEditModal';

import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Building2,
  Calendar
} from 'lucide-react';

const SalesOrderList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('SALES_ORDER_CREATE');
  const canEdit = hasPermission('SALES_ORDER_EDIT');
  const canConfirm = hasPermission('SALES_ORDER_CONFIRM');

  const [salesOrders, setSalesOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSOId, setSelectedSOId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSO, setEditingSO] = useState(null);

  const fetchSalesOrdersData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (clientFilter !== 'all') params.client = clientFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.orderType = typeFilter;
      if (categoryFilter !== 'all') params.orderCategory = categoryFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const [soRes, clientRes] = await Promise.all([
        getSalesOrders(params),
        getClients().catch(() => ({ success: false, clients: [] }))
      ]);

      if (soRes.success && Array.isArray(soRes.salesOrders)) {
        setSalesOrders(soRes.salesOrders);
        if (soRes.total !== undefined) setTotalRecords(soRes.total);
      } else {
        setError('Unexpected response format from server');
      }

      if (clientRes.success && Array.isArray(clientRes.clients)) {
        setClients(clientRes.clients);
      }
    } catch (err) {
      console.error('Failed to fetch Sales Orders:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrdersData();
  }, [clientFilter, statusFilter, typeFilter, categoryFilter, page, limit]);

  const handleApplySearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchSalesOrdersData();
  };

  const handleQuickStatusChange = async (so, newStatus) => {
    if (so.status === newStatus) return;

    const confirmMsg = `Are you sure you want to change status of Sales Order "${so.salesOrderNo}" to ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(so._id);
    try {
      const res = await updateSalesOrderStatus(so._id, newStatus);
      if (res.success) {
        fetchSalesOrdersData();
      } else {
        setError(res.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.message || 'Error updating Sales Order status');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'salesOrderNo',
        header: 'Sales Order No',
        sortable: true,
        render: (val, row) => (
          <button
            type="button"
            onClick={() => {
              setSelectedSOId(row._id);
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
            title="View Details"
          >
            {val}
          </button>
        )
      },
      {
        key: 'salesOrderDate',
        header: 'Order Date',
        sortable: true,
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '-')
      },
      {
        key: 'client',
        header: 'Party / Customer',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
              {row.client?.companyName || 'N/A'}
            </div>
            {row.client?.clientCode && (
              <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
                {row.client.clientCode}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'quotation',
        header: 'Quotation Ref',
        render: (_, row) => (
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--neutral-700)' }}>
            {row.quotation?.quotationNo || '-'}
          </span>
        )
      },
      {
        key: 'customerPoNumber',
        header: 'Customer PO No',
        render: (val, row) => (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--neutral-800)' }} className="font-mono">
              {val || 'N/A'}
            </div>
            {row.customerPoDate && (
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                {new Date(row.customerPoDate).toLocaleDateString('en-GB')}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'orderType',
        header: 'Type / Category',
        render: (_, row) => (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <span
              className={`badge ${row.orderType === 'export' ? 'badge-warning' : 'badge-secondary'}`}
              style={{ textTransform: 'capitalize', fontSize: '11px' }}
            >
              {row.orderType}
            </span>
            <span
              className="badge badge-primary"
              style={{ textTransform: 'capitalize', fontSize: '11px' }}
            >
              {row.orderCategory}
            </span>
          </div>
        )
      },
      {
        key: 'grandTotal',
        header: 'Amount (₹)',
        sortable: true,
        align: 'right',
        render: (val) => (
          <strong style={{ color: 'var(--neutral-900)' }}>
            ₹{(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        )
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (val, row) => {
          if (!canConfirm || ['completed', 'cancelled'].includes(row.status)) {
            return <StatusBadge status={val} />;
          }

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StatusBadge status={val} />
              <Select
                value={val}
                onChange={(e) => handleQuickStatusChange(row, e.target.value)}
                disabled={actionLoading === row._id}
                style={{
                  fontSize: '11px',
                  padding: '2px 4px',
                  height: '24px',
                  width: 'auto',
                  borderRadius: '4px'
                }}
                title="Quick status transition"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          );
        }
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '180px',
        render: (_, row) => (
          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSelectedSOId(row._id);
                setIsDetailOpen(true);
              }}
              title="View Details"
            >
              <Eye size={14} style={{ marginRight: '3px' }} /> View
            </Button>

            {canEdit && !['cancelled', 'completed'].includes(row.status) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setEditingSO(row);
                  setIsEditOpen(true);
                }}
                title="Edit Sales Order"
              >
                <Edit size={14} style={{ marginRight: '3px' }} /> Edit
              </Button>
            )}

            {canConfirm && row.status === 'draft' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleQuickStatusChange(row, 'confirmed')}
                disabled={actionLoading === row._id}
                title="Confirm Sales Order"
              >
                <CheckCircle2 size={14} style={{ marginRight: '3px' }} color="var(--success-600)" /> Confirm
              </Button>
            )}
          </div>
        )
      }
    ],
    [canEdit, canConfirm, actionLoading]
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Sales Order Management"
        subtitle="Generate, confirm, and track manufacturing sales orders snapshotted from commercial quotations."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSalesOrdersData}
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
                <Plus size={14} style={{ marginRight: '6px' }} /> Create Sales Order
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card">
        {/* Toolbar Controls */}
        <div className="toolbar" style={{ padding: '16px', gap: '12px' }}>
          <form onSubmit={handleApplySearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div className="search-input-wrap" style={{ flex: '1', minWidth: '220px' }}>
              <Search size={16} />
              <Input
                placeholder="Search by SO No, Party, PO No, Remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '180px' }}
            >
              <option value="all">All Parties</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '140px' }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>

            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '130px' }}
            >
              <option value="all">All Types</option>
              <option value="domestic">Domestic</option>
              <option value="export">Export</option>
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '130px' }}
            >
              <option value="all">All Categories</option>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="spare">Spare</option>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '140px' }}
              title="From Date"
            />

            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '140px' }}
              title="To Date"
            />

            <Button type="submit" variant="primary" size="sm">
              <Filter size={14} style={{ marginRight: '4px' }} /> Filter
            </Button>
          </form>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={salesOrders}
          loading={loading}
          emptyTitle="No Sales Orders found"
          emptyDescription="Click '+ Create Sales Order' to convert an accepted quotation into a manufacturing sales order."
        />
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <SalesOrderCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchSalesOrdersData();
          }}
        />
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedSOId && (
        <SalesOrderDetailModal
          isOpen={isDetailOpen}
          salesOrderId={selectedSOId}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedSOId(null);
          }}
          onEdit={(so) => {
            setIsDetailOpen(false);
            setEditingSO(so);
            setIsEditOpen(true);
          }}
          onStatusUpdated={fetchSalesOrdersData}
        />
      )}

      {/* Edit Modal */}
      {isEditOpen && editingSO && (
        <SalesOrderEditModal
          isOpen={isEditOpen}
          salesOrder={editingSO}
          onClose={() => {
            setIsEditOpen(false);
            setEditingSO(null);
          }}
          onSuccess={() => {
            setIsEditOpen(false);
            setEditingSO(null);
            fetchSalesOrdersData();
          }}
        />
      )}
    </div>
  );
};

export default SalesOrderList;
