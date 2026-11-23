import React, { useState, useMemo } from 'react';
import { useGetInvoicesQuery } from '../../features/accounts/accountsApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import InvoiceCreateModal from './InvoiceCreateModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import {
  Receipt,
  FileText,
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowDownLeft,
} from 'lucide-react';

const InvoiceList = () => {
  const [activeTab, setActiveTab] = useState('SALES');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: responseData, isLoading, isError, refetch } = useGetInvoicesQuery({
    invoiceType: activeTab,
    paymentStatus: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined,
    search: searchTerm || undefined,
    page,
    limit: 50,
  });

  const invoices = responseData?.data || [];

  // Metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let unpaidCount = 0;

    for (const inv of invoices) {
      if (inv.status !== 'CANCELLED') {
        totalInvoiced += inv.totalAmount || 0;
        totalPaid += inv.paidAmount || 0;
        totalOutstanding += inv.balanceAmount || 0;
        if (inv.paymentStatus === 'UNPAID') unpaidCount++;
      }
    }

    return { totalInvoiced, totalPaid, totalOutstanding, unpaidCount };
  }, [invoices]);

  const columns = [
    {
      header: 'Invoice No',
      accessor: 'invoiceNo',
      cell: (row) => (
        <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <Receipt className="h-4 w-4 text-primary-600" />
          <span>{row.invoiceNo}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'invoiceDate',
      cell: (row) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      header: activeTab === 'SALES' ? 'Customer' : 'Supplier',
      accessor: 'party',
      cell: (row) => (
        <div>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {row.partySnapshot?.name || row.party?.clientName || row.party?.supplierName || 'N/A'}
          </span>
          <span className="text-xs text-neutral-400 block">{row.partySnapshot?.code || row.partySnapshot?.gstin}</span>
        </div>
      ),
    },
    {
      header: 'Total (₹)',
      accessor: 'totalAmount',
      cell: (row) => (
        <div className="text-right font-bold text-neutral-900 dark:text-neutral-100">
          ₹{row.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: 'Paid (₹)',
      accessor: 'paidAmount',
      cell: (row) => (
        <div className="text-right text-emerald-600 font-medium text-xs">
          ₹{row.paidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: 'Balance (₹)',
      accessor: 'balanceAmount',
      cell: (row) => (
        <div className="text-right font-bold text-primary-600">
          ₹{row.balanceAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: 'Payment Status',
      accessor: 'paymentStatus',
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.paymentStatus === 'PAID'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : row.paymentStatus === 'PARTIALLY_PAID'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {row.paymentStatus?.replace('_', ' ')}
        </span>
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
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setSelectedInvoiceId(row._id);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Billing"
        subtitle="Customer sales billing, vendor purchase invoices, tax registers, and accounts balance tracking."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Invoice
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-4">
        <button
          onClick={() => {
            setActiveTab('SALES');
            setPage(1);
          }}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'SALES'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Sales Invoices (Receivables)
        </button>
        <button
          onClick={() => {
            setActiveTab('PURCHASE');
            setPage(1);
          }}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'PURCHASE'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Purchase Bills (Payables)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Total Billed</p>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
              ₹{metrics.totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">{invoices.length} invoices registered</p>
          </div>
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 rounded-xl">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Collected / Paid</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              ₹{metrics.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Cleared through bank</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Outstanding Balance</p>
            <h3 className="text-2xl font-bold text-primary-600 mt-1">
              ₹{metrics.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Due for reconciliation</p>
          </div>
          <div className="p-3 bg-primary-50 dark:bg-primary-950 text-primary-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Unpaid Invoices</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.unpaidCount}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Awaiting full payment</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Invoice No, Party Name, SO Ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Payment:</span>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Payment States</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {isError && (
        <Alert
          variant="error"
          message="Failed to load invoices. Ensure backend is running and you have access permissions."
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: responseData?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />

      {/* Modals */}
      <InvoiceCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <InvoiceDetailModal
        isOpen={isDetailOpen}
        invoiceId={selectedInvoiceId}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedInvoiceId(null);
        }}
      />
    </div>
  );
};

export default InvoiceList;
