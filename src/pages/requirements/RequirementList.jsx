import React, { useState, useMemo } from 'react';
import { useGetRequirementsQuery } from '../../features/requirements/requirementsApi';
import { useGetClientsQuery } from '../../features/masterData/masterDataApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select, AsyncSelect } from '../../components/ui/FormField';
import RequirementFormModal from './RequirementFormModal';
import RequirementDetailModal from './RequirementDetailModal';
import QuotationFormModal from '../quotations/QuotationFormModal';
import QuotationDetailModal from '../quotations/QuotationDetailModal';
import QuotationAmendmentModal from '../quotations/QuotationAmendmentModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw, 
  FileText, 
  FileDiff
} from 'lucide-react';

const RequirementList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('REQUIREMENT_CREATE');
  const canEdit = hasPermission('REQUIREMENT_EDIT');

  const { data: reqsData, isLoading: reqsLoading, error: reqsError, refetch: refetchReqs } = useGetRequirementsQuery();
  const { data: clientsData, isLoading: clientsLoading } = useGetClientsQuery();

  const loading = reqsLoading || clientsLoading;
  const [error, setError] = useState('');

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

  // Quotation Modal state
  const [isQuotationFormOpen, setIsQuotationFormOpen] = useState(false);
  const [quotationRequirement, setQuotationRequirement] = useState(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [isQuotationDetailOpen, setIsQuotationDetailOpen] = useState(false);
  const [amendmentTargetQuotation, setAmendmentTargetQuotation] = useState(null);
  const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);

  const requirements = useMemo(() => {
    return reqsData?.requirements || (Array.isArray(reqsData) ? reqsData : []);
  }, [reqsData]);

  const clients = useMemo(() => {
    return clientsData?.clients || (Array.isArray(clientsData) ? clientsData : []);
  }, [clientsData]);

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

  const loadClientOptions = async (inputValue) => {
    const term = (inputValue || '').toLowerCase();
    const filtered = clients.filter((c) => {
      const name = (c.companyName || '').toLowerCase();
      const code = (c.clientCode || '').toLowerCase();
      return !term || name.includes(term) || code.includes(term);
    });
    return filtered.map((c) => ({
      value: c._id,
      label: c.companyName,
      secondaryLabel: c.clientCode,
    }));
  };

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
      case 'under_revision':
        return { label: 'Under Revision', badgeStatus: 'warning' };
      case 'follow_up':
        return { label: 'Follow Up', badgeStatus: 'warning' };
      case 'won':
        return { label: 'Won', badgeStatus: 'active' };
      case 'lost':
        return { label: 'Lost', badgeStatus: 'inactive' };
      case 'cancelled':
        return { label: 'Cancelled', badgeStatus: 'cancelled' };
      case 'closed':
        return { label: 'Closed', badgeStatus: 'neutral' };
      default:
        return { label: st || 'Unknown', badgeStatus: 'neutral' };
    }
  };

  const getQuotationBadgeStatus = (st) => {
    switch (st) {
      case 'draft': return 'draft';
      case 'sent':
      case 'released': return 'info';
      case 'won':
      case 'accepted':
      case 'converted': return 'active';
      case 'lost':
      case 'rejected': return 'inactive';
      case 'cancelled': return 'cancelled';
      case 'completed': return 'success';
      default: return 'neutral';
    }
  };

  const columns = [
    {
      key: 'requirementNo',
      header: 'Enquiry No',
      width: '125px',
      minWidth: '125px',
      render: (val) => (
        <span className="font-mono font-bold whitespace-nowrap text-blue-700 text-xs">
          {val}
        </span>
      ),
    },
    {
      key: 'requirementDate',
      header: 'Date',
      width: '100px',
      minWidth: '100px',
      render: (val) => (
        <span className="whitespace-nowrap text-slate-600 text-xs">
          {formatDate(val)}
        </span>
      ),
    },
    {
      key: 'client',
      header: 'Party / Customer',
      width: '200px',
      minWidth: '190px',
      render: (val) => {
        const partyObj = typeof val === 'object' ? val : null;
        if (!partyObj) return <span className="text-slate-400 italic text-xs">—</span>;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-900 font-semibold text-xs leading-snug">
              {partyObj.companyName}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 font-mono">
              <span className="whitespace-nowrap">{partyObj.clientCode}</span>
              {partyObj.city && <span className="whitespace-nowrap">• {partyObj.city}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'requirement',
      header: 'Requirement Summary',
      minWidth: '220px',
      render: (_, row) => {
        if (row.type === 'service') {
          return (
            <span className="text-xs text-slate-800 leading-snug font-medium" title={row.serviceDescription || 'Service Enquiry'}>
              {row.serviceDescription || 'Service Enquiry'}
            </span>
          );
        }

        const itemsArr = Array.isArray(row.items) && row.items.length > 0 ? row.items : null;

        if (itemsArr && itemsArr.length > 1) {
          return (
            <div className="flex flex-col gap-1 py-0.5">
              {itemsArr.map((it, idx) => {
                const name = (typeof it.item === 'object' ? it.item?.itemName : null) || it.itemName || it.description || `Item #${idx + 1}`;
                return (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-800 leading-snug">
                    <span className="font-semibold text-slate-400 shrink-0">{idx + 1}.</span>
                    <span className="font-medium text-slate-900">{name}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        // Single item
        const firstItem = itemsArr ? itemsArr[0] : row;
        const name = (typeof firstItem?.item === 'object' ? firstItem.item?.itemName : null) || firstItem?.itemName || firstItem?.description || (typeof row.item === 'object' ? row.item?.itemName : null) || 'Air Filter Requirement';

        return (
          <span className="text-xs font-medium text-slate-900 leading-snug">
            {name}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '115px',
      minWidth: '115px',
      render: (val) => {
        const config = getStatusBadgeConfig(val);
        return (
          <div className="whitespace-nowrap">
            <StatusBadge status={config.badgeStatus} label={config.label} />
          </div>
        );
      },
    },
    {
      key: 'linkedQuotation',
      header: 'Linked Quotation',
      width: '160px',
      minWidth: '160px',
      render: (_, row) => {
        const lq = row.linkedQuotation;
        if (!lq) {
          return <span className="text-slate-400 text-xs whitespace-nowrap italic">— Not Quoted</span>;
        }
        return (
          <div className="flex flex-col gap-1 whitespace-nowrap">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  setSelectedQuotationId(lq._id);
                  setIsQuotationDetailOpen(true);
                }}
                className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-xs cursor-pointer bg-transparent border-0 p-0 text-left whitespace-nowrap inline-block"
                title="View Quotation Details"
              >
                {lq.quotationNo}
              </button>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap inline-flex items-center">
                {lq.revisionLabel || 'Rev 00'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <StatusBadge status={getQuotationBadgeStatus(lq.status)} label={lq.status?.toUpperCase()} />
              {lq.salesOrder && (
                <span className="font-mono text-[10px] text-emerald-700 font-semibold whitespace-nowrap bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  SO: {lq.salesOrder.salesOrderNo}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '180px',
      minWidth: '180px',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
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
          {!row.linkedQuotation && hasPermission('QUOTATION_CREATE') && (
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={() => {
                setQuotationRequirement(row);
                setIsQuotationFormOpen(true);
              }}
              title="Create Quotation from this Enquiry"
            >
              Quote
            </Button>
          )}
          {row.linkedQuotation && row.linkedQuotation.status === 'released' && hasPermission('QUOTATION_AMEND') && (
            <Button
              variant="outline"
              size="sm"
              icon={FileDiff}
              onClick={() => {
                setAmendmentTargetQuotation(row.linkedQuotation);
                setIsAmendmentOpen(true);
              }}
              title="Amend Quotation"
            >
              Amend
            </Button>
          )}
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
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={refetchReqs}>
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
                New Enquiry
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Toolbar Controls & Filtering */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              className="pl-9 h-9 text-xs rounded-md"
              placeholder="Search by Enquiry No, Party name/code, item name, or service description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <Filter size={16} className="text-slate-400 shrink-0 hidden sm:block" />

            {/* Party Filter Dropdown */}
            <div className="w-full sm:w-[220px]">
              <AsyncSelect
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value || 'all')}
                loadOptions={loadClientOptions}
                placeholder="All Parties"
                initialLabel={partyFilter === 'all' ? 'All Parties' : undefined}
              />
            </div>

            {/* Type Filter */}
            <div className="w-[120px]">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[140px]">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="quotation_pending">Quotation Pending</option>
                <option value="quoted">Quoted</option>
                <option value="under_revision">Under Revision</option>
                <option value="follow_up">Follow Up</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
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
              : 'Click "New Enquiry" above to record customer requirement.'
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
        onSuccess={refetchReqs}
      />

      <RequirementDetailModal
        requirement={selectedRequirement}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(req) => {
          setEditingRequirement(req);
          setIsFormOpen(true);
        }}
        onCreateQuotation={(req) => {
          setQuotationRequirement(req);
          setIsQuotationFormOpen(true);
        }}
        onViewQuotation={(quote) => {
          setSelectedQuotationId(quote._id);
          setIsQuotationDetailOpen(true);
        }}
        onAmendQuotation={(quote) => {
          setAmendmentTargetQuotation(quote);
          setIsAmendmentOpen(true);
        }}
        canEdit={canEdit}
      />

      {isQuotationFormOpen && (
        <QuotationFormModal
          isOpen={isQuotationFormOpen}
          initialRequirement={quotationRequirement}
          onClose={() => {
            setIsQuotationFormOpen(false);
            setQuotationRequirement(null);
          }}
          onSuccess={() => {
            setIsQuotationFormOpen(false);
            setQuotationRequirement(null);
            refetchReqs();
          }}
        />
      )}

      {/* Quotation Detail Modal */}
      {isQuotationDetailOpen && selectedQuotationId && (
        <QuotationDetailModal
          isOpen={isQuotationDetailOpen}
          quotationId={selectedQuotationId}
          onClose={() => {
            setIsQuotationDetailOpen(false);
            setSelectedQuotationId(null);
          }}
          canEdit={hasPermission('QUOTATION_EDIT')}
          canRelease={hasPermission('QUOTATION_RELEASE')}
          canAmend={hasPermission('QUOTATION_AMEND')}
        />
      )}

      {/* Quotation Amendment Modal */}
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
            refetchReqs();
          }}
        />
      )}
    </div>
  );
};

export default RequirementList;
