import React, { useState } from 'react';
import {
  useGetPaymentsQuery,
  useGetOutstandingSummaryQuery,
} from '../../features/accounts/accountsApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import {
  CreditCard,
  IndianRupee,
  RefreshCw,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Building,
  CheckCircle,
} from 'lucide-react';

const PaymentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data: responseData, isLoading, isError, refetch } = useGetPaymentsQuery({
    paymentType: typeFilter !== 'ALL' ? typeFilter : undefined,
    search: searchTerm || undefined,
    page,
    limit: 50,
  });

  const { data: summaryData, refetch: refetchSummary } = useGetOutstandingSummaryQuery();

  const payments = responseData?.data || [];
  const summary = summaryData?.data;

  const columns = [
    {
      header: 'Payment No',
      accessor: 'paymentNo',
      cell: (row) => (
        <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 font-mono">
          <CreditCard className="h-4 w-4 text-primary-600" />
          <span>{row.paymentNo}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'paymentDate',
      cell: (row) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: 'paymentType',
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            row.paymentType === 'RECEIPT'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {row.paymentType === 'RECEIPT' ? (
            <>
              <ArrowDownLeft className="h-3 w-3" /> Customer Receipt
            </>
          ) : (
            <>
              <ArrowUpRight className="h-3 w-3" /> Vendor Payment
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Invoice Ref',
      accessor: 'invoiceNoSnapshot',
      cell: (row) => (
        <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
          {row.invoiceNoSnapshot || row.invoice?.invoiceNo || 'INV-REF'}
        </span>
      ),
    },
    {
      header: 'Party',
      accessor: 'partyNameSnapshot',
      cell: (row) => (
        <div>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {row.partyNameSnapshot || row.party?.clientName || row.party?.supplierName || 'Party'}
          </span>
          <span className="text-xs text-neutral-400 block">{row.partyType}</span>
        </div>
      ),
    },
    {
      header: 'Mode & Ref',
      accessor: 'paymentMode',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {row.paymentMode?.replace('_', ' ')}
          </span>
          {row.transactionReference && (
            <span className="text-neutral-400 block font-mono">{row.transactionReference}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Amount (₹)',
      accessor: 'amount',
      cell: (row) => (
        <div
          className={`text-right font-bold text-sm ${
            row.paymentType === 'RECEIPT' ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          ₹{row.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Ledger"
        subtitle="Complete chronological transaction ledger of customer payment receipts and vendor disbursements."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              refetchSummary();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        }
      />

      {/* Outstanding Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Receivables Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" /> Accounts Receivable (From Customers)
            </h4>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
              {summary?.receivables?.invoiceCount || 0} Invoices
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-sm">
            <div>
              <span className="text-xs text-neutral-500 block">Total Billed</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                ₹{summary?.receivables?.invoiced?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Collected</span>
              <span className="font-semibold text-emerald-600">
                ₹{summary?.receivables?.collected?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Net Outstanding</span>
              <span className="font-bold text-primary-600">
                ₹{summary?.receivables?.outstanding?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Payables Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 dark:border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-amber-600" /> Accounts Payable (To Suppliers)
            </h4>
            <span className="text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              {summary?.payables?.invoiceCount || 0} Bills
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-sm">
            <div>
              <span className="text-xs text-neutral-500 block">Total Billed</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                ₹{summary?.payables?.invoiced?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Disbursed</span>
              <span className="font-semibold text-amber-600">
                ₹{summary?.payables?.disbursed?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Net Payable</span>
              <span className="font-bold text-red-600">
                ₹{summary?.payables?.outstanding?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Payment No, Invoice No, Party, UTR No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Transactions</option>
            <option value="RECEIPT">Customer Receipts Only</option>
            <option value="PAYMENT">Vendor Payments Only</option>
          </select>
        </div>
      </div>

      {isError && (
        <Alert
          variant="error"
          message="Failed to load payments ledger. Ensure backend is running and you have access permissions."
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: responseData?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};

export default PaymentList;
