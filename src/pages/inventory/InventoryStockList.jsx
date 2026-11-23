import React, { useState, useMemo } from 'react';
import { useGetInventoryStocksQuery } from '../../features/inventory/inventoryApi';
import { useGetPlantsQuery } from '../../features/masterData/masterDataApi';
import { useGetStoresQuery } from '../../features/stores/storesApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import StockTransferModal from './StockTransferModal';
import StockAdjustmentModal from './StockAdjustmentModal';
import {
  Package,
  Layers,
  ArrowRightLeft,
  SlidersHorizontal,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  Building2,
  FolderTree,
} from 'lucide-react';

const InventoryStockList = () => {
  const { hasPermission } = useAuth();
  const canTransfer = hasPermission('INVENTORY_STOCK_TRANSFER') || hasPermission('STORE_EDIT');
  const canAdjust = hasPermission('INVENTORY_STOCK_ADJUST') || hasPermission('STORE_EDIT');

  // Query Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [plantFilter, setPlantFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  // Modals
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedStockRow, setSelectedStockRow] = useState(null);

  const queryParams = useMemo(() => {
    const params = {};
    if (plantFilter !== 'all') params.plant = plantFilter;
    if (storeFilter !== 'all') params.store = storeFilter;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    return params;
  }, [plantFilter, storeFilter, searchTerm]);

  const {
    data: stockData,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useGetInventoryStocksQuery(queryParams);

  const { data: plantData } = useGetPlantsQuery({ status: 'active' });
  const { data: storeData } = useGetStoresQuery();

  const plants = plantData?.plants || [];
  const stores = storeData?.stores || [];
  const rawStocks = stockData?.stocks || [];

  // Client-side filtering for status
  const stocks = useMemo(() => {
    return rawStocks.filter((s) => {
      const qty = Number(s.quantity) || 0;
      if (stockStatusFilter === 'in_stock') return qty > 10;
      if (stockStatusFilter === 'low_stock') return qty > 0 && qty <= 10;
      if (stockStatusFilter === 'out_of_stock') return qty === 0;
      return true;
    });
  }, [rawStocks, stockStatusFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    let totalQty = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const uniqueItems = new Set();

    rawStocks.forEach((s) => {
      const q = Number(s.quantity) || 0;
      totalQty += q;
      if (s.item?._id) uniqueItems.add(s.item._id);
      if (q === 0) outOfStockCount++;
      else if (q <= 10) lowStockCount++;
    });

    return {
      totalItems: uniqueItems.size,
      totalQuantity: totalQty,
      lowStockCount,
      outOfStockCount,
    };
  }, [rawStocks]);

  const columns = useMemo(
    () => [
      {
        key: 'item',
        header: 'Material / Product',
        sortable: true,
        render: (_, row) => (
          <div>
            <div className="font-semibold text-slate-900">{row.item?.itemName || 'Unnamed Item'}</div>
            <div className="text-xs font-mono text-slate-500">{row.item?.itemCode || 'No Code'}</div>
          </div>
        ),
      },
      {
        key: 'location',
        header: 'Plant & Store',
        render: (_, row) => (
          <div className="text-sm">
            <div className="font-medium text-slate-800">{row.store?.storeName || 'Store N/A'}</div>
            <div className="text-xs text-slate-500">{row.plant?.plantName || 'Plant N/A'}</div>
          </div>
        ),
      },
      {
        key: 'bin',
        header: 'Storage Bin',
        render: (_, row) => (
          <div className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded inline-block">
            {row.bin?.binCode || row.storageLocation?.locationCode || 'BIN-N/A'}
          </div>
        ),
      },
      {
        key: 'quantity',
        header: 'Stock On Hand',
        sortable: true,
        render: (val, row) => {
          const qty = Number(val) || 0;
          const uom = row.uom?.uomCode || '';
          let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          if (qty === 0) badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
          else if (qty <= 10) badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';

          return (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold rounded border ${badgeColor}`}>
                {qty} {uom}
              </span>
              {qty <= 10 && qty > 0 && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Low Stock Threshold" />
              )}
            </div>
          );
        },
      },
      {
        key: 'reservedQuantity',
        header: 'Reserved / Available',
        render: (_, row) => {
          const onHand = Number(row.quantity) || 0;
          const reserved = Number(row.reservedQuantity) || 0;
          const available = Math.max(0, onHand - reserved);
          return (
            <div className="text-xs text-slate-600">
              <div>Reserved: <span className="font-medium text-slate-800">{reserved}</span></div>
              <div>Available: <span className="font-semibold text-emerald-700">{available}</span></div>
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (_, row) => (
          <div className="flex justify-end gap-1.5">
            {canTransfer && (
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRightLeft}
                onClick={() => {
                  setSelectedStockRow(row);
                  setIsTransferOpen(true);
                }}
                title="Transfer stock to another bin/store"
              >
                Transfer
              </Button>
            )}
            {canAdjust && (
              <Button
                variant="ghost"
                size="sm"
                icon={SlidersHorizontal}
                onClick={() => {
                  setSelectedStockRow(row);
                  setIsAdjustOpen(true);
                }}
                title="Perform physical stock adjustment"
              >
                Adjust
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canTransfer, canAdjust]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Balances"
        subtitle="Real-time stock on hand, bin distribution, reservations, and inventory valuation."
        icon={Package}
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
            {canTransfer && (
              <Button
                variant="outline"
                icon={ArrowRightLeft}
                onClick={() => {
                  setSelectedStockRow(null);
                  setIsTransferOpen(true);
                }}
              >
                Transfer Stock
              </Button>
            )}
            {canAdjust && (
              <Button
                variant="primary"
                icon={SlidersHorizontal}
                onClick={() => {
                  setSelectedStockRow(null);
                  setIsAdjustOpen(true);
                }}
              >
                Adjust Stock
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalItems}</div>
            <div className="text-xs text-slate-500 font-medium">Unique Items Tracked</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalQuantity.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-medium">Total Quantity In Stock</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{metrics.lowStockCount}</div>
            <div className="text-xs text-slate-500 font-medium">Low Stock Alerts (&le; 10 units)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{metrics.outOfStockCount}</div>
            <div className="text-xs text-slate-500 font-medium">Out of Stock Bins</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="w-64">
            <Input
              icon={Search}
              placeholder="Search by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-44">
            <Select value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)}>
              <option value="all">All Plants</option>
              {plants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.plantCode}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-48">
            <Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
              <option value="all">All Stores</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.storeName}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-44">
            <Select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt; 10)</option>
              <option value="low_stock">Low Stock (&le; 10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {queryError && (
        <Alert
          type="error"
          message={queryError?.data?.message || queryError?.message || 'Failed to fetch inventory stock'}
        />
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={stocks}
          loading={isLoading}
          emptyMessage="No inventory stock records found matching current filters."
        />
      </div>

      {/* Modals */}
      {isTransferOpen && (
        <StockTransferModal
          isOpen={isTransferOpen}
          onClose={() => {
            setIsTransferOpen(false);
            setSelectedStockRow(null);
          }}
          preselectedStock={selectedStockRow}
        />
      )}

      {isAdjustOpen && (
        <StockAdjustmentModal
          isOpen={isAdjustOpen}
          onClose={() => {
            setIsAdjustOpen(false);
            setSelectedStockRow(null);
          }}
          preselectedStock={selectedStockRow}
        />
      )}
    </div>
  );
};

export default InventoryStockList;
