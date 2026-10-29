import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getSalesOrders, 
  updateSalesOrderStatus,
  getSalesOrderDeliveryAlertsSummary,
  dismissSalesOrderDeliveryAlert
} from '../../services/salesOrderService';
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
import SalesOrderDrawingWorkspaceModal from './SalesOrderDrawingWorkspaceModal';

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
  RotateCcw,
  Paperclip,
  Printer,
  Bell,
  AlertTriangle,
  Calendar,
  ChevronUp,
  ChevronDown,
  X,
  Truck
} from 'lucide-react';

const SalesOrderList = () => {
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status')?.toLowerCase();
  const urlSOId = searchParams.get('id');

  const canCreate = hasPermission('SALES_ORDER_CREATE');
  const canEdit = hasPermission('SALES_ORDER_EDIT');
  const canConfirm = hasPermission('SALES_ORDER_CONFIRM');

  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Delivery Reminders & Alerts State
  const [deliverySummary, setDeliverySummary] = useState({
    overdueCount: 0,
    dueTodayCount: 0,
    upcomingCount: 0,
    totalAlerts: 0,
  });
  const [deliveryAlerts, setDeliveryAlerts] = useState([]);
  const [isAlertCenterExpanded, setIsAlertCenterExpanded] = useState(true);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [syncingAlerts, setSyncingAlerts] = useState(false);
  const [dismissingId, setDismissingId] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'all');
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
  const [detailInitialTab, setDetailInitialTab] = useState('details');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSO, setEditingSO] = useState(null);
  const [isDrawingWorkspaceOpen, setIsDrawingWorkspaceOpen] = useState(false);
  const [drawingWorkspaceSOId, setDrawingWorkspaceSOId] = useState(null);

  // Auto-open detail modal if navigated with ?id=
  useEffect(() => {
    if (urlSOId) {
      setSelectedSOId(urlSOId);
      setIsDetailOpen(true);
    }
  }, [urlSOId]);

  const fetchDeliveryAlerts = async () => {
    try {
      const res = await getSalesOrderDeliveryAlertsSummary();
      if (res.success) {
        setDeliverySummary(
          res.summary || {
            overdueCount: 0,
            dueTodayCount: 0,
            upcomingCount: 0,
            totalAlerts: 0,
          }
        );
        setDeliveryAlerts(res.alerts?.deliveryAlerts || []);
      }
    } catch (err) {
      console.error('Failed to load delivery alerts summary:', err);
    }
  };

  const fetchSalesOrdersData = async (overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const activeSearch = overrides.search !== undefined ? overrides.search : searchTerm;
      const activeClient = overrides.client !== undefined ? overrides.client : clientFilter;
      const activeStatus = overrides.status !== undefined ? overrides.status : statusFilter;
      const activeType = overrides.orderType !== undefined ? overrides.orderType : typeFilter;
      const activeCategory = overrides.orderCategory !== undefined ? overrides.orderCategory : categoryFilter;
      const activeFrom = overrides.from !== undefined ? overrides.from : fromDate;
      const activeTo = overrides.to !== undefined ? overrides.to : toDate;
      const activeDeliveryStatus = overrides.deliveryStatus !== undefined ? overrides.deliveryStatus : deliveryStatusFilter;
      const activePage = overrides.page !== undefined ? overrides.page : page;

      const params = { page: activePage, limit };
      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (activeClient !== 'all') params.client = activeClient;
      if (activeStatus !== 'all') params.status = activeStatus;
      if (activeType !== 'all') params.orderType = activeType;
      if (activeCategory !== 'all') params.orderCategory = activeCategory;
      if (activeFrom) params.from = activeFrom;
      if (activeTo) params.to = activeTo;
      if (activeDeliveryStatus !== 'all') params.deliveryStatus = activeDeliveryStatus;

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
    fetchDeliveryAlerts();
  }, [clientFilter, statusFilter, typeFilter, categoryFilter, deliveryStatusFilter, page]);

  const loadClientOptions = async (inputValue) => {
    try {
      const res = await getClients({ search: inputValue, limit: 15, status: 'active', approvalStatus: 'APPROVED' });
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
    fetchSalesOrdersData({ page: 1 });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setClientFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setFromDate('');
    setToDate('');
    setDeliveryStatusFilter('all');
    setPage(1);
    fetchSalesOrdersData({
      search: '',
      client: 'all',
      status: 'all',
      orderType: 'all',
      orderCategory: 'all',
      from: '',
      to: '',
      deliveryStatus: 'all',
      page: 1,
    });
  };

  const handleKpiCardClick = (targetStatus) => {
    const nextVal = deliveryStatusFilter === targetStatus ? 'all' : targetStatus;
    setDeliveryStatusFilter(nextVal);
    setPage(1);
    fetchSalesOrdersData({ page: 1, deliveryStatus: nextVal });
  };

  const handleSyncAlerts = async () => {
    setSyncingAlerts(true);
    try {
      await Promise.all([fetchDeliveryAlerts(), fetchSalesOrdersData()]);
    } finally {
      setSyncingAlerts(false);
    }
  };

  const handleDismissAlert = async (salesOrderId) => {
    setDismissingId(salesOrderId);
    try {
      await dismissSalesOrderDeliveryAlert(salesOrderId);
      setDeliveryAlerts((prev) => prev.filter((a) => a.salesOrderId !== salesOrderId));
      setDeliverySummary((prev) => ({
        ...prev,
        totalAlerts: Math.max(0, prev.totalAlerts - 1),
      }));
    } catch (err) {
      console.error('Failed to dismiss delivery alert:', err);
    } finally {
      setDismissingId(null);
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    clientFilter !== 'all' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    deliveryStatusFilter !== 'all';

  const handleQuickStatusChange = async (so, newStatus) => {
    if (so.status === newStatus) return;

    const confirmMsg = `Are you sure you want to change status of Sales Order "${so.salesOrderNo}" to ${newStatus.toUpperCase().replace('_', ' ')}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(so._id);
    try {
      const res = await updateSalesOrderStatus(so._id, newStatus);
      if (res.success) {
        fetchSalesOrdersData();
        fetchDeliveryAlerts();
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

  const getDeliveryBadgeInfo = (dateVal, orderStatus) => {
    if (orderStatus === 'completed') {
      return {
        label: 'Delivered',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
      };
    }
    if (orderStatus === 'cancelled') {
      return {
        label: 'Cancelled',
        className: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    if (!dateVal) {
      return {
        label: 'No Delivery Date',
        className: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }

    const target = new Date(dateVal);
    if (isNaN(target.getTime())) {
      return { label: 'No Delivery Date', className: 'bg-slate-100 text-slate-500 border-slate-200' };
    }

    const now = new Date();
    const diffDays = Math.round((new Date(target.toDateString()) - new Date(now.toDateString())) / (24 * 60 * 60 * 1000));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        label: absDays === 1 ? 'Overdue (1d)' : `Overdue (${absDays}d)`,
        className: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due Today',
        className: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      };
    }
    if (diffDays <= 3) {
      return {
        label: diffDays === 1 ? 'Due Tomorrow' : `Due in ${diffDays}d`,
        className: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
      };
    }
    return {
      label: `In ${diffDays}d`,
      className: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
    };
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
        key: 'expectedDeliveryDate',
        header: 'Expected Delivery',
        sortable: true,
        render: (val, row) => {
          const badge = getDeliveryBadgeInfo(val, row.status);
          return (
            <div className="whitespace-nowrap">
              <div className="font-medium text-slate-800 text-[12.5px]">
                {val ? new Date(val).toLocaleDateString('en-GB') : '—'}
              </div>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] border ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
          );
        }
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
                setDetailInitialTab('details');
                setIsDetailOpen(true);
              }
            },
            {
              label: 'Documents & Attachments',
              icon: Paperclip,
              onClick: () => {
                setSelectedSOId(row._id);
                setDetailInitialTab('attachments');
                setIsDetailOpen(true);
              }
            },
            {
              label: 'Drawing Print',
              icon: Printer,
              color: 'var(--primary-600)',
              onClick: () => {
                setDrawingWorkspaceSOId(row._id);
                setIsDrawingWorkspaceOpen(true);
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
                  setDetailInitialTab('details');
                  setIsDetailOpen(true);
                }}
                title="View Details"
              >
                <Eye size={13} className="mr-1" /> View
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setDrawingWorkspaceSOId(row._id);
                  setIsDrawingWorkspaceOpen(true);
                }}
                title="Engineering Drawing Workspace & Printing"
                className="text-blue-700 hover:text-blue-900 hover:bg-blue-50 font-medium"
              >
                <Printer size={13} className="mr-1 text-blue-600" /> Drawing
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

      {/* 1. DELIVERY ALERT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Overdue / Delayed Delivery Card */}
        <div
          onClick={() => handleKpiCardClick('delayed')}
          className={`cursor-pointer transition-all p-3.5 rounded-lg border bg-white shadow-2xs hover:shadow-xs ${
            deliveryStatusFilter === 'delayed' || deliveryStatusFilter === 'overdue'
              ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/30'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-600" /> Delayed Delivery
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded font-semibold bg-rose-100 text-rose-800">
              Overdue
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {deliverySummary.overdueCount || 0}
            </span>
            <span className="text-xs text-slate-500">orders</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {deliveryStatusFilter === 'delayed' || deliveryStatusFilter === 'overdue'
              ? 'Active filter (click to reset)'
              : 'Click to filter delayed orders'}
          </div>
        </div>

        {/* Delivery Due Today Card */}
        <div
          onClick={() => handleKpiCardClick('due_today')}
          className={`cursor-pointer transition-all p-3.5 rounded-lg border bg-white shadow-2xs hover:shadow-xs ${
            deliveryStatusFilter === 'due_today'
              ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/30'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600" /> Due Today
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-900">
              Immediate
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {deliverySummary.dueTodayCount || 0}
            </span>
            <span className="text-xs text-slate-500">orders</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {deliveryStatusFilter === 'due_today'
              ? 'Active filter (click to reset)'
              : 'Click to filter today’s due orders'}
          </div>
        </div>

        {/* Upcoming Delivery Card (1-3 Days) */}
        <div
          onClick={() => handleKpiCardClick('upcoming')}
          className={`cursor-pointer transition-all p-3.5 rounded-lg border bg-white shadow-2xs hover:shadow-xs ${
            deliveryStatusFilter === 'upcoming' || deliveryStatusFilter === 'upcoming_3_days'
              ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Truck size={14} className="text-blue-600" /> Upcoming (1–3 Days)
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded font-semibold bg-blue-100 text-blue-800">
              Approaching
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {deliverySummary.upcomingCount || 0}
            </span>
            <span className="text-xs text-slate-500">orders</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {deliveryStatusFilter === 'upcoming' || deliveryStatusFilter === 'upcoming_3_days'
              ? 'Active filter (click to reset)'
              : 'Click to filter next 3 days'}
          </div>
        </div>
      </div>

      {/* 2. IN-PAGE ACTION CENTER & DELIVERY ALERTS DRAWER */}
      {deliveryAlerts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Bell size={14} className="text-primary-600" /> Sales Order Delivery Alerts ({deliveryAlerts.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncAlerts}
                disabled={syncingAlerts}
                className="text-[11.5px] text-slate-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/60 transition-colors"
                title="Synchronize delivery alert status"
              >
                <RefreshCw size={12} className={syncingAlerts ? 'spin' : ''} />
                <span>Sync</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAlertCenterExpanded(!isAlertCenterExpanded)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
                title={isAlertCenterExpanded ? 'Collapse' : 'Expand'}
              >
                {isAlertCenterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          {isAlertCenterExpanded && (
            <div className="p-3 max-h-64 overflow-y-auto space-y-2">
              {deliveryAlerts.map((alert) => (
                <div
                  key={alert.salesOrderId}
                  className="p-2.5 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200 rounded-md flex flex-wrap items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-[280px]">
                    <span className="font-mono font-bold text-blue-700">{alert.salesOrderNo}</span>
                    <span className="font-medium text-slate-900">{alert.clientName || 'Customer'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      Delivery: <strong>{new Date(alert.expectedDeliveryDate).toLocaleDateString('en-GB')}</strong>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        alert.category === 'DELAYED'
                          ? 'bg-rose-100 text-rose-800'
                          : alert.category === 'DUE_TODAY'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alert.category === 'DELAYED'
                        ? `DELAYED (${alert.daysOverdue}d)`
                        : alert.category === 'DUE_TODAY'
                        ? 'DUE TODAY'
                        : `DUE IN ${alert.daysRemaining}d`}
                    </span>
                    <span className="text-slate-500 italic text-[11px]">
                      "{alert.message}"
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11.5px] text-slate-500">
                    <span className="capitalize">Status: {alert.status?.replace('_', ' ')}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSOId(alert.salesOrderId);
                          setDetailInitialTab('details');
                          setIsDetailOpen(true);
                        }}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        Open Order
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissAlert(alert.salesOrderId)}
                        disabled={dismissingId === alert.salesOrderId}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                        title="Dismiss alert"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

            {/* Delivery Status Dropdown */}
            <div className="w-[160px]">
              <Select
                value={deliveryStatusFilter}
                onChange={(e) => {
                  setDeliveryStatusFilter(e.target.value);
                  setPage(1);
                  fetchSalesOrdersData({ page: 1, deliveryStatus: e.target.value });
                }}
                title="Filter by Delivery Status"
              >
                <option value="all">All Deliveries</option>
                <option value="delayed">Delayed / Overdue</option>
                <option value="due_today">Due Today</option>
                <option value="upcoming">Upcoming (1–3 Days)</option>
                <option value="no_date">No Delivery Date</option>
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
          initialTab={detailInitialTab}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedSOId(null);
            setDetailInitialTab('details');
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

      {/* Engineering Drawing Workspace Modal */}
      {isDrawingWorkspaceOpen && drawingWorkspaceSOId && (
        <SalesOrderDrawingWorkspaceModal
          isOpen={isDrawingWorkspaceOpen}
          salesOrderId={drawingWorkspaceSOId}
          onClose={() => {
            setIsDrawingWorkspaceOpen(false);
            setDrawingWorkspaceSOId(null);
          }}
        />
      )}
    </div>
  );
};

export default SalesOrderList;

