import React, { useState, useMemo } from 'react';
import { useGetQualityInspectionsQuery } from '../../features/quality/qualityApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import QualityInspectionCreateModal from './QualityInspectionCreateModal';
import QualityInspectionDetailModal from './QualityInspectionDetailModal';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';

const QualityInspectionList = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('QUALITY_INSPECTION_CREATE') || true;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    return params;
  }, [statusFilter, searchTerm]);

  const {
    data: qiData,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useGetQualityInspectionsQuery(queryParams);

  const inspections = qiData?.qualityInspections || [];

  const filteredInspections = useMemo(() => {
    return inspections.filter((qi) => {
      if (resultFilter !== 'all' && qi.overallResult !== resultFilter) return false;
      return true;
    });
  }, [inspections, resultFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let pending = 0;
    inspections.forEach((qi) => {
      if (qi.overallResult === 'PASS' || qi.status === 'ACCEPTED') passed++;
      else if (qi.overallResult === 'FAIL' || qi.status === 'REJECTED') failed++;
      else pending++;
    });
    return { total: inspections.length, passed, failed, pending };
  }, [inspections]);

  const columns = useMemo(
    () => [
      {
        key: 'inspectionNumber',
        header: 'Inspection #',
        sortable: true,
        render: (val, row) => (
          <button
            type="button"
            className="font-mono font-bold text-blue-700 hover:underline text-left"
            onClick={() => {
              setSelectedInspectionId(row._id);
              setIsDetailOpen(true);
            }}
          >
            {val}
          </button>
        ),
      },
      {
        key: 'inspectionDate',
        header: 'Date',
        sortable: true,
        render: (val) => (
          <span className="text-xs text-slate-600">
            {val ? new Date(val).toLocaleDateString('en-GB') : '—'}
          </span>
        ),
      },
      {
        key: 'grnNumberSnapshot',
        header: 'GRN / PO Ref',
        render: (_, row) => (
          <div>
            <div className="font-mono text-xs font-semibold text-slate-800">
              {row.grnNumberSnapshot}
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              PO: {row.poNumberSnapshot}
            </div>
          </div>
        ),
      },
      {
        key: 'supplierNameSnapshot',
        header: 'Supplier',
        render: (val) => (
          <span className="text-sm font-medium text-slate-800">{val || '—'}</span>
        ),
      },
      {
        key: 'itemsCount',
        header: 'Lots / Items',
        align: 'center',
        render: (_, row) => (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
            {row.items?.length || 0} Lots
          </span>
        ),
      },
      {
        key: 'overallResult',
        header: 'QA Result',
        render: (val) => {
          let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          if (val === 'PASS') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          if (val === 'FAIL') badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';

          return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${badgeClass}`}>
              {val}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (val) => (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 uppercase">
            {val}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (_, row) => (
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedInspectionId(row._id);
              setIsDetailOpen(true);
            }}
          >
            Review
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quality Inspection & Assurance"
        subtitle="Incoming material QA, parameters verification, pass/fail decisions, and lot acceptance."
        icon={ShieldCheck}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => refetch()}
              isLoading={isFetching}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setIsCreateOpen(true)}
              >
                New Inspection
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
            <div className="text-xs text-slate-500 font-medium">Total Inspections</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{metrics.passed}</div>
            <div className="text-xs text-slate-500 font-medium">Approved / Passed</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{metrics.pending}</div>
            <div className="text-xs text-slate-500 font-medium">Pending / Under QA</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{metrics.failed}</div>
            <div className="text-xs text-slate-500 font-medium">Rejected Lots</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="w-64">
          <Input
            icon={Search}
            placeholder="Search Inspection # / GRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-48">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_INSPECTION">Under Inspection</option>
            <option value="INSPECTED">Inspected</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>

        <div className="w-44">
          <Select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
            <option value="all">All Results</option>
            <option value="PASS">Pass Only</option>
            <option value="FAIL">Fail Only</option>
            <option value="PARTIAL">Partial Only</option>
            <option value="PENDING">Pending Only</option>
          </Select>
        </div>
      </div>

      {queryError && (
        <Alert
          type="error"
          message={queryError?.data?.message || queryError?.message || 'Failed to fetch inspections'}
        />
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredInspections}
          loading={isLoading}
          emptyMessage="No quality inspection records found."
        />
      </div>

      {/* Modals */}
      {isCreateOpen && (
        <QualityInspectionCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {isDetailOpen && selectedInspectionId && (
        <QualityInspectionDetailModal
          isOpen={isDetailOpen}
          inspectionId={selectedInspectionId}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInspectionId(null);
          }}
          onUpdated={() => refetch()}
        />
      )}
    </div>
  );
};

export default QualityInspectionList;
