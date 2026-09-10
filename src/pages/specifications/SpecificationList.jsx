import React, { useState, useEffect, useMemo } from 'react';
import { getSpecifications, updateSpecificationStatus } from '../../services/specificationService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import SpecificationFormModal from './SpecificationFormModal';
import SpecificationDetailModal from './SpecificationDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Power
} from 'lucide-react';

const SpecificationList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('SPECIFICATION_CREATE');
  const canEdit = hasPermission('SPECIFICATION_EDIT');

  const [specifications, setSpecifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);

  const fetchSpecificationData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSpecifications();
      if (data.success && Array.isArray(data.specifications)) {
        setSpecifications(data.specifications);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch Specifications:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecificationData();
  }, []);

  const handleStatusToggle = async (spec) => {
    const nextStatus = spec.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to mark "${spec.specificationName}" (${spec.specificationCode}) as ${nextStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(spec._id);
    try {
      const res = await updateSpecificationStatus(spec._id, nextStatus);
      if (res.success) {
        setSpecifications((prev) =>
          prev.map((s) => (s._id === spec._id ? { ...s, status: nextStatus } : s))
        );
      }
    } catch (err) {
      console.error("Failed to update specification status:", err);
      setError(err.response?.data?.message || 'Failed to update specification status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSpecifications = useMemo(() => {
    return specifications.filter((spec) => {
      // Data type filter
      if (typeFilter !== 'all' && spec.dataType !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && spec.status !== statusFilter) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (spec.specificationCode || '').toLowerCase();
      const name = (spec.specificationName || '').toLowerCase();
      const dataType = (spec.dataType || '').toLowerCase();
      const unitCode = (spec.unit?.uomCode || '').toLowerCase();
      const desc = (spec.description || '').toLowerCase();
      const optionsText = Array.isArray(spec.options) ? spec.options.join(' ').toLowerCase() : '';

      return (
        code.includes(term) ||
        name.includes(term) ||
        dataType.includes(term) ||
        unitCode.includes(term) ||
        desc.includes(term) ||
        optionsText.includes(term)
      );
    });
  }, [specifications, searchTerm, typeFilter, statusFilter]);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'number':
        return { backgroundColor: '#e6f7ff', color: '#0050b3', borderColor: '#91d5ff' };
      case 'boolean':
        return { backgroundColor: '#f9f0ff', color: '#531dab', borderColor: '#d3ade6' };
      case 'select':
        return { backgroundColor: '#fffbe6', color: '#873800', borderColor: '#ffe58f' };
      default: // string
        return { backgroundColor: '#f5f5f5', color: '#262626', borderColor: '#d9d9d9' };
    }
  };

  const columns = [
    {
      key: 'specificationCode',
      header: 'Code',
      width: '140px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'specificationName',
      header: 'Specification Name',
      width: '220px',
      render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>,
    },
    {
      key: 'dataType',
      header: 'Type',
      width: '110px',
      render: (val) => {
        const style = getTypeStyle(val);
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
              color: style.color,
              textTransform: 'uppercase',
            }}
          >
            {val}
          </span>
        );
      },
    },
    {
      key: 'details',
      header: 'Unit / Options',
      width: '220px',
      render: (_, row) => {
        if (row.dataType === 'select') {
          const count = row.options?.length || 0;
          const preview = row.options ? row.options.slice(0, 3).join(', ') : '';
          return (
            <span style={{ fontSize: '12.5px', color: 'var(--neutral-800)' }}>
              <strong>{count} options:</strong> {preview}{count > 3 ? '...' : ''}
            </span>
          );
        }

        if (row.unit) {
          return (
            <span style={{ fontSize: '12.5px', color: 'var(--neutral-800)', fontWeight: 600 }}>
              UOM: {row.unit.uomCode}
            </span>
          );
        }

        return <span style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>—</span>;
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
      width: '110px',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '180px',
      render: (_, row) => (
        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedSpec(row);
              setIsDetailOpen(true);
            }}
          >
            View
          </Button>
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={Edit}
                onClick={() => {
                  setEditingSpec(row);
                  setIsFormOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Power}
                loading={actionLoading === row._id}
                onClick={() => handleStatusToggle(row)}
                title={row.status === 'active' ? 'Deactivate Specification' : 'Activate Specification'}
                style={{
                  color: row.status === 'active' ? 'var(--danger-600)' : 'var(--success-600)',
                }}
              >
                {row.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Specifications"
        description="Manage master technical parameters, physical attributes, and dropdown option sets."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Specifications' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchSpecificationData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingSpec(null);
                  setIsFormOpen(true);
                }}
              >
                Add Specification
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
              placeholder="Search by code, name, type, unit, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} className="text-muted" />

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="all">All Data Types</option>
              <option value="string">String (Text)</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select (Choices)</option>
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
          data={filteredSpecifications}
          loading={loading}
          emptyTitle="No Specifications found"
          emptyDescription={
            searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search query or filters.'
              : 'Click "Add Specification" above to create your first specification record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Showing {filteredSpecifications.length} of {specifications.length} total Specifications</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <SpecificationFormModal
        specification={editingSpec}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchSpecificationData}
      />

      <SpecificationDetailModal
        specification={selectedSpec}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(spec) => {
          setEditingSpec(spec);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default SpecificationList;
