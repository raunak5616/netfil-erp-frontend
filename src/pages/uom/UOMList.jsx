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

  const getDimensionStyle = (dim) => {
    switch (dim) {
      case 'WEIGHT':
        return { backgroundColor: '#fffbe6', color: '#873800', borderColor: '#ffe58f' };
      case 'VOLUME':
        return { backgroundColor: '#e6f7ff', color: '#0050b3', borderColor: '#91d5ff' };
      case 'LENGTH':
        return { backgroundColor: '#f9f0ff', color: '#531dab', borderColor: '#d3ade6' };
      default: // COUNT
        return { backgroundColor: '#f6ffed', color: '#237804', borderColor: '#b7eb8f' };
    }
  };

  const columns = [
    {
      key: 'uomCode',
      header: 'Code',
      width: '120px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'uomName',
      header: 'UOM Name',
      width: '220px',
      render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>,
    },
    {
      key: 'dimension',
      header: 'Dimension',
      width: '140px',
      render: (val) => {
        const style = getDimensionStyle(val);
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11.5px',
              fontWeight: 600,
              border: `1px solid ${style.borderColor}`,
              backgroundColor: style.backgroundColor,
              color: style.color
            }}
          >
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
        <span style={{ color: val ? 'var(--neutral-800)' : 'var(--neutral-400)', fontSize: '13px' }}>
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
        <div style={{ display: 'inline-flex', gap: '4px' }}>
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
    <div>
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

      <div className="card">
        {/* Toolbar Controls */}
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search size={16} />
            <Input
              placeholder="Search by UOM code, name, dimension, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} className="text-muted" />
            
            <Select
              value={dimensionFilter}
              onChange={(e) => setDimensionFilter(e.target.value)}
              style={{ width: '150px' }}
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
              style={{ width: '140px' }}
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
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
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
