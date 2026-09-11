import React, { useState, useEffect, useMemo } from 'react';
import { getRequirements, updateRequirementStatus } from '../../services/requirementService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import RequirementFormModal from './RequirementFormModal';
import RequirementDetailModal from './RequirementDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Calendar,
  Building2,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

const RequirementList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('REQUIREMENT_CREATE');
  const canEdit = hasPermission('REQUIREMENT_EDIT');

  const [requirements, setRequirements] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [partyFilter, setPartyFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);

  const fetchRequirementsData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, partyRes] = await Promise.all([
        getRequirements(),
        getClients().catch(() => ({ success: false, clients: [] })),
      ]);

      if (reqRes.success && Array.isArray(reqRes.requirements)) {
        setRequirements(reqRes.requirements);
      } else {
        setError('Unexpected API response format');
      }

      if (partyRes.success && Array.isArray(partyRes.clients)) {
        setClients(partyRes.clients);
      }
    } catch (err) {
      console.error('Failed to fetch Requirements:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
  }, []);

  const handleStatusChange = async (requirement, newStatus) => {
    if (requirement.status === newStatus) return;

    const confirmMsg = `Are you sure you want to update status of Enquiry "${requirement.requirementNo}" to ${newStatus.replace('_', ' ').toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(requirement._id);
    try {
      const res = await updateRequirementStatus(requirement._id, newStatus);
      if (res.success) {
        setRequirements((prev) =>
          prev.map((r) => (r._id === requirement._id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.message || 'Failed to update requirement status');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter logic
  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      // Status filter
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && req.type !== typeFilter) return false;

      // Party filter
      if (partyFilter !== 'all') {
        const partyId = typeof req.client === 'object' ? req.client?._id : req.client;
        if (partyId !== partyFilter) return false;
      }

      // Search term filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const reqNo = (req.requirementNo || '').toLowerCase();
      const partyName = typeof req.client === 'object' ? (req.client?.companyName || '').toLowerCase() : '';
      const partyCode = typeof req.client === 'object' ? (req.client?.clientCode || '').toLowerCase() : '';
      const itemName = typeof req.item === 'object' ? (req.item?.itemName || '').toLowerCase() : '';
      const serviceDesc = (req.serviceDescription || '').toLowerCase();
      const remarks = (req.remarks || '').toLowerCase();

      return (
        reqNo.includes(term) ||
        partyName.includes(term) ||
        partyCode.includes(term) ||
        itemName.includes(term) ||
        serviceDesc.includes(term) ||
        remarks.includes(term)
      );
    });
  }, [requirements, searchTerm, statusFilter, typeFilter, partyFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const getStatusBadgeConfig = (st) => {
    switch (st) {
      case 'draft':
        return { label: 'Draft', badgeStatus: 'draft' };
      case 'quotation_pending':
        return { label: 'Quotation Pending', badgeStatus: 'pending' };
      case 'quoted':
        return { label: 'Quoted', badgeStatus: 'info' };
      case 'follow_up':
        return { label: 'Follow Up', badgeStatus: 'warning' };
      case 'won':
        return { label: 'Won', badgeStatus: 'active' };
      case 'lost':
        return { label: 'Lost', badgeStatus: 'inactive' };
      case 'cancelled':
        return { label: 'Cancelled', badgeStatus: 'cancelled' };
      default:
        return { label: st || 'Unknown', badgeStatus: 'neutral' };
    }
  };

  const columns = [
    {
      key: 'requirementNo',
      header: 'Enquiry No',
      width: '140px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'requirementDate',
      header: 'Date',
      width: '110px',
      render: (val) => (
        <span style={{ color: 'var(--neutral-700)', fontSize: '12.5px' }}>
          {formatDate(val)}
        </span>
      ),
    },
    {
      key: 'client',
      header: 'Party / Customer',
      width: '220px',
      render: (val) => {
        const partyObj = typeof val === 'object' ? val : null;
        if (!partyObj) return <span className="text-muted">—</span>;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <strong style={{ color: 'var(--neutral-900)' }}>{partyObj.companyName}</strong>
            <span style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
              {partyObj.clientCode} {partyObj.city ? `• ${partyObj.city}` : ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'requirement',
      header: 'Requirement Summary',
      width: '280px',
      render: (_, row) => {
        if (row.type === 'service') {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>Service Enquiry</span>
              <span style={{ fontSize: '12px', color: 'var(--neutral-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                {row.serviceDescription || 'Custom service requested'}
              </span>
            </div>
          );
        }

        const itemObj = typeof row.item === 'object' ? row.item : null;
        const uomObj = typeof row.uom === 'object' ? row.uom : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
              {itemObj ? itemObj.itemName : 'Custom Air Filter Requirement'}
            </span>
            <div style={{ fontSize: '12px', color: 'var(--neutral-600)', display: 'flex', gap: '8px' }}>
              {row.quantity !== null && (
                <span>
                  Qty: <strong>{row.quantity}</strong> {uomObj ? uomObj.uomCode : ''}
                </span>
              )}
              {row.dimensions && (row.dimensions.length || row.dimensions.width) && (
                <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                  Dim: {row.dimensions.length || '—'}×{row.dimensions.width || '—'} {row.dimensions.unit || 'mm'}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      render: (val, row) => {
        const config = getStatusBadgeConfig(val);

        if (!canEdit) {
          return <StatusBadge status={config.badgeStatus} label={config.label} />;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusBadge status={config.badgeStatus} label={config.label} />
            <Select
              value={val}
              onChange={(e) => handleStatusChange(row, e.target.value)}
              disabled={actionLoading === row._id}
              style={{
                fontSize: '11px',
                padding: '2px 4px',
                height: '24px',
                width: 'auto',
                minWidth: '22px',
                borderRadius: '4px',
                borderColor: 'var(--neutral-300)',
              }}
              title="Quick status transition"
            >
              <option value="draft">Draft</option>
              <option value="quotation_pending">Quotation Pending</option>
              <option value="quoted">Quoted</option>
              <option value="follow_up">Follow Up</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
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
      width: '160px',
      render: (_, row) => (
        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedRequirement(row);
              setIsDetailOpen(true);
            }}
          >
            View
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => {
                setEditingRequirement(row);
                setIsFormOpen(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Requirement / Enquiry"
        description="Record and track customer air filter requirements, specifications, and quotation eligibility."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Commercial' },
          { label: 'Requirement / Enquiry' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchRequirementsData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingRequirement(null);
                  setIsFormOpen(true);
                }}
              >
                + New Enquiry
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="card">
        {/* Toolbar Controls & Filtering */}
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search size={16} />
            <Input
              placeholder="Search by Enquiry No, Party name/code, item name, or service description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} className="text-muted" />

            {/* Party Filter Dropdown */}
            <Select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="all">All Parties</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </Select>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="all">All Types</option>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="quotation_pending">Quotation Pending</option>
              <option value="quoted">Quoted</option>
              <option value="follow_up">Follow Up</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>

        {/* ERP Data Table Component */}
        <DataTable
          columns={columns}
          data={filteredRequirements}
          loading={loading}
          emptyTitle="No Requirement / Enquiry records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || partyFilter !== 'all'
              ? 'Try adjusting your search criteria or filter selections.'
              : 'Click "+ New Enquiry" above to record customer requirement.'
          }
        />

        {/* Footer Summary */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>
            Showing {filteredRequirements.length} of {requirements.length} total Enquiry records
          </span>
          <span>
            Access Rights: {canEdit ? 'Full Edit & Workflow Control' : canCreate ? 'Create & View Access' : 'Read Only'}
          </span>
        </div>
      </div>

      {/* Modals */}
      <RequirementFormModal
        requirement={editingRequirement}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchRequirementsData}
      />

      <RequirementDetailModal
        requirement={selectedRequirement}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(req) => {
          setEditingRequirement(req);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default RequirementList;
