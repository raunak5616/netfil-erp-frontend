import React, { useState, useEffect, useMemo } from 'react';
import { getUOMs } from '../../services/uomService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import UOMFormModal from './UOMFormModal';
import UOMDetailModal from './UOMDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw 
} from 'lucide-react';

const UOMList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('UOM_CREATE');
  const canEdit = hasPermission('UOM_EDIT');

  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dimensionFilter, setDimensionFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUom, setSelectedUom] = useState(null);

  const fetchUOMData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUOMs();
      if (data.success && Array.isArray(data.uoms)) {
        setUoms(data.uoms);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch UOMs:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUOMData();
  }, []);

  const filteredUOMs = useMemo(() => {
    return uoms.filter((uom) => {
      // Status filter
      if (statusFilter !== 'all' && uom.status !== statusFilter) return false;

      // Dimension filter
      if (dimensionFilter !== 'all' && uom.dimension !== dimensionFilter) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (uom.uomCode || '').toLowerCase();
      const name = (uom.uomName || '').toLowerCase();
      const dim = (uom.dimension || '').toLowerCase();
      const desc = (uom.description || '').toLowerCase();

      return code.includes(term) || name.includes(term) || dim.includes(term) || desc.includes(term);
    });
  }, [uoms, searchTerm, statusFilter, dimensionFilter]);

  const getDimensionClass = (dim) => {
    switch (dim) {
      case 'WEIGHT':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'VOLUME':
        return 'bg-sky-50 text-sky-900 border-sky-200';
      case 'LENGTH':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      default: // COUNT
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    }
  };

  const columns = [
    {
      key: 'uomCode',
      header: 'Code',
      width: '120px',
      render: (val) => (
        <span className="font-mono font-semibold text-primary-700">
          {val}
        </span>
      ),
    },
    {
      key: 'uomName',
      header: 'UOM Name',
      width: '220px',
      render: (val) => <strong className="font-semibold text-slate-900">{val}</strong>,
    },
    {
      key: 'dimension',
      header: 'Dimension',
      width: '140px',
      render: (val) => {
        const dimClass = getDimensionClass(val);
        return (
          <span className={`inline-block px-2 py-0.5 rounded text-[11.5px] font-semibold border ${dimClass}`}>
            {val}
          </span>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      width: '240px',
      render: (val) => (
        <span className={`text-xs ${val ? 'text-slate-800' : 'text-slate-400'}`}>
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '140px',
      render: (_, row) => (
        <div className="inline-flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedUom(row);
              setIsDetailOpen(true);
            }}
          >
            View
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => {
                setEditingUom(row);
                setIsFormOpen(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Units of Measure (UOM)"
        description="Manage system measurement units and physical dimension classifications."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Units of Measure' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchUOMData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingUom(null);
                  setIsFormOpen(true);
                }}
              >
                Add UOM
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md mb-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by UOM code, name, dimension, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Filter size={16} className="text-slate-400 hidden sm:inline" />
            
            <Select
              value={dimensionFilter}
              onChange={(e) => setDimensionFilter(e.target.value)}
              className="w-full sm:w-40"
            >
              <option value="all">All Dimensions</option>
              <option value="COUNT">COUNT</option>
              <option value="WEIGHT">WEIGHT</option>
              <option value="VOLUME">VOLUME</option>
              <option value="LENGTH">LENGTH</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>
          </div>
        </div>

        {/* Data Table Component */}
        <DataTable
          columns={columns}
          data={filteredUOMs}
          loading={loading}
          emptyTitle="No UOM records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all' || dimensionFilter !== 'all'
              ? 'Try adjusting your search query or filters.'
              : 'Click "Add UOM" above to create your first unit of measure record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex justify-between items-center text-slate-500 mt-3 text-xs border-t border-slate-100 pt-3">
          <span>Showing {filteredUOMs.length} of {uoms.length} total UOM records</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <UOMFormModal
        uom={editingUom}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchUOMData}
      />

      <UOMDetailModal
        uom={selectedUom}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(uom) => {
          setEditingUom(uom);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default UOMList;
