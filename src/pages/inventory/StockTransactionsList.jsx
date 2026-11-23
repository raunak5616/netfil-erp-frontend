import React, { useState, useMemo } from 'react';
import { useGetStockTransactionsQuery } from '../../features/inventory/inventoryApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import {
  History,
  RefreshCw,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

const StockTransactionsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const queryParams = useMemo(() => {
    const params = {};
    if (typeFilter !== 'all') params.transactionType = typeFilter;
    if (searchTerm.trim()) params.transactionNo = searchTerm.trim();
    return params;
  }, [typeFilter, searchTerm]);

  const {
    data: txnData,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useGetStockTransactionsQuery(queryParams);

  const transactions = txnData?.transactions || [];

  const getTypeBadge = (type) => {
    switch (type) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3" /> Receipt (Inward)
          </span>
        );
      case 'issue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3 h-3" /> Issue (Outward)
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ArrowRightLeft className="w-3 h-3" /> Transfer
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <SlidersHorizontal className="w-3 h-3" /> Adjustment
          </span>
        );
      case 'opening_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <Sparkles className="w-3 h-3" /> Opening Stock
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 uppercase">
            {type}
          </span>
        );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'transactionNo',
        header: 'Txn #',
        sortable: true,
        render: (val) => <span className="font-mono font-semibold text-slate-800">{val}</span>,
      },
      {
        key: 'createdAt',
        header: 'Date & Time',
        sortable: true,
        render: (val) => (
          <div className="text-xs text-slate-600">
            {val ? new Date(val).toLocaleString() : 'N/A'}
          </div>
        ),
      },
      {
        key: 'transactionType',
        header: 'Movement Type',
        render: (val) => getTypeBadge(val),
      },
      {
        key: 'item',
        header: 'Material / Item',
        render: (_, row) => (
          <div>
            <div className="font-medium text-slate-800">{row.item?.itemName || 'Item N/A'}</div>
            <div className="text-xs font-mono text-slate-500">{row.item?.itemCode}</div>
          </div>
        ),
      },
      {
        key: 'quantity',
        header: 'Quantity',
        sortable: true,
        render: (val, row) => (
          <span className="font-bold text-slate-900">
            {val} {row.uom?.uomCode || ''}
          </span>
        ),
      },
      {
        key: 'fromTo',
        header: 'Movement Route',
        render: (_, row) => {
          const fromBin = row.fromBin?.binCode || row.fromStorageLocation?.locationCode || (row.fromStore ? row.fromStore.storeName : null);
          const toBin = row.toBin?.binCode || row.toStorageLocation?.locationCode || (row.toStore ? row.toStore.storeName : null);

          if (fromBin && toBin) {
            return (
              <div className="text-xs flex items-center gap-1.5 font-mono">
                <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{fromBin}</span>
                <span className="text-slate-400">&rarr;</span>
                <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-semibold">{toBin}</span>
              </div>
            );
          }
          if (toBin) {
            return (
              <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                In: {toBin}
              </div>
            );
          }
          if (fromBin) {
            return (
              <div className="text-xs font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                Out: {fromBin}
              </div>
            );
          }
          return <span className="text-slate-400 text-xs">Direct update</span>;
        },
      },
      {
        key: 'reference',
        header: 'Ref Document',
        render: (_, row) => (
          <div className="text-xs">
            {row.referenceId ? (
              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {row.referenceId}
              </span>
            ) : (
              <span className="text-slate-400">—</span>
            )}
            {row.referenceType && (
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{row.referenceType}</div>
            )}
          </div>
        ),
      },
      {
        key: 'remarks',
        header: 'Remarks',
        render: (val) => <span className="text-xs text-slate-500 italic">{val || '—'}</span>,
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Stock Movement Ledger"
        subtitle="Complete chronological audit trail of all receipts, issues, transfers, and inventory adjustments."
        icon={History}
        actions={
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            Refresh Ledger
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="w-64">
          <Input
            icon={Search}
            placeholder="Search Txn #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-48">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Movement Types</option>
            <option value="receipt">Receipts (Inward)</option>
            <option value="issue">Issues (Outward)</option>
            <option value="transfer">Inter-Bin Transfers</option>
            <option value="adjustment">Adjustments</option>
            <option value="opening_stock">Opening Stock</option>
          </Select>
        </div>
      </div>

      {queryError && (
        <Alert
          type="error"
          message={queryError?.data?.message || queryError?.message || 'Failed to fetch transactions'}
        />
      )}

      {/* Transactions Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={transactions}
          loading={isLoading}
          emptyMessage="No stock transactions recorded yet."
        />
      </div>
    </div>
  );
};

export default StockTransactionsList;
