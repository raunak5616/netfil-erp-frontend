import React, { useState, useEffect, useMemo } from 'react';
import { getItemGroups, updateItemGroupStatus } from '../../services/itemGroupService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import ItemGroupFormModal from './ItemGroupFormModal';
import ItemGroupDetailModal from './ItemGroupDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Power
} from 'lucide-react';

const ItemGroupList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('ITEM_GROUP_CREATE');
  const canEdit = hasPermission('ITEM_GROUP_EDIT');

  const [itemGroups, setItemGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // Track ID for inline status toggle loading

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchItemGroupData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getItemGroups();
      if (data.success && Array.isArray(data.itemGroups)) {
        setItemGroups(data.itemGroups);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch Item Groups:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemGroupData();
  }, []);

  const handleStatusToggle = async (group) => {
    const nextStatus = group.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to mark "${group.groupName}" (${group.groupCode}) as ${nextStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(group._id);
    try {
      const res = await updateItemGroupStatus(group._id, nextStatus);
      if (res.success) {
        setItemGroups((prev) =>
          prev.map((g) => (g._id === group._id ? { ...g, status: nextStatus } : g))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.response?.data?.message || 'Failed to update item group status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItemGroups = useMemo(() => {
    return itemGroups.filter((group) => {
      // Status filter
      if (statusFilter !== 'all' && group.status !== statusFilter) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (group.groupCode || '').toLowerCase();
      const name = (group.groupName || '').toLowerCase();
      const desc = (group.description || '').toLowerCase();

      return code.includes(term) || name.includes(term) || desc.includes(term);
    });
  }, [itemGroups, searchTerm, statusFilter]);

  const columns = [
    {
      key: 'groupCode',
      header: 'Group Code',
      width: '140px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'groupName',
      header: 'Group Name',
      width: '240px',
      render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>,
    },
    {
      key: 'description',
      header: 'Description',
      width: '320px',
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
      width: '180px',
      render: (_, row) => (
        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedGroup(row);
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
                  setEditingGroup(row);
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
                title={row.status === 'active' ? 'Deactivate Item Group' : 'Activate Item Group'}
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
        title="Item Groups"
        description="Manage product families, master classification, and raw material grouping."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Item Groups' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchItemGroupData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingGroup(null);
                  setIsFormOpen(true);
                }}
              >
                Add Item Group
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
              placeholder="Search by group code, name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} className="text-muted" />

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
          data={filteredItemGroups}
          loading={loading}
          emptyTitle="No Item Groups found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Item Group" above to create your first item group record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Showing {filteredItemGroups.length} of {itemGroups.length} total Item Groups</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <ItemGroupFormModal
        itemGroup={editingGroup}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchItemGroupData}
      />

      <ItemGroupDetailModal
        itemGroup={selectedGroup}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(group) => {
          setEditingGroup(group);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default ItemGroupList;
