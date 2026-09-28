import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getSupplierById,
  getSupplierPurchaseSummary,
  getSupplierPurchaseHistory,
  getSupplierItemPriceHistory
} from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import DataTable from '../../components/ui/DataTable';
import { Input, Select } from '../../components/ui/FormField';
import {
  ArrowLeft,
  Edit,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  Calendar,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Search,
  Filter,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink
} from 'lucide-react';

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('SUPPLIER_EDIT') || hasPermission('PARTY_EDIT');

  // Core Supplier State
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab State: 'overview' | 'history' | 'price-history'
  const [activeTab, setActiveTab] = useState('overview');

  // Calculated Summary State
  const [summary, setSummary] = useState(null);

  // Tab 2: Purchase History State
  const [historyPOs, setHistoryPOs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  // Tab 3: Item Price History State
  const [priceItems, setPriceItems] = useState([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceSearch, setPriceSearch] = useState('');
  const [expandedItemKey, setExpandedItemKey] = useState(null);

  // Fetch Supplier Details
  const fetchSupplierDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSupplierById(id);
      if (res.success && res.supplier) {
        setSupplier(res.supplier);
      } else {
        setError('Supplier record not found.');
      }
    } catch (err) {
      console.error('Failed to load supplier details:', err);
      setError(err.response?.data?.message || 'Error loading supplier details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Summary Calculations
  const fetchSummary = async () => {
    try {
      const res = await getSupplierPurchaseSummary(id);
      if (res.success && res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load purchase summary:', err);
    }
  };

  // Fetch Purchase Orders History
  const fetchPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (historyStatusFilter !== 'all') params.status = historyStatusFilter;
      if (historySearch) params.search = historySearch;

      const res = await getSupplierPurchaseHistory(id, params);
      if (res.success && Array.isArray(res.purchaseOrders)) {
        setHistoryPOs(res.purchaseOrders);
      }
    } catch (err) {
      console.error('Failed to load purchase history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Item Price History
  const fetchItemPriceHistory = async () => {
    setPriceLoading(true);
    try {
      const params = {};
      if (priceSearch) params.search = priceSearch;
      const res = await getSupplierItemPriceHistory(id, params);
      if (res.success && Array.isArray(res.items)) {
        setPriceItems(res.items);
      }
    } catch (err) {
      console.error('Failed to load item price history:', err);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierDetails();
    fetchSummary();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPurchaseHistory();
    } else if (activeTab === 'price-history') {
      fetchItemPriceHistory();
    }
  }, [id, activeTab, historyStatusFilter, historySearch, priceSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading supplier details...</span>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="space-y-4">
        <Alert type="danger" message={error || 'Supplier record not found.'} />
        <Button variant="secondary" size="sm" onClick={() => navigate('/suppliers')}>
          <ArrowLeft size={14} className="mr-1.5" /> Back to Suppliers
        </Button>
      </div>
    );
  }

  // Format Currency (INR)
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amt || 0);
  };

  // Format Date
  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* SIMPLE PAGE HEADER */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>Supplier: {supplier.supplierName}</span>
            <StatusBadge status={supplier.status} />
          </div>
        }
        subtitle={`Supplier Code: ${supplier.supplierCode} | ${supplier.legalName ? `Legal: ${supplier.legalName}` : 'Procurement Master'}`}
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Suppliers', path: '/suppliers' },
          { label: supplier.supplierCode },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/suppliers')}>
              <ArrowLeft size={14} className="mr-1.5" /> Back
            </Button>
            {canEdit && (
              <Button variant="primary" size="sm" onClick={() => navigate(`/suppliers/${id}/edit`)}>
                <Edit size={14} className="mr-1.5" /> Edit Supplier
              </Button>
            )}
          </div>
        }
      />

      {/* SIMPLE SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Orders</span>
          <div className="text-xl font-bold text-slate-900">{summary?.totalPurchaseOrders || 0}</div>
          <div className="text-xs text-slate-500">{summary?.activeOpenOrdersCount || 0} Open POs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Spend</span>
          <div className="text-xl font-bold text-slate-900 truncate">{formatCurrency(summary?.totalPurchaseValue || 0)}</div>
          <div className="text-xs text-slate-500">Calculated from POs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Distinct Materials</span>
          <div className="text-xl font-bold text-slate-900">{summary?.distinctItemsCount || 0}</div>
          <div className="text-xs text-slate-500">{summary?.totalItemsPurchasedQty || 0} Total Units</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Last Order Date</span>
          <div className="text-sm font-bold text-slate-900 pt-1">{formatDate(summary?.lastPurchaseDate)}</div>
          <div className="text-xs text-slate-500">Latest Purchase Order</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Credit Terms</span>
          <div className="text-sm font-bold text-slate-900 pt-1 truncate">{supplier.paymentTerms || `${supplier.creditDays || 0} Days Net`}</div>
          <div className="text-xs text-slate-500">{supplier.gstin ? 'GST Registered' : 'Unregistered'}</div>
        </div>
      </div>

      {/* SIMPLE STANDARD TABS */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={15} />
          Overview & Master Data
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart size={15} />
          Purchase Orders History ({summary?.totalPurchaseOrders || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('price-history')}
          className={`pb-2.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'price-history'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={15} />
          Item Purchase Price History ({summary?.distinctItemsCount || 0})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & MASTER DATA */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Supplier Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Supplier & Contact Information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Supplier Code</span>
                <span className="font-mono font-semibold text-slate-900">{supplier.supplierCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <StatusBadge status={supplier.status} />
              </div>
              <div>
                <span className="text-slate-500 block">Supplier Name</span>
                <span className="font-semibold text-slate-900">{supplier.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Legal Name</span>
                <span className="font-semibold text-slate-900">{supplier.legalName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Person</span>
                <span className="font-semibold text-slate-900">{supplier.contactPerson || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="font-semibold text-slate-900">{supplier.phone || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Alternate Phone</span>
                <span className="font-semibold text-slate-900">{supplier.alternatePhone || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="font-semibold text-slate-900">{supplier.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Location & Address Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Address & Location Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <span className="text-slate-500 block">Street Address</span>
                <span className="font-semibold text-slate-900">{supplier.address || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">City</span>
                <span className="font-semibold text-slate-900">{supplier.city || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">State</span>
                <span className="font-semibold text-slate-900">{supplier.state || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Country</span>
                <span className="font-semibold text-slate-900">{supplier.country || 'India'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Postal Code (Pincode)</span>
                <span className="font-semibold text-slate-900">{supplier.pincode || '—'}</span>
              </div>
            </div>
          </div>

          {/* Tax & Financial Terms Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Taxation & Credit Terms
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">GSTIN Number</span>
                <span className="font-mono font-semibold text-slate-900">{supplier.gstin || 'Unregistered'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PAN Number</span>
                <span className="font-mono font-semibold text-slate-900">{supplier.pan || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Terms</span>
                <span className="font-semibold text-slate-900">{supplier.paymentTerms || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Credit Days</span>
                <span className="font-semibold text-slate-900">{supplier.creditDays || 0} Days</span>
              </div>
            </div>
          </div>

          {/* Banking Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Bank Account Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Bank Name</span>
                <span className="font-semibold text-slate-900">{supplier.bankName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Number</span>
                <span className="font-mono font-semibold text-slate-900">{supplier.accountNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">IFSC Code</span>
                <span className="font-mono font-semibold text-slate-900">{supplier.ifsc || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Remarks</span>
                <span className="text-slate-700">{supplier.remarks || '—'}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search history by PO number, item name, item code..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter size={16} className="text-slate-400" />
              <Select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="w-44"
              >
                <option value="all">All PO Statuses</option>
                <option value="DRAFT">Draft Only</option>
                <option value="CHECKED">Checked Only</option>
                <option value="RELEASED">Released Only</option>
                <option value="CLOSED">Closed Only</option>
                <option value="CANCELLED">Cancelled Only</option>
              </Select>
            </div>
          </div>

          <DataTable
            loading={historyLoading}
            data={historyPOs}
            emptyTitle="No Purchase Orders found"
            emptyDescription="There are no purchase orders recorded for this supplier matching your search query."
            columns={[
              {
                key: 'poNumber',
                header: 'PO Number',
                width: '150px',
                render: (val, row) => (
                  <Link
                    to={`/purchase-orders/${row._id}`}
                    className="font-mono font-bold text-blue-600 hover:underline"
                  >
                    {val}
                  </Link>
                ),
              },
              {
                key: 'poDate',
                header: 'PO Date',
                width: '120px',
                render: (val) => formatDate(val),
              },
              {
                key: 'poType',
                header: 'PO Type',
                width: '140px',
                render: (val) => <span className="font-medium text-slate-700">{val}</span>,
              },
              {
                key: 'itemsCount',
                header: 'Line Items',
                width: '110px',
                render: (_, row) => (
                  <span className="font-medium text-slate-800">
                    {row.items ? row.items.length : 0} items
                  </span>
                ),
              },
              {
                key: 'totalQuantity',
                header: 'Total Qty',
                width: '100px',
                render: (val) => <span className="font-medium text-slate-700">{val || 0}</span>,
              },
              {
                key: 'grandTotal',
                header: 'Grand Total',
                width: '140px',
                render: (val) => (
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(val)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'PO Status',
                width: '120px',
                render: (val) => <StatusBadge status={val} />,
              },
              {
                key: 'actions',
                header: 'Action',
                align: 'right',
                width: '110px',
                render: (_, row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/purchase-orders/${row._id}`)}
                  >
                    <Eye size={14} className="mr-1" />
                    Open PO
                  </Button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 3: ITEM PURCHASE PRICE HISTORY */}
      {activeTab === 'price-history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Filter by item name or code..."
                value={priceSearch}
                onChange={(e) => setPriceSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Calculated dynamically from previous Purchase Orders
            </span>
          </div>

          {priceLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading price metrics...</span>
            </div>
          ) : priceItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No historical item purchases recorded for this supplier yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-3 py-2.5 min-w-[200px]">Item Description</th>
                    <th className="px-3 py-2.5 w-32">Item Code</th>
                    <th className="px-3 py-2.5 w-32 text-right">Last Purchase Rate</th>
                    <th className="px-3 py-2.5 w-32 text-right">Previous Rate</th>
                    <th className="px-3 py-2.5 w-32 text-center">Price Diff</th>
                    <th className="px-3 py-2.5 w-32">Last PO Date</th>
                    <th className="px-3 py-2.5 w-32">Last PO</th>
                    <th className="px-3 py-2.5 w-28 text-right">Last Qty</th>
                    <th className="px-3 py-2.5 w-24 text-center">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {priceItems.map((item) => {
                    const isExpanded = expandedItemKey === item.key;
                    const diff = item.priceDifference || 0;

                    return (
                      <React.Fragment key={item.key}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-slate-900 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedItemKey(isExpanded ? null : item.key)}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                              title="Toggle Details"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {item.itemName}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-700 font-medium">{item.itemCode}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-900 text-right">
                            {formatCurrency(item.lastPurchaseRate)}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600 text-right">
                            {item.previousPurchaseRate !== null ? formatCurrency(item.previousPurchaseRate) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono">
                            {item.previousPurchaseRate === null ? (
                              <span className="text-[11px] text-slate-500 font-medium">First PO</span>
                            ) : diff > 0 ? (
                              <span className="text-[11px] font-bold text-red-600">+₹{diff}</span>
                            ) : diff < 0 ? (
                              <span className="text-[11px] font-bold text-emerald-600">-₹{Math.abs(diff)}</span>
                            ) : (
                              <span className="text-[11px] text-slate-500">₹0</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 font-medium">{formatDate(item.lastPurchaseDate)}</td>
                          <td className="px-3 py-2.5 font-mono font-semibold">
                            {item.lastPOId ? (
                              <Link to={`/purchase-orders/${item.lastPOId}`} className="text-blue-600 hover:underline">
                                {item.lastPONumber}
                              </Link>
                            ) : (
                              <span className="text-slate-500">{item.lastPONumber || '—'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-800 text-right">{item.lastPurchaseQuantity} {item.uomCode}</td>
                          <td className="px-3 py-2.5 text-center font-medium text-slate-700">
                            {item.purchaseCount} POs
                          </td>
                        </tr>

                        {/* EXPANDED PRICE TIMELINE ACCORDION */}
                        {isExpanded && (
                          <tr className="bg-slate-50">
                            <td colSpan={9} className="px-6 py-4 border-t border-b border-slate-200">
                              <div className="space-y-2">
                                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                  Purchase Order History Timeline for {item.itemName} ({item.itemCode})
                                </div>
                                <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                                        <th className="py-2 px-3">PO Number</th>
                                        <th className="py-2 px-3">PO Date</th>
                                        <th className="py-2 px-3 text-right">Quantity</th>
                                        <th className="py-2 px-3 text-right">Unit Rate</th>
                                        <th className="py-2 px-3 text-right">Tax Rate</th>
                                        <th className="py-2 px-3 text-right">Line Amount</th>
                                        <th className="py-2 px-3">PO Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(item.history || []).map((h, hIdx) => (
                                        <tr key={hIdx} className="hover:bg-slate-50">
                                          <td className="py-2 px-3 font-mono font-bold text-blue-600">
                                            <Link to={`/purchase-orders/${h.poId}`}>{h.poNumber}</Link>
                                          </td>
                                          <td className="py-2 px-3 text-slate-600">{formatDate(h.poDate)}</td>
                                          <td className="py-2 px-3 text-right font-mono">{h.quantity} {item.uomCode}</td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(h.unitRate)}</td>
                                          <td className="py-2 px-3 text-right font-mono text-slate-600">{h.taxRate}%</td>
                                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">{formatCurrency(h.lineAmount)}</td>
                                          <td className="py-2 px-3"><StatusBadge status={h.status} /></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierDetail;
