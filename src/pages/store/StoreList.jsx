import React, { useState, useEffect, useMemo } from 'react';
import { getStores, updateStoreStatus } from '../../services/storeService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import StoreFormModal from './StoreFormModal';
import StoreDetailModal from './StoreDetailModal';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Power
} from 'lucide-react';

const StoreList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('STORE_CREATE');
  const canEdit = hasPermission('STORE_EDIT');
  const canChangeStatus = hasPermission('STORE_STATUS');

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  const fetchStoreData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStores();
      if (data.success && Array.isArray(data.stores)) {
        setStores(data.stores);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      if (statusFilter !== 'all' && store.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (store.storeCode || '').toLowerCase();
      const name = (store.storeName || '').toLowerCase();
      const address = (store.address || '').toLowerCase();

      return code.includes(term) || name.includes(term) || address.includes(term);
    });
  }, [stores, searchTerm, statusFilter]);

  const toggleStatus = async (store) => {
    try {
      const newStatus = store.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateStoreStatus(store._id, newStatus);
      fetchStoreData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      key: 'storeCode',
      header: 'Store Code',
      width: '130px',
      render: (val) => (
        <span className="font-mono font-semibold text-primary-700">
          {val}
        </span>
      ),
    },
    {
      key: 'storeName',
      header: 'Store Name',
      width: '200px',
      render: (val) => <strong className="text-neutral-900">{val}</strong>,
    },
    {
      key: 'address',
      header: 'Address',
      width: '250px',
      render: (val) => <span className="text-sm truncate block max-w-xs">{val}</span>,
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      width: '150px',
      render: (val) => val || '—',
    },
    {
      key: 'contactNumber',
      header: 'Contact Number',
      width: '150px',
      render: (val) => val || '—',
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '180px',
      render: (_, row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedStore(row);
              setIsDetailOpen(true);
            }}
            title="View Details"
          />
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => {
                setEditingStore(row);
                setIsFormOpen(true);
              }}
              title="Edit Store"
            />
          )}
          {canChangeStatus && (
            <Button
              variant="ghost"
              size="sm"
              icon={Power}
              className={row.status === 'ACTIVE' ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}
              onClick={() => toggleStatus(row)}
              title={row.status === 'ACTIVE' ? 'Deactivate Store' : 'Activate Store'}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Store Master"
        description="Manage storage locations, warehouses, and inventory stores."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Store' },
          { label: 'Store Management' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchStoreData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingStore(null);
                  setIsFormOpen(true);
                }}
              >
                Add Store
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input 
              className="pl-8"
              placeholder="Search by store code, name, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </Select>
          </div>
        </div>

        {/* Data Table Component */}
        <DataTable
          columns={columns}
          data={filteredStores}
          loading={loading}
          emptyTitle="No stores found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Store" above to create your first store record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex justify-between text-slate-500 mt-3 text-xs font-medium">
          <span>Showing {filteredStores.length} of {stores.length} total stores</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <StoreFormModal
        store={editingStore}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchStoreData}
      />

      <StoreDetailModal
        store={selectedStore}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(st) => {
          setEditingStore(st);
          setIsFormOpen(true);
        }}
        onSuccess={fetchStoreData}
        canEdit={canEdit}
      />
    </div>
  );
};

export default StoreList;
