import React, { useState, useEffect, useMemo } from 'react';
import {
  getQuotations,
  updateQuotationStatus,
  releaseQuotation,
} from '../../services/quotationService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import QuotationFormModal from './QuotationFormModal';
import QuotationDetailModal from './QuotationDetailModal';
import QuotationAmendmentModal from './QuotationAmendmentModal';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  Calendar,
  Building2,
  Calculator,
  CheckCircle2,
  FileDiff,
  Tag,
} from 'lucide-react';

const QuotationList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('QUOTATION_CREATE');
  const canEdit = hasPermission('QUOTATION_EDIT');
  const canRelease = hasPermission('QUOTATION_RELEASE');
  const canAmend = hasPermission('QUOTATION_AMEND');

  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);
  const [amendmentTargetQuotation, setAmendmentTargetQuotation] = useState(null);

  const fetchQuotationsData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (clientFilter !== 'all') params.client = clientFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.quotationType = typeFilter;
      if (categoryFilter !== 'all') params.quotationCategory = categoryFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const [qRes, clientRes] = await Promise.all([
        getQuotations(params),
        getClients().catch(() => ({ success: false, clients: [] })),
      ]);

      if (qRes.success && Array.isArray(qRes.quotations)) {
        setQuotations(qRes.quotations);
      } else {
        setError('Unexpected API response format');
      }

      if (clientRes.success && Array.isArray(clientRes.clients)) {
        setClients(clientRes.clients);
      }
    } catch (err) {
      console.error('Failed to fetch Quotations:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationsData();
  }, [clientFilter, statusFilter, typeFilter, categoryFilter]);

  const handleApplySearch = (e) => {
    if (e) e.preventDefault();
    fetchQuotationsData();
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
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '-'),
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
              className="badge badge-primary"
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
        render: (val, row) => {
          if (!canEdit || row.status === 'released') {
            return <StatusBadge status={val} />;
          }
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StatusBadge status={val} />
              <Select
                value={val}
                onChange={(e) => handleStatusChange(row, e.target.value)}
                disabled={actionLoading === row._id}
                style={{
                  fontSize: '11px',
                  padding: '2px 4px',
                  height: '24px',
                  width: 'auto',
                  borderRadius: '4px',
                }}
                title="Quick status transition"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="follow_up">Follow Up</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '200px',
        render: (_, row) => (
          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSelectedQuotation(row);
                setIsDetailOpen(true);
              }}
              title="View Details"
            >
              <Eye size={14} style={{ marginRight: '3px' }} /> View
            </Button>

            {row.status !== 'released' && canEdit && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setEditingQuotation(row);
                  setIsFormOpen(true);
                }}
                title="Edit Quotation"
              >
                <Edit size={14} style={{ marginRight: '3px' }} /> Edit
              </Button>
            )}

            {row.status !== 'released' && canRelease && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleRelease(row)}
                disabled={actionLoading === row._id}
                title="Release Quotation"
              >
                <CheckCircle2 size={14} style={{ marginRight: '3px' }} color="var(--success-600)" /> Release
              </Button>
            )}

            {row.status === 'released' && canAmend && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setAmendmentTargetQuotation(row);
                  setIsAmendmentOpen(true);
                }}
                title="Create Amendment"
              >
                <FileDiff size={14} style={{ marginRight: '3px' }} /> Amend
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canRelease, canAmend, actionLoading]
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Quotation Management"
        subtitle="Create, manage, release, and amend commercial quotations for clients."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuotationsData}
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

      <div className="card">
        {/* Toolbar Controls */}
        <div className="toolbar" style={{ padding: '16px', gap: '12px' }}>
          <form onSubmit={handleApplySearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div className="search-input-wrap" style={{ flex: '1', minWidth: '220px' }}>
              <Search size={16} />
              <Input
                placeholder="Search by Quotation No, Party, Remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="follow_up">Follow Up</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="released">Released</option>
            </Select>

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="all">All Types</option>
              <option value="domestic">Domestic</option>
              <option value="export">Export</option>
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
          data={quotations}
          loading={loading}
          emptyTitle="No Quotation records found"
          emptyDescription="Click '+ New Quotation' to create a commercial quotation for a client requirement."
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
          onRelease={fetchQuotationsData}
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
          }}
        />
      )}
    </div>
  );
};

export default QuotationList;
