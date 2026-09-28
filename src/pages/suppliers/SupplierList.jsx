import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuppliers, updateSupplierStatus } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Power,
  Phone,
  Mail,
  Truck,
  Building2,
  FileText
} from 'lucide-react';

const SupplierList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('SUPPLIER_CREATE') || hasPermission('PARTY_CREATE');
  const canEdit = hasPermission('SUPPLIER_EDIT') || hasPermission('PARTY_EDIT');

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSupplierData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSuppliers({ limit: 200 });
      if (data.success && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error('Failed to fetch Suppliers:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const handleStatusToggle = async (supplier) => {
    const nextStatus = supplier.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to mark supplier "${supplier.supplierName}" (${supplier.supplierCode}) as ${nextStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(supplier._id);
    try {
      const res = await updateSupplierStatus(supplier._id, nextStatus);
      if (res.success) {
        setSuppliers((prev) =>
          prev.map((s) => (s._id === supplier._id ? { ...s, status: nextStatus } : s))
        );
      }
    } catch (err) {
      console.error('Failed to update supplier status:', err);
      setError(err.response?.data?.message || 'Failed to update supplier status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      // Status filter
      if (statusFilter !== 'all' && supplier.status !== statusFilter) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (supplier.supplierCode || '').toLowerCase();
      const name = (supplier.supplierName || '').toLowerCase();
      const legal = (supplier.legalName || '').toLowerCase();
      const contact = (supplier.contactPerson || '').toLowerCase();
      const phone = (supplier.phone || '').toLowerCase();
      const email = (supplier.email || '').toLowerCase();
      const city = (supplier.city || '').toLowerCase();
      const gstin = (supplier.gstin || '').toLowerCase();

      return (
        code.includes(term) ||
        name.includes(term) ||
        legal.includes(term) ||
        contact.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        city.includes(term) ||
        gstin.includes(term)
      );
    });
  }, [suppliers, searchTerm, statusFilter]);

  const columns = [
    {
      key: 'supplierCode',
      header: 'Supplier Code',
      width: '140px',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => navigate(`/suppliers/${row._id}`)}
          className="font-mono font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier Name',
      width: '240px',
      render: (val, row) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => navigate(`/suppliers/${row._id}`)}
            className="font-bold text-slate-900 hover:text-blue-700 text-left transition-colors cursor-pointer"
          >
            {val}
          </button>
          {row.legalName && row.legalName !== val && (
            <span className="text-[11px] text-slate-500 font-normal">{row.legalName}</span>
          )}
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact & Phone',
      width: '200px',
      render: (_, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-800">
            {row.contactPerson || '—'}
          </span>
          {row.phone && (
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Phone size={11} className="text-blue-600 shrink-0" />
              {row.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email / City',
      width: '220px',
      render: (_, row) => (
        <div className="flex flex-col gap-0.5">
          {row.email ? (
            <span className="text-xs text-slate-700 flex items-center gap-1 truncate">
              <Mail size={11} className="text-blue-600 shrink-0" />
              {row.email}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
          {(row.city || row.state) && (
            <span className="text-[11.5px] text-slate-500">
              {[row.city, row.state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN / PAN',
      width: '160px',
      render: (_, row) => (
        <div className="flex flex-col gap-0.5">
          {row.gstin ? (
            <span className="font-mono text-xs font-medium text-slate-800">{row.gstin}</span>
          ) : (
            <span className="text-xs text-slate-400">Unregistered</span>
          )}
          {row.paymentTerms && (
            <span className="text-[11px] text-slate-500 truncate">{row.paymentTerms}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '180px',
      render: (_, row) => (
        <div className="inline-flex gap-1 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/suppliers/${row._id}`)}
            title="View Supplier Detail & Purchase History"
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/suppliers/${row._id}/edit`)}
                title="Edit Supplier Master Data"
              >
                <Edit size={14} className="mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusToggle(row)}
                title={row.status === 'active' ? 'Deactivate Supplier' : 'Activate Supplier'}
                className={row.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
              >
                <Power size={14} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Management"
        subtitle="Dedicated procurement master for raw material vendors, component suppliers, and service providers."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Purchase & Procurement' },
          { label: 'Supplier Management' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchSupplierData}>
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                onClick={() => navigate('/suppliers/create')}
              >
                <Plus size={14} className="mr-1.5" />
                Add Supplier
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        {/* Toolbar Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by supplier code, name, contact, phone, email, city, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={loading}
          emptyTitle="No Supplier records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Supplier" above to register your first procurement vendor.'
          }
        />

        {/* Footer Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>Showing {filteredSuppliers.length} of {suppliers.length} total procurement suppliers</span>
          <span>Role Permission: {canEdit ? 'Full Master Edit' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>
    </div>
  );
};

export default SupplierList;
