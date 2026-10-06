import React, { useState, useEffect, useMemo } from 'react';
import { getSalesOrders, updateSalesOrderStatus } from '../../services/salesOrderService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import ActionDropdown from '../../components/ui/ActionDropdown';
import { Input, Select, AsyncSelect } from '../../components/ui/FormField';

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
  CheckCircle2,
  Clock,
  Ban,
  RotateCcw
} from 'lucide-react';

const SalesOrderList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('SALES_ORDER_CREATE');
  const canEdit = hasPermission('SALES_ORDER_EDIT');
  const canConfirm = hasPermission('SALES_ORDER_CONFIRM');

  const [salesOrders, setSalesOrders] = useState([]);
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
  const [limit] = useState(25);
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

      const soRes = await getSalesOrders(params);

      if (soRes.success && Array.isArray(soRes.salesOrders)) {
        setSalesOrders(soRes.salesOrders);
        if (soRes.total !== undefined) setTotalRecords(soRes.total);
      } else {
        setError('Unexpected response format from server');
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
  }, [clientFilter, statusFilter, typeFilter, categoryFilter, page]);

  const loadClientOptions = async (inputValue) => {
    try {
      const res = await getClients({ search: inputValue, limit: 15, status: 'active' });
      if (res.success && Array.isArray(res.clients)) {
        return res.clients.map((c) => ({
          value: c._id,
          label: c.companyName,
          secondaryLabel: c.clientCode,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleApplySearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchSalesOrdersData();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setClientFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    clientFilter !== 'all' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const handleQuickStatusChange = async (so, newStatus) => {
    if (so.status === newStatus) return;

    const confirmMsg = `Are you sure you want to change status of Sales Order "${so.salesOrderNo}" to ${newStatus.toUpperCase().replace('_', ' ')}?`;
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
            className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline text-left whitespace-nowrap"
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
        render: (val) => (
          <span className="text-slate-700 whitespace-nowrap">
            {val ? new Date(val).toLocaleDateString('en-GB') : '-'}
          </span>
        )
      },
      {
        key: 'client',
        header: 'Party / Customer',
        sortable: true,
        render: (_, row) => (
          <div className="max-w-[240px]">
            <div className="font-semibold text-slate-900 leading-tight truncate" title={row.client?.companyName}>
              {row.client?.companyName || 'N/A'}
            </div>
            {row.client?.clientCode && (
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
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
          <span className="font-mono text-[11.5px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block whitespace-nowrap">
            {row.quotation?.quotationNo || '-'}
          </span>
        )
      },
      {
        key: 'customerPoNumber',
        header: 'Customer PO No',
        render: (val, row) => (
          <div className="whitespace-nowrap">
            <div className="font-mono font-medium text-slate-800">
              {val || 'N/A'}
            </div>
            {row.customerPoDate && (
              <div className="text-[11px] text-slate-500 mt-0.5">
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
          <div className="flex items-center gap-1.5 flex-wrap whitespace-nowrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize border ${
                row.orderType === 'export'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {row.orderType}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize bg-blue-50 text-blue-700 border border-blue-200"
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
          <strong className="text-slate-900 font-bold whitespace-nowrap">
            ₹{(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        )
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (val) => <StatusBadge status={val} />
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '130px',
        render: (_, row) => {
          const actionItems = [
            {
              label: 'View Details',
              icon: Eye,
              onClick: () => {
                setSelectedSOId(row._id);
                setIsDetailOpen(true);
              }
            },
            {
              label: 'Edit Order',
              icon: Edit,
              show: canEdit && !['cancelled', 'completed'].includes(row.status),
              onClick: () => {
                setEditingSO(row);
                setIsEditOpen(true);
              }
            },
            {
              label: 'Confirm Order',
              icon: CheckCircle2,
              color: 'var(--success-600)',
              show: canConfirm && row.status === 'draft',
              onClick: () => handleQuickStatusChange(row, 'confirmed')
            },
            {
              label: 'Mark In Progress',
              icon: Clock,
              color: 'var(--info-600)',
              show: canConfirm && row.status === 'confirmed',
              onClick: () => handleQuickStatusChange(row, 'in_progress')
            },
            {
              label: 'Mark Completed',
              icon: CheckCircle2,
              color: 'var(--success-600)',
              show: canConfirm && ['confirmed', 'in_progress'].includes(row.status),
              onClick: () => handleQuickStatusChange(row, 'completed')
            },
            {
              label: 'Cancel Order',
              icon: Ban,
              danger: true,
              divider: true,
              show: canConfirm && ['draft', 'confirmed', 'in_progress'].includes(row.status),
              onClick: () => handleQuickStatusChange(row, 'cancelled')
            }
          ];

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSelectedSOId(row._id);
                  setIsDetailOpen(true);
                }}
                title="View Details"
              >
                <Eye size={13} className="mr-1" /> View
              </Button>
              <ActionDropdown items={actionItems} />
            </div>
          );
        }
      }
    ],
    [canEdit, canConfirm, actionLoading]
  );

  return (
    <div className="w-full space-y-4">
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
              <RefreshCw size={14} className={loading ? 'spin mr-1.5' : 'mr-1.5'} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={14} className="mr-1.5" /> Create Sales Order
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Filter Controls Toolbar */}
        <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 mb-4">
          <form onSubmit={handleApplySearch} className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[230px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                className="pl-9 text-xs h-[36px]"
                placeholder="Search by SO No, Party, PO No, Remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Client / Party AsyncSelect */}
            <div className="min-w-[200px] flex-1 max-w-[260px]">
              <AsyncSelect
                value={clientFilter}
                onChange={(e) => {
                  setClientFilter(e.target.value || 'all');
                  setPage(1);
                }}
                loadOptions={loadClientOptions}
                placeholder="All Parties"
                initialLabel={clientFilter === 'all' ? 'All Parties' : undefined}
              />
            </div>

            {/* Status Dropdown */}
            <div className="w-[150px]">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            {/* Type Dropdown */}
            <div className="w-[130px]">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Types</option>
                <option value="domestic">Domestic</option>
                <option value="export">Export</option>
              </Select>
            </div>

            {/* Category Dropdown (Expanded width to prevent truncation) */}
            <div className="w-[150px]">
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Categories</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="spare">Spare</option>
              </Select>
            </div>

            {/* Date Pickers */}
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-[135px] h-[36px] text-xs"
                title="From Date"
              />
              <span className="text-slate-400 text-xs font-semibold">-</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-[135px] h-[36px] text-xs"
                title="To Date"
              />
            </div>

            {/* Action & Filter Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  title="Reset Filters"
                  className="text-slate-600 hover:text-slate-900"
                >
                  <RotateCcw size={14} className="mr-1" /> Reset
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" className="h-[36px] px-4">
                <Filter size={14} className="mr-1.5" /> Filter
              </Button>
            </div>
          </form>
        </div>

        {/* Data Table with Pagination */}
        <DataTable
          columns={columns}
          data={salesOrders}
          loading={loading}
          emptyTitle="No Sales Orders found"
          emptyDescription="Click '+ Create Sales Order' to convert an accepted quotation into a manufacturing sales order."
          pagination={{
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit) || 1,
            totalRecords,
            onPageChange: (newPage) => setPage(newPage)
          }}
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

