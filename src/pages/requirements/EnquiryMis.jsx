import React, { useState, useEffect, useMemo } from 'react';
import {
  getUnifiedMis,
  getCustomerMis,
  getItemMis,
  getItemCategoryMis,
  getStatusMis,
  getSalesPersonMis,
} from '../../services/requirementService';
import { getClients } from '../../services/clientService';
import { getItemCategories } from '../../services/itemCategoryService';
import { getItems } from '../../services/itemService';
import { getEmployees } from '../../services/employeeService';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import RequirementDetailModal from './RequirementDetailModal';
import {
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  Building2,
  Users,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const EnquiryMis = () => {
  // Navigation / View Tabs: 'unified' | 'customer' | 'item' | 'category' | 'status' | 'salesPerson'
  const [activeTab, setActiveTab] = useState('unified');

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report Data
  const [reportData, setReportData] = useState([]);

  // Master Filter Data Options
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);

  // Active Filter Inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState('all');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);

  // Modal State
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Real Backend Summary Metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    total: 0,
    pending: 0,
    won: 0,
    overdue: 0,
  });

  // Load Master Selectors Data Once
  useEffect(() => {
    const loadMasterOptions = async () => {
      try {
        const [clientRes, catRes, itemRes, empRes] = await Promise.all([
          getClients().catch(() => ({ success: false, clients: [] })),
          getItemCategories().catch(() => ({ success: false, itemCategories: [] })),
          getItems().catch(() => ({ success: false, items: [] })),
          getEmployees().catch(() => ({ success: false, employees: [] })),
        ]);

        if (clientRes.success && Array.isArray(clientRes.clients)) setClients(clientRes.clients);
        if (catRes.success && Array.isArray(catRes.itemCategories)) setCategories(catRes.itemCategories);
        if (itemRes.success && Array.isArray(itemRes.items)) setItems(itemRes.items);
        if (empRes.success && Array.isArray(empRes.employees)) setSalesPersons(empRes.employees);
      } catch (err) {
        console.error('Error loading master filter options:', err);
      }
    };
    loadMasterOptions();
  }, []);

  // Fetch Report Data based on active tab and filters
  const fetchReportData = async () => {
    setLoading(true);
    setError('');

    // Date range validation
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError('"From Date" cannot be after "To Date"');
      setLoading(false);
      return;
    }

    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedClient !== 'all') params.client = selectedClient;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedCategory !== 'all') params.itemCategory = selectedCategory;
      if (selectedItem !== 'all') params.item = selectedItem;
      if (selectedSalesPerson !== 'all') params.salesPerson = selectedSalesPerson;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (isOverdueOnly) params.overdue = 'true';

      let response;
      if (activeTab === 'unified') {
        response = await getUnifiedMis(params);
        if (response.success && Array.isArray(response.requirements)) {
          setReportData(response.requirements);
          calculateSummaryMetrics(response.requirements);
        } else {
          setReportData([]);
        }
      } else if (activeTab === 'customer') {
        response = await getCustomerMis(params);
        if (response.success && Array.isArray(response.data)) {
          setReportData(response.data);
        } else {
          setReportData([]);
        }
      } else if (activeTab === 'item') {
        response = await getItemMis(params);
        if (response.success && Array.isArray(response.data)) {
          setReportData(response.data);
        } else {
          setReportData([]);
        }
      } else if (activeTab === 'category') {
        response = await getItemCategoryMis(params);
        if (response.success && Array.isArray(response.data)) {
          setReportData(response.data);
        } else {
          setReportData([]);
        }
      } else if (activeTab === 'status') {
        response = await getStatusMis(params);
        if (response.success && Array.isArray(response.data)) {
          setReportData(response.data);
        } else {
          setReportData([]);
        }
      } else if (activeTab === 'salesPerson') {
        response = await getSalesPersonMis(params);
        if (response.success && Array.isArray(response.data)) {
          setReportData(response.data);
        } else {
          setReportData([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch MIS report data:', err);
      setError(err.response?.data?.message || 'Failed to load MIS report data');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute metrics from unified requirements dataset
  const calculateSummaryMetrics = (requirementsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let total = requirementsList.length;
    let pending = 0;
    let won = 0;
    let overdue = 0;

    requirementsList.forEach((req) => {
      if (req.status === 'quotation_pending') pending++;
      if (req.status === 'won') won++;

      if (req.followUpDate) {
        const followDate = new Date(req.followUpDate);
        if (followDate < today && !['won', 'lost', 'cancelled'].includes(req.status)) {
          overdue++;
        }
      }
    });

    setSummaryMetrics({ total, pending, won, overdue });
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    fetchReportData();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClient('all');
    setSelectedStatus('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedItem('all');
    setSelectedSalesPerson('all');
    setFromDate('');
    setToDate('');
    setIsOverdueOnly(false);
    setError('');

    // Fetch clean unified data
    getUnifiedMis()
      .then((res) => {
        if (res.success && Array.isArray(res.requirements)) {
          setReportData(res.requirements);
          calculateSummaryMetrics(res.requirements);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleViewDetail = (reqRecord) => {
    setSelectedRequirement(reqRecord);
    setIsDetailOpen(true);
  };

  // ----------------------------------------------------
  // TABLE COLUMNS PER TAB
  // ----------------------------------------------------

  const unifiedColumns = useMemo(
    () => [
      {
        key: 'requirementNo',
        header: 'Enquiry No',
        sortable: true,
        render: (val) => (
          <span style={{ fontWeight: 600, color: 'var(--primary-700)', fontFamily: 'monospace' }}>
            {val}
          </span>
        ),
      },
      {
        key: 'requirementDate',
        header: 'Enquiry Date',
        sortable: true,
        render: (val) =>
          val ? new Date(val).toLocaleDateString('en-GB') : '-',
      },
      {
        key: 'client',
        header: 'Party',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
              {row?.client?.companyName || 'N/A'}
            </div>
            {row?.client?.clientCode && (
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                {row.client.clientCode}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (val) => (
          <span
            className={`badge ${
              val === 'product' ? 'badge-primary' : 'badge-secondary'
            }`}
            style={{ textTransform: 'capitalize' }}
          >
            {val}
          </span>
        ),
      },
      {
        key: 'item',
        header: 'Item / Category / Description',
        render: (_, row) => {
          if (row?.type === 'product') {
            return (
              <div>
                <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                  {row.item?.itemName || 'Unspecified Item'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                  Cat: {row.itemCategory?.categoryName || 'N/A'}
                </div>
              </div>
            );
          }
          return (
            <div style={{ fontSize: '12px', color: 'var(--gray-700)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row?.serviceDescription || 'Service Requirement'}
            </div>
          );
        },
      },
      {
        key: 'quantity',
        header: 'Qty & UOM',
        render: (val, row) => (
          <span>
            {val ? `${val} ${row?.uom?.uomCode || ''}` : '-'}
          </span>
        ),
      },
      {
        key: 'salesPerson',
        header: 'Sales Person',
        render: (_, row) => row?.salesPerson?.fullName || '-',
      },
      {
        key: 'followUpDate',
        header: 'Follow-up Date',
        sortable: true,
        render: (val, row) => {
          if (!val) return '-';
          const isOverdue =
            new Date(val) < new Date().setHours(0, 0, 0, 0) &&
            !['won', 'lost', 'cancelled'].includes(row?.status);
          return (
            <span
              style={{
                color: isOverdue ? 'var(--danger-700)' : 'var(--gray-800)',
                fontWeight: isOverdue ? 600 : 400,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isOverdue && <AlertTriangle size={13} color="var(--danger-600)" />}
              {new Date(val).toLocaleDateString('en-GB')}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (val) => <StatusBadge status={val} />,
      },
      {
        key: '_id',
        header: 'Actions',
        render: (_, row) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleViewDetail(row)}
            title="View Details"
          >
            <Eye size={14} style={{ marginRight: '4px' }} /> View
          </Button>
        ),
      },
    ],
    []
  );

  const customerColumns = useMemo(
    () => [
      { key: 'clientCode', header: 'Client Code', sortable: true },
      { key: 'companyName', header: 'Company Name', sortable: true },
      { key: 'city', header: 'City' },
      { key: 'state', header: 'State' },
      { key: 'totalEnquiries', header: 'Total Enquiries', sortable: true },
      { key: 'productEnquiries', header: 'Product Enquiries' },
      { key: 'serviceEnquiries', header: 'Service Enquiries' },
      { key: 'pendingQuotations', header: 'Pending Quotations' },
      { key: 'wonEnquiries', header: 'Won Enquiries' },
    ],
    []
  );

  const itemColumns = useMemo(
    () => [
      { key: 'itemCode', header: 'Item Code', sortable: true },
      { key: 'itemName', header: 'Item Name', sortable: true },
      { key: 'categoryName', header: 'Category' },
      { key: 'itemType', header: 'Item Type' },
      { key: 'totalEnquiries', header: 'Total Enquiries', sortable: true },
      { key: 'totalQuantity', header: 'Total Quantity', sortable: true },
    ],
    []
  );

  const categoryColumns = useMemo(
    () => [
      { key: 'categoryCode', header: 'Category Code', sortable: true },
      { key: 'categoryName', header: 'Category Name', sortable: true },
      { key: 'totalEnquiries', header: 'Total Enquiries', sortable: true },
      { key: 'totalQuantity', header: 'Total Quantity', sortable: true },
    ],
    []
  );

  const statusColumns = useMemo(
    () => [
      {
        key: 'status',
        header: 'Enquiry Status',
        sortable: true,
        render: (val) => <StatusBadge status={val} />,
      },
      { key: 'count', header: 'Total Enquiries', sortable: true },
    ],
    []
  );

  const salesPersonColumns = useMemo(
    () => [
      { key: 'employeeCode', header: 'Employee Code', sortable: true },
      { key: 'fullName', header: 'Sales Person Name', sortable: true },
      { key: 'designation', header: 'Designation' },
      { key: 'totalEnquiries', header: 'Total Enquiries', sortable: true },
      { key: 'pendingQuotations', header: 'Pending Quotations' },
      { key: 'wonEnquiries', header: 'Won Enquiries' },
    ],
    []
  );

  // Active columns based on current tab
  const getActiveColumns = () => {
    switch (activeTab) {
      case 'customer':
        return customerColumns;
      case 'item':
        return itemColumns;
      case 'category':
        return categoryColumns;
      case 'status':
        return statusColumns;
      case 'salesPerson':
        return salesPersonColumns;
      default:
        return unifiedColumns;
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Enquiry MIS"
        subtitle="Commercial Requirement & Enquiry Monitoring Reports"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary KPI Cards (Authentic backend aggregated metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Enquiries
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gray-900)', marginTop: '4px' }}>
            {summaryMetrics.total}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--warning-500)' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Pending Quotations
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning-700)', marginTop: '4px' }}>
            {summaryMetrics.pending}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--success-500)' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Won Enquiries
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success-700)', marginTop: '4px' }}>
            {summaryMetrics.won}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--danger-500)' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Overdue Follow-ups
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger-700)', marginTop: '4px' }}>
            {summaryMetrics.overdue}
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleApplyFilters}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              alignItems: 'end',
            }}
          >
            {/* Search */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>Search Enquiry / Party</label>
              <Input
                type="text"
                placeholder="Search No, Party, Remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<Search size={14} color="var(--gray-400)" />}
              />
            </div>

            {/* Party Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>Party / Client</label>
              <Select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="all">All Parties</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName} ({c.clientCode})
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>Status</label>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="quotation_pending">Quotation Pending</option>
                <option value="quoted">Quoted</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>Enquiry Type</label>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>Item Category</label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.categoryName} ({cat.categoryCode})
                  </option>
                ))}
              </Select>
            </div>

            {/* Sales Person Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>Sales Person</label>
              <Select
                value={selectedSalesPerson}
                onChange={(e) => setSelectedSalesPerson(e.target.value)}
              >
                <option value="all">All Sales Persons</option>
                {salesPersons.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </Select>
            </div>

            {/* From Date */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {/* To Date */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            {/* Filter Buttons & Overdue Toggle */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="button"
                variant={isOverdueOnly ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setIsOverdueOnly(!isOverdueOnly)}
                title="Toggle Overdue Follow-ups"
              >
                <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                {isOverdueOnly ? 'Overdue Only' : 'Overdue'}
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                <Filter size={14} style={{ marginRight: '4px' }} /> Apply
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                title="Reset Filters"
              >
                <RotateCcw size={14} />
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Report View Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--gray-200)',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          className={`tab-button ${activeTab === 'unified' ? 'active' : ''}`}
          onClick={() => setActiveTab('unified')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'unified' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'unified' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Unified Enquiry Log
        </button>

        <button
          className={`tab-button ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'customer' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'customer' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <Building2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Customer Breakdown
        </button>

        <button
          className={`tab-button ${activeTab === 'item' ? 'active' : ''}`}
          onClick={() => setActiveTab('item')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'item' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'item' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <Package size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Item Breakdown
        </button>

        <button
          className={`tab-button ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => setActiveTab('category')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'category' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'category' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Category Breakdown
        </button>

        <button
          className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'status' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'status' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <BarChart2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Status Summary
        </button>

        <button
          className={`tab-button ${activeTab === 'salesPerson' ? 'active' : ''}`}
          onClick={() => setActiveTab('salesPerson')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'salesPerson' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'salesPerson' ? 'var(--primary-600)' : 'var(--gray-600)',
          }}
        >
          <Users size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Sales Person Breakdown
        </button>
      </div>

      {/* Main MIS Data Table */}
      <div className="card">
        <DataTable
          columns={getActiveColumns()}
          data={reportData}
          loading={loading}
          emptyMessage="No Enquiry MIS records found for the selected criteria."
        />
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedRequirement && (
        <RequirementDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedRequirement(null);
          }}
          requirement={selectedRequirement}
        />
      )}
    </div>
  );
};

export default EnquiryMis;
