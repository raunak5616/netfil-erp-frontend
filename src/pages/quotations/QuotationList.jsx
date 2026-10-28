import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getQuotations,
  updateQuotationStatus,
  releaseQuotation,
  printQuotationPdf,
  getQuotationRemindersSummary,
  dismissQuotationReminder,
  syncQuotationReminders,
} from '../../services/quotationService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select, AsyncSelect } from '../../components/ui/FormField';
import QuotationFormModal from './QuotationFormModal';
import QuotationDetailModal from './QuotationDetailModal';
import QuotationAmendmentModal from './QuotationAmendmentModal';
import QuotationLostModal from './QuotationLostModal';
import QuotationFollowUpModal from './QuotationFollowUpModal';
import ActionDropdown from '../../components/ui/ActionDropdown';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  Calendar,
  Clock,
  Building2,
  Calculator,
  CheckCircle2,
  FileDiff,
  Tag,
  FileX,
  MessageSquare,
  ShoppingBag,
  Printer,
  ArrowUpDown,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Bell,
  Check,
  X,
} from 'lucide-react';

const QuotationList = () => {
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status')?.toLowerCase();

  const canCreate = hasPermission('QUOTATION_CREATE');
  const canEdit = hasPermission('QUOTATION_EDIT');
  const canRelease = hasPermission('QUOTATION_RELEASE');
  const canAmend = hasPermission('QUOTATION_AMEND');

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // In-Page Reminders & Summary State
  const [remindersSummary, setRemindersSummary] = useState({
    overdueCount: 0,
    dueTodayCount: 0,
    dueNext4DaysCount: 0,
    upcomingFollowUpsCount: 0,
  });
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);
  const [followUpReminders, setFollowUpReminders] = useState([]);
  const [activeAlertTab, setActiveAlertTab] = useState('deadlines');
  const [isActionCenterExpanded, setIsActionCenterExpanded] = useState(true);
  const [dismissingId, setDismissingId] = useState(null);
  const [syncingReminders, setSyncingReminders] = useState(false);

  // Pagination States (Fixed at 25 records per page)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [followUpFrom, setFollowUpFrom] = useState('');
  const [followUpTo, setFollowUpTo] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');
  const [deadlineStatus, setDeadlineStatus] = useState('all');
  const [hasPendingFollowUp, setHasPendingFollowUp] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);
  const [amendmentTargetQuotation, setAmendmentTargetQuotation] = useState(null);
  const [isLostOpen, setIsLostOpen] = useState(false);
  const [lostTargetQuotation, setLostTargetQuotation] = useState(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpTargetQuotation, setFollowUpTargetQuotation] = useState(null);

  const fetchRemindersSummary = async () => {
    try {
      const res = await getQuotationRemindersSummary();
      if (res.success) {
        setRemindersSummary(res.summary || {
          overdueCount: 0,
          dueTodayCount: 0,
          dueNext4DaysCount: 0,
          upcomingFollowUpsCount: 0,
        });
        setDeadlineAlerts(res.alerts?.deadlineAlerts || []);
        setFollowUpReminders(res.alerts?.followUpReminders || []);
      }
    } catch (err) {
      console.error('Failed to load quotation reminders:', err);
    }
  };

  const fetchQuotationsData = async (overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const activeSearch = overrides.search !== undefined ? overrides.search : debouncedSearch;
      const activeClient = overrides.client !== undefined ? overrides.client : clientFilter;
      const activeStatus = overrides.status !== undefined ? overrides.status : statusFilter;
      const activeType = overrides.quotationType !== undefined ? overrides.quotationType : typeFilter;
      const activeCategory = overrides.quotationCategory !== undefined ? overrides.quotationCategory : categoryFilter;
      const activeFrom = overrides.from !== undefined ? overrides.from : fromDate;
      const activeTo = overrides.to !== undefined ? overrides.to : toDate;
      const activeFuFrom = overrides.followUpFrom !== undefined ? overrides.followUpFrom : followUpFrom;
      const activeFuTo = overrides.followUpTo !== undefined ? overrides.followUpTo : followUpTo;
      const activeDlFrom = overrides.deadlineFrom !== undefined ? overrides.deadlineFrom : deadlineFrom;
      const activeDlTo = overrides.deadlineTo !== undefined ? overrides.deadlineTo : deadlineTo;
      const activeDlStatus = overrides.deadlineStatus !== undefined ? overrides.deadlineStatus : deadlineStatus;
      const activeHasPendingFu = overrides.hasPendingFollowUp !== undefined ? overrides.hasPendingFollowUp : hasPendingFollowUp;
      const activeSortBy = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
      const activePage = overrides.page !== undefined ? overrides.page : page;

      const params = {
        page: activePage,
        limit: pageSize,
      };

      if (activeSearch && activeSearch.trim()) params.search = activeSearch.trim();
      if (activeClient !== 'all') params.client = activeClient;
      if (activeStatus !== 'all') params.status = activeStatus;
      if (activeType !== 'all') params.quotationType = activeType;
      if (activeCategory !== 'all') params.quotationCategory = activeCategory;
      if (activeFrom) params.from = activeFrom;
      if (activeTo) params.to = activeTo;
      if (activeFuFrom) params.followUpFrom = activeFuFrom;
      if (activeFuTo) params.followUpTo = activeFuTo;
      if (activeDlFrom) params.deadlineFrom = activeDlFrom;
      if (activeDlTo) params.deadlineTo = activeDlTo;
      if (activeDlStatus !== 'all') params.deadlineStatus = activeDlStatus;
      if (activeHasPendingFu !== 'all') params.hasPendingFollowUp = activeHasPendingFu;
      if (activeSortBy) params.sortBy = activeSortBy;

      const qRes = await getQuotations(params);

      if (qRes.success && Array.isArray(qRes.quotations)) {
        setQuotations(qRes.quotations);
        const total = typeof qRes.total === 'number' ? qRes.total : (qRes.count || 0);
        setTotalRecords(total);
        setTotalPages(qRes.totalPages || Math.ceil(total / pageSize) || 1);
        if (qRes.page) setPage(qRes.page);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error('Failed to fetch Quotations:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Load reminders summary once on mount
  useEffect(() => {
    fetchRemindersSummary();
  }, []);

  // Fetch quotations and reset to page 1 whenever filters, search, or sorting change
  useEffect(() => {
    setPage(1);
    fetchQuotationsData({ page: 1, search: debouncedSearch });
  }, [clientFilter, statusFilter, typeFilter, categoryFilter, deadlineStatus, hasPendingFollowUp, sortBy, debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchQuotationsData({ page: newPage });
  };

  const handleClearDateFilters = () => {
    setFollowUpFrom('');
    setFollowUpTo('');
    setFromDate('');
    setToDate('');
    setDeadlineFrom('');
    setDeadlineTo('');
    setDeadlineStatus('all');
    setHasPendingFollowUp('all');
    setPage(1);
    fetchQuotationsData({
      page: 1,
      from: '',
      to: '',
      followUpFrom: '',
      followUpTo: '',
      deadlineFrom: '',
      deadlineTo: '',
      deadlineStatus: 'all',
      hasPendingFollowUp: 'all',
    });
  };

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
    fetchQuotationsData({ page: 1, search: searchTerm });
  };

  const handleKpiCardClick = (type) => {
    setPage(1);
    if (type === 'overdue') {
      const nextVal = deadlineStatus === 'overdue' ? 'all' : 'overdue';
      setDeadlineStatus(nextVal);
      fetchQuotationsData({ page: 1, deadlineStatus: nextVal });
    } else if (type === 'due_today') {
      const nextVal = deadlineStatus === 'due_today' ? 'all' : 'due_today';
      setDeadlineStatus(nextVal);
      fetchQuotationsData({ page: 1, deadlineStatus: nextVal });
    } else if (type === 'due_next_4_days') {
      const nextVal = deadlineStatus === 'due_next_4_days' ? 'all' : 'due_next_4_days';
      setDeadlineStatus(nextVal);
      fetchQuotationsData({ page: 1, deadlineStatus: nextVal });
    } else if (type === 'upcoming_followups') {
      const nextVal = hasPendingFollowUp === 'true' ? 'all' : 'true';
      setHasPendingFollowUp(nextVal);
      fetchQuotationsData({ page: 1, hasPendingFollowUp: nextVal });
    }
  };

  const handleDismissReminder = async (reminderId) => {
    setDismissingId(reminderId);
    try {
      const res = await dismissQuotationReminder(reminderId);
      if (res.success) {
        setDeadlineAlerts((prev) => prev.filter((a) => a._id !== reminderId));
        setFollowUpReminders((prev) => prev.filter((r) => r._id !== reminderId));
      }
    } catch (err) {
      console.error('Failed to dismiss reminder:', err);
    } finally {
      setDismissingId(null);
    }
  };

  const handleSyncReminders = async () => {
    setSyncingReminders(true);
    try {
      const res = await syncQuotationReminders();
      if (res.success) {
        setRemindersSummary(res.summary || {});
        setDeadlineAlerts(res.alerts?.deadlineAlerts || []);
        setFollowUpReminders(res.alerts?.followUpReminders || []);
      }
    } catch (err) {
      console.error('Failed to sync reminders:', err);
    } finally {
      setSyncingReminders(false);
    }
  };

  const handleStatusChange = async (quotation, newStatus) => {
    if (quotation.status === newStatus) return;

    const confirmMsg = `Are you sure you want to update status of Quotation "${quotation.quotationNo}" to ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(quotation._id);
    try {
      const res = await updateQuotationStatus(quotation._id, newStatus);
      if (res.success) {
        setQuotations((prev) =>
          prev.map((q) => (q._id === quotation._id ? { ...q, status: newStatus } : q))
        );
        fetchRemindersSummary();
      }
    } catch (err) {
      console.error('Failed to update quotation status:', err);
      setError(err.response?.data?.message || 'Failed to update quotation status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelease = async (quotation) => {
    const confirmMsg = `Are you sure you want to RELEASE Quotation "${quotation.quotationNo}"? Once released, direct edits will be locked.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(quotation._id);
    try {
      const res = await releaseQuotation(quotation._id);
      if (res.success) {
        setQuotations((prev) =>
          prev.map((q) => (q._id === quotation._id ? { ...q, status: 'released' } : q))
        );
      }
    } catch (err) {
      console.error('Failed to release quotation:', err);
      setError(err.response?.data?.message || 'Failed to release quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const getDeadlineBadgeInfo = (deadlineDate) => {
    if (!deadlineDate) {
      return {
        label: 'No Deadline',
        className: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }

    const target = new Date(deadlineDate);
    if (isNaN(target.getTime())) {
      return { label: 'No Deadline', className: 'bg-slate-100 text-slate-500 border-slate-200' };
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
    if (diffDays === 1) {
      return {
        label: 'Due Tomorrow',
        className: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
      };
    }
    if (diffDays <= 4) {
      return {
        label: `In ${diffDays} Days`,
        className: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
      };
    }
    return {
      label: `Upcoming (${diffDays}d)`,
      className: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
    };
  };

  const columns = useMemo(
    () => [
      {
        key: 'quotationNo',
        header: 'Quotation No',
        sortable: true,
        render: (val, row) => (
          <div>
            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
              {val}
            </span>
            {row.amendmentCount > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '11px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'var(--neutral-200)',
                  color: 'var(--neutral-700)',
                  fontWeight: 600,
                }}
              >
                A{row.amendmentCount}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'quotationDate',
        header: 'Date',
        sortable: true,
        render: (val) => (
          <div>{val ? new Date(val).toLocaleDateString('en-GB') : '-'}</div>
        ),
      },
      {
        key: 'client',
        header: 'Party / Customer',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--neutral-900)' }}>
              {row.client?.companyName || 'N/A'}
            </div>
            {row.client?.clientCode && (
              <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
                {row.client.clientCode}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'deadline',
        header: 'Attention Deadline',
        sortable: true,
        render: (val) => {
          const badge = getDeadlineBadgeInfo(val);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: val ? 600 : 400, color: val ? 'var(--neutral-900)' : 'var(--neutral-400)' }}>
                {val ? new Date(val).toLocaleDateString('en-GB') : '—'}
              </div>
              <div>
                <span className={`inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded border ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: 'nextFollowUpDate',
        header: 'Next Follow-up',
        sortable: true,
        render: (val, row) => {
          if (!val) {
            return <span style={{ color: 'var(--neutral-400)', fontSize: '12px' }}>—</span>;
          }
          const latestFollowUp = row.followUps && row.followUps.length > 0 ? row.followUps[row.followUps.length - 1] : null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} color="var(--primary-600)" />
                <span>{new Date(val).toLocaleDateString('en-GB')}</span>
                {latestFollowUp?.followUpTime && (
                  <span style={{ fontSize: '10.5px', color: 'var(--neutral-500)' }}>@{latestFollowUp.followUpTime}</span>
                )}
              </div>
              {latestFollowUp?.outcome && latestFollowUp.outcome !== 'PENDING' && (
                <div>
                  <span style={{ fontSize: '9.5px', padding: '1px 4px', borderRadius: '3px', background: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-200)', fontWeight: 600 }}>
                    {latestFollowUp.outcome}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'requirement',
        header: 'Requirement Ref',
        render: (_, row) => (
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--neutral-700)' }}>
            {row.requirement?.requirementNo || '-'}
          </span>
        ),
      },
      {
        key: 'quotationType',
        header: 'Type / Category',
        render: (_, row) => (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <span
              className={`badge ${
                row.quotationType === 'export' ? 'badge-warning' : 'badge-secondary'
              }`}
              style={{ textTransform: 'capitalize', fontSize: '11px' }}
            >
              {row.quotationType}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
              style={{ textTransform: 'capitalize', fontSize: '11px' }}
            >
              {row.quotationCategory}
            </span>
          </div>
        ),
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
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (val) => <StatusBadge status={val} />,
      },
      {
        key: 'salesOrder',
        header: 'Sales Order',
        render: (_, row) => {
          if (!row.salesOrder) return <span style={{ color: 'var(--neutral-400)', fontSize: '12px' }}>—</span>;
          const soNo = typeof row.salesOrder === 'object' ? row.salesOrder.salesOrderNo : row.salesOrder;
          const soStatus = typeof row.salesOrder === 'object' ? row.salesOrder.status : '';
          return (
            <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--success-700)', fontSize: '12px' }}>
                {soNo}
              </span>
              {soStatus && (
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'var(--success-50)', color: 'var(--success-700)', border: '1px solid var(--success-200)', textTransform: 'uppercase', width: 'fit-content' }}>
                  {soStatus}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '175px',
        render: (_, row) => {
          const isClosedState = ['won', 'converted', 'completed', 'lost', 'cancelled'].includes(row.status);

          const actionItems = [
            {
              label: 'Print Quotation',
              icon: Printer,
              color: 'var(--primary-700)',
              onClick: () => printQuotationPdf(row._id),
            },
            {
              label: 'Add Follow-up',
              icon: Calendar,
              color: 'var(--primary-600)',
              show: canEdit && !['lost', 'cancelled', 'completed'].includes(row.status),
              onClick: () => {
                setFollowUpTargetQuotation(row);
                setIsFollowUpOpen(true);
              },
            },
            {
              label: 'Edit Quotation',
              icon: Edit,
              show: canEdit && row.status !== 'released' && !isClosedState,
              onClick: () => {
                setEditingQuotation(row);
                setIsFormOpen(true);
              },
            },
            {
              label: 'Release Quotation',
              icon: CheckCircle2,
              color: 'var(--success-600)',
              show: canRelease && row.status !== 'released' && !isClosedState,
              onClick: () => handleRelease(row),
            },
            {
              label: 'Create Amendment',
              icon: FileDiff,
              show: canAmend && row.status === 'released' && !isClosedState,
              onClick: () => {
                setAmendmentTargetQuotation(row);
                setIsAmendmentOpen(true);
              },
            },
            {
              label: 'Mark as Lost',
              icon: FileX,
              danger: true,
              divider: true,
              show: canEdit && !isClosedState,
              onClick: () => {
                setLostTargetQuotation(row);
                setIsLostOpen(true);
              },
            },
          ];

          return (
            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSelectedQuotation(row);
                  setIsDetailOpen(true);
                }}
                title="View Details"
              >
                <Eye size={13} style={{ marginRight: '3px' }} /> View
              </Button>

              {!['lost', 'cancelled', 'completed'].includes(row.status) && canEdit && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setFollowUpTargetQuotation(row);
                    setIsFollowUpOpen(true);
                  }}
                  title="Add Follow-up"
                  style={{
                    color: 'var(--primary-700)',
                    borderColor: 'var(--primary-200)',
                    backgroundColor: 'var(--primary-50)',
                    fontWeight: 600,
                  }}
                >
                  <Calendar size={13} style={{ marginRight: '3px' }} color="var(--primary-600)" /> Follow-up
                </Button>
              )}

              <ActionDropdown items={actionItems} />
            </div>
          );
        },
      },
    ],
    [canEdit, canRelease, canAmend, actionLoading]
  );

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Quotation Management"
        subtitle="Create, manage, release, and amend commercial quotations for clients."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchQuotationsData();
                fetchRemindersSummary();
              }}
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
                  setEditingQuotation(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus size={14} style={{ marginRight: '6px' }} /> New Quotation
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* 1. KPI SUMMARY STRIP (Single-click quick filters) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Overdue Card */}
        <div
          onClick={() => handleKpiCardClick('overdue')}
          className={`cursor-pointer transition-all p-3.5 rounded-lg border bg-white shadow-2xs hover:shadow-xs ${
            deadlineStatus === 'overdue'
              ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/30'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-600" /> Overdue
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded font-semibold bg-rose-100 text-rose-800">
              Needs Action
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {remindersSummary.overdueCount || 0}
            </span>
            <span className="text-xs text-slate-500">quotations</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {deadlineStatus === 'overdue' ? 'Active filter (click to reset)' : 'Click to filter overdue'}
          </div>
        </div>

        {/* Due Today Card */}
        <div
          onClick={() => handleKpiCardClick('due_today')}
          className={`cursor-pointer transition-all p-3.5 rounded-lg border bg-white shadow-2xs hover:shadow-xs ${
            deadlineStatus === 'due_today'
              ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/30'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600" /> Due Today
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-900">
              Priority
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {remindersSummary.dueTodayCount || 0}
            </span>
            <span className="text-xs text-slate-500">quotations</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {deadlineStatus === 'due_today' ? 'Active filter (click to reset)' : 'Click to filter today’s deadlines'}
          </div>
        </div>

        {/* Due Next 4 Days Card */}
        <div
          onClick={() => handleKpiCardClick('due_next_4_days')}
          className={`cursor-pointer transition-all p-3.5 rounded-lg border bg-white shadow-2xs hover:shadow-xs ${
            deadlineStatus === 'due_next_4_days'
              ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" /> Due in 2–4 Days
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded font-semibold bg-blue-100 text-blue-800">
              Upcoming
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {remindersSummary.dueNext4DaysCount || 0}
            </span>
            <span className="text-xs text-slate-500">quotations</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {deadlineStatus === 'due_next_4_days' ? 'Active filter (click to reset)' : 'Click to filter next 4 days'}
          </div>
        </div>

        {/* Upcoming Follow-ups Card */}
        <div
          onClick={() => handleKpiCardClick('upcoming_followups')}
          className={`cursor-pointer transition-all p-3.5 rounded-lg border bg-white shadow-2xs hover:shadow-xs ${
            hasPendingFollowUp === 'true'
              ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/30'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-emerald-600" /> Scheduled Follow-ups
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800">
              Active Touchpoints
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {remindersSummary.upcomingFollowUpsCount || 0}
            </span>
            <span className="text-xs text-slate-500">pending</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {hasPendingFollowUp === 'true' ? 'Active filter (click to reset)' : 'Click to filter active follow-ups'}
          </div>
        </div>
      </div>

      {/* 2. IN-PAGE ACTION CENTER & REMINDERS DRAWER */}
      {(deadlineAlerts.length > 0 || followUpReminders.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Bell size={14} className="text-primary-600" /> Quotation Reminders & Action Center
              </span>
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-md text-xs">
                <button
                  type="button"
                  onClick={() => setActiveAlertTab('deadlines')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    activeAlertTab === 'deadlines'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Deadline Alerts ({deadlineAlerts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAlertTab('followups')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    activeAlertTab === 'followups'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Follow-up Reminders ({followUpReminders.length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncReminders}
                disabled={syncingReminders}
                className="text-[11.5px] text-slate-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/60 transition-colors"
                title="Synchronize reminder status"
              >
                <RefreshCw size={12} className={syncingReminders ? 'spin' : ''} />
                <span>Sync</span>
              </button>
              <button
                type="button"
                onClick={() => setIsActionCenterExpanded(!isActionCenterExpanded)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                {isActionCenterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          {isActionCenterExpanded && (
            <div className="p-3 max-h-64 overflow-y-auto space-y-2">
              {activeAlertTab === 'deadlines' ? (
                deadlineAlerts.length === 0 ? (
                  <div className="text-xs text-slate-500 py-3 text-center">No active deadline alerts.</div>
                ) : (
                  deadlineAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      className="p-2.5 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200 rounded-md flex flex-wrap items-center justify-between gap-2 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-[280px]">
                        <span className="font-mono font-bold text-primary-700">{alert.quotationNo}</span>
                        <span className="font-medium text-slate-900">{alert.clientName || 'Customer'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">
                          Deadline: <strong>{new Date(alert.targetDate).toLocaleDateString('en-GB')}</strong>
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            alert.stage === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : alert.stage === 'DUE_TODAY'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {alert.stage.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11.5px] text-slate-500">
                        <span>Owner: {alert.salesPersonName || 'Unassigned'}</span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuotation(alert.quotation);
                              setIsDetailOpen(true);
                            }}
                            className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFollowUpTargetQuotation(alert.quotation);
                              setIsFollowUpOpen(true);
                            }}
                            className="px-2 py-0.5 rounded bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 font-medium"
                          >
                            Follow-up
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissReminder(alert._id)}
                            disabled={dismissingId === alert._id}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                            title="Dismiss reminder"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                followUpReminders.length === 0 ? (
                  <div className="text-xs text-slate-500 py-3 text-center">No active follow-up reminders.</div>
                ) : (
                  followUpReminders.map((alert) => (
                    <div
                      key={alert._id}
                      className="p-2.5 bg-emerald-50/40 hover:bg-emerald-50/80 border border-emerald-200/80 rounded-md flex flex-wrap items-center justify-between gap-2 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-[280px]">
                        <span className="font-mono font-bold text-emerald-800">{alert.quotationNo}</span>
                        <span className="font-medium text-slate-900">{alert.clientName || 'Customer'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">
                          Follow-up Scheduled: <strong>{new Date(alert.targetDate).toLocaleDateString('en-GB')}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11.5px] text-slate-500">
                        <span>Owner: {alert.salesPersonName || 'Unassigned'}</span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFollowUpTargetQuotation(alert.quotation);
                              setIsFollowUpOpen(true);
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                          >
                            Record Outcome
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissReminder(alert._id)}
                            disabled={dismissingId === alert._id}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                            title="Dismiss reminder"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. TOOLBAR CONTROLS & MAIN REGISTER */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        <div className="flex flex-col gap-3 mb-4">
          <form onSubmit={handleApplySearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {/* Row 1: Search & Categorical Dropdowns */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="relative flex-1 min-w-[220px]" style={{ flex: '1', minWidth: '220px' }}>
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  className="pl-8"
                  placeholder="Search by Quotation No, Party, Remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <AsyncSelect
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value || 'all')}
                loadOptions={loadClientOptions}
                placeholder="All Parties"
                style={{ width: '220px' }}
                initialLabel={clientFilter === 'all' ? 'All Parties' : undefined}
              />

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="follow_up">Follow Up</option>
                <option value="won">Won / Converted</option>
                <option value="lost">Lost</option>
                <option value="completed">Completed</option>
                <option value="released">Released</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>

              <Select
                value={deadlineStatus}
                onChange={(e) => setDeadlineStatus(e.target.value)}
                style={{ width: '170px' }}
                title="Filter by Attention Deadline Status"
              >
                <option value="all">All Deadlines</option>
                <option value="overdue">Overdue Deadlines</option>
                <option value="due_today">Due Today</option>
                <option value="due_next_4_days">Due Within 4 Days</option>
                <option value="upcoming">Upcoming (&gt; 4 days)</option>
                <option value="no_deadline">No Deadline</option>
              </Select>

              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: '120px' }}
              >
                <option value="all">All Types</option>
                <option value="domestic">Domestic</option>
                <option value="export">Export</option>
              </Select>

              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: '120px' }}
              >
                <option value="all">All Categories</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="spare">Spare</option>
              </Select>
            </div>

            {/* Row 2: Date Filters, Sorting & Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--neutral-200)',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Quotation Date Group */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--neutral-600)', whiteSpace: 'nowrap' }}>
                    Quote Date:
                  </span>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{ width: '125px', padding: '4px 6px', fontSize: '12px' }}
                    title="Quotation From Date"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>-</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{ width: '125px', padding: '4px 6px', fontSize: '12px' }}
                    title="Quotation To Date"
                  />
                </div>

                {/* Deadline Date Range */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--primary-800)', whiteSpace: 'nowrap' }}>
                    Deadline:
                  </span>
                  <Input
                    type="date"
                    value={deadlineFrom}
                    onChange={(e) => setDeadlineFrom(e.target.value)}
                    style={{ width: '125px', padding: '4px 6px', fontSize: '12px' }}
                    title="Deadline From Date"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>-</span>
                  <Input
                    type="date"
                    value={deadlineTo}
                    onChange={(e) => setDeadlineTo(e.target.value)}
                    style={{ width: '125px', padding: '4px 6px', fontSize: '12px' }}
                    title="Deadline To Date"
                  />
                </div>

                {/* Follow-up Date Group */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--emerald-800)', whiteSpace: 'nowrap' }}>
                    Follow-up:
                  </span>
                  <Input
                    type="date"
                    value={followUpFrom}
                    onChange={(e) => setFollowUpFrom(e.target.value)}
                    style={{ width: '125px', padding: '4px 6px', fontSize: '12px' }}
                    title="Follow-up From Date"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>-</span>
                  <Input
                    type="date"
                    value={followUpTo}
                    onChange={(e) => setFollowUpTo(e.target.value)}
                    style={{ width: '125px', padding: '4px 6px', fontSize: '12px' }}
                    title="Follow-up To Date"
                  />
                </div>

                {/* Sorting Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <ArrowUpDown size={13} />
                    Sort:
                  </span>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ width: '235px', padding: '4px 8px', fontSize: '12px' }}
                  >
                    <option value="newest">Newest Quotation First</option>
                    <option value="oldest">Oldest Quotation First</option>
                    <option value="overdue_first">Overdue First</option>
                    <option value="due_today_tomorrow_first">Due Today & Tomorrow First</option>
                    <option value="deadline_earliest">Deadline: Earliest First</option>
                    <option value="deadline_latest">Deadline: Latest First</option>
                    <option value="follow_up_earliest">Follow-up Date: Earliest First</option>
                    <option value="follow_up_latest">Follow-up Date: Latest First</option>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button type="submit" variant="primary" size="sm">
                  <Filter size={14} style={{ marginRight: '4px' }} /> Apply
                </Button>

                {(fromDate || toDate || followUpFrom || followUpTo || deadlineFrom || deadlineTo || deadlineStatus !== 'all' || hasPendingFollowUp !== 'all') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDateFilters}
                    title="Reset All Filters"
                    style={{ color: 'var(--neutral-600)' }}
                  >
                    <RotateCcw size={13} style={{ marginRight: '4px' }} /> Reset
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={quotations}
          loading={loading}
          emptyTitle="No Quotation records found"
          emptyDescription="Click '+ New Quotation' to create a commercial quotation for a client requirement."
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            totalRecords: totalRecords,
            pageSize: pageSize,
            recordLabel: 'quotations',
            onPageChange: handlePageChange,
          }}
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <QuotationFormModal
          isOpen={isFormOpen}
          quotation={editingQuotation}
          onClose={() => {
            setIsFormOpen(false);
            setEditingQuotation(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingQuotation(null);
            fetchQuotationsData();
            fetchRemindersSummary();
          }}
        />
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedQuotation && (
        <QuotationDetailModal
          isOpen={isDetailOpen}
          quotationId={selectedQuotation._id}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedQuotation(null);
          }}
          onEdit={(q) => {
            setIsDetailOpen(false);
            setEditingQuotation(q);
            setIsFormOpen(true);
          }}
          onRelease={() => {
            fetchQuotationsData();
            fetchRemindersSummary();
          }}
          canEdit={canEdit}
          canRelease={canRelease}
          canAmend={canAmend}
        />
      )}

      {/* Amendment Modal */}
      {isAmendmentOpen && amendmentTargetQuotation && (
        <QuotationAmendmentModal
          isOpen={isAmendmentOpen}
          quotation={amendmentTargetQuotation}
          onClose={() => {
            setIsAmendmentOpen(false);
            setAmendmentTargetQuotation(null);
          }}
          onSuccess={() => {
            setIsAmendmentOpen(false);
            setAmendmentTargetQuotation(null);
            fetchQuotationsData();
            fetchRemindersSummary();
          }}
        />
      )}

      {/* Lost Modal */}
      {isLostOpen && lostTargetQuotation && (
        <QuotationLostModal
          isOpen={isLostOpen}
          quotation={lostTargetQuotation}
          onClose={() => {
            setIsLostOpen(false);
            setLostTargetQuotation(null);
          }}
          onSuccess={() => {
            setIsLostOpen(false);
            setLostTargetQuotation(null);
            fetchQuotationsData();
            fetchRemindersSummary();
          }}
        />
      )}

      {/* Follow-up Modal */}
      {isFollowUpOpen && followUpTargetQuotation && (
        <QuotationFollowUpModal
          isOpen={isFollowUpOpen}
          quotation={followUpTargetQuotation}
          onClose={() => {
            setIsFollowUpOpen(false);
            setFollowUpTargetQuotation(null);
          }}
          onSuccess={() => {
            setIsFollowUpOpen(false);
            setFollowUpTargetQuotation(null);
            fetchQuotationsData();
            fetchRemindersSummary();
          }}
        />
      )}
    </div>
  );
};

export default QuotationList;
