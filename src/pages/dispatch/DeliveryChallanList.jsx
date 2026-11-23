import React, { useState, useMemo } from 'react';
import { useGetDeliveryChallansQuery } from '../../features/dispatch/dispatchApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import DeliveryChallanCreateModal from './DeliveryChallanCreateModal';
import DeliveryChallanDetailModal from './DeliveryChallanDetailModal';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';

const DeliveryChallanList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedChallanId, setSelectedChallanId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: responseData, isLoading, isError, refetch } = useGetDeliveryChallansQuery({
    page,
    limit: 50,
    search: searchTerm || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const challans = responseData?.data || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = challans.length;
    const drafts = challans.filter((c) => c.status === 'DRAFT').length;
    const dispatched = challans.filter((c) => c.status === 'DISPATCHED').length;
    const delivered = challans.filter((c) => c.status === 'DELIVERED').length;
    const totalQuantity = challans.reduce((sum, c) => sum + (c.totalQuantity || 0), 0);
    return { total, drafts, dispatched, delivered, totalQuantity };
  }, [challans]);

  const columns = [
    {
      header: 'Challan No',
      accessor: 'challanNo',
      cell: (row) => (
        <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-primary-600" />
          <span>{row.challanNo}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'challanDate',
      cell: (row) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {row.challanDate ? new Date(row.challanDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      header: 'Client',
      accessor: 'client',
      cell: (row) => (
        <div>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {row.clientSnapshot?.name || row.client?.clientName || row.client?.name || 'N/A'}
          </span>
          <span className="text-xs text-neutral-400 block">{row.clientSnapshot?.code || row.client?.clientCode}</span>
        </div>
      ),
    },
    {
      header: 'Sales Order',
      accessor: 'salesOrderNoSnapshot',
      cell: (row) => (
        <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
          {row.salesOrderNoSnapshot || row.salesOrder?.salesOrderNo || 'Direct'}
        </span>
      ),
    },
    {
      header: 'Transporter / Vehicle',
      accessor: 'vehicleNo',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {row.transporterName || 'Self'}
          </span>
          {row.vehicleNo && <span className="text-neutral-400 block">{row.vehicleNo}</span>}
        </div>
      ),
    },
    {
      header: 'Total Qty',
      accessor: 'totalQuantity',
      cell: (row) => (
        <div className="text-right font-bold text-neutral-900 dark:text-neutral-100">
          {row.totalQuantity} <span className="text-xs font-normal text-neutral-500">units</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedChallanId(row._id);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Challans"
        subtitle="Manage dispatch manifests, outbound shipping, transport logistics, and finished goods fulfillment."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Challan
            </Button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Total Challans</p>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{metrics.total}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{metrics.totalQuantity} total units dispatched</p>
          </div>
          <div className="p-3 bg-primary-50 dark:bg-primary-950 text-primary-600 rounded-xl">
            <Truck className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Draft Manifests</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.drafts}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Pending dispatch authorization</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">In Transit</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{metrics.dispatched}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Goods shipped to clients</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Delivered</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.delivered}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Successfully fulfilled</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Challan No, Client, Vehicle, LR No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isError && (
        <Alert
          variant="error"
          message="Failed to load Delivery Challans. Please ensure you have sufficient permissions and backend is running."
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={challans}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: responseData?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />

      {/* Create Modal */}
      <DeliveryChallanCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Detail Modal */}
      <DeliveryChallanDetailModal
        isOpen={isDetailOpen}
        challanId={selectedChallanId}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedChallanId(null);
        }}
      />
    </div>
  );
};

export default DeliveryChallanList;
