import React, { useState, useEffect, useMemo } from 'react';
import { getItemCategories, updateItemCategoryStatus } from '../../services/itemCategoryService';
import { getItemGroups } from '../../services/itemGroupService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import ItemCategoryFormModal from './ItemCategoryFormModal';
import ItemCategoryDetailModal from './ItemCategoryDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Power,
  Layers
} from 'lucide-react';

const ItemCategoryList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('ITEM_CATEGORY_CREATE');
  const canEdit = hasPermission('ITEM_CATEGORY_EDIT');

  const [itemCategories, setItemCategories] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategoryData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, groupRes] = await Promise.all([
        getItemCategories(),
        getItemGroups().catch(() => ({ success: false, itemGroups: [] })),
      ]);

      if (catRes.success && Array.isArray(catRes.itemCategories)) {
        setItemCategories(catRes.itemCategories);
      } else {
        setError('Unexpected API response format');
      }

      if (groupRes.success && Array.isArray(groupRes.itemGroups)) {
        setItemGroups(groupRes.itemGroups);
      }
    } catch (err) {
      console.error("Failed to fetch Item Categories:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, []);

  const handleStatusToggle = async (category) => {
    const nextStatus = category.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to mark "${category.categoryName}" (${category.categoryCode}) as ${nextStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(category._id);
    try {
      const res = await updateItemCategoryStatus(category._id, nextStatus);
      if (res.success) {
        setItemCategories((prev) =>
          prev.map((c) => (c._id === category._id ? { ...c, status: nextStatus } : c))
        );
      }
    } catch (err) {
      console.error("Failed to update category status:", err);
      setError(err.response?.data?.message || 'Failed to update category status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCategories = useMemo(() => {
    return itemCategories.filter((cat) => {
      // Status filter
      if (statusFilter !== 'all' && cat.status !== statusFilter) return false;

      // Group filter
      if (groupFilter !== 'all') {
        const catGroupId = cat.itemGroup?._id || cat.itemGroup;
        if (catGroupId !== groupFilter) return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (cat.categoryCode || '').toLowerCase();
      const name = (cat.categoryName || '').toLowerCase();
      const groupCode = (cat.itemGroup?.groupCode || '').toLowerCase();
      const groupName = (cat.itemGroup?.groupName || '').toLowerCase();
      const desc = (cat.description || '').toLowerCase();

      return (
        code.includes(term) ||
        name.includes(term) ||
        groupCode.includes(term) ||
        groupName.includes(term) ||
        desc.includes(term)
      );
    });
  }, [itemCategories, searchTerm, statusFilter, groupFilter]);

  const columns = [
    {
      key: 'categoryCode',
      header: 'Category Code',
      width: '140px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'categoryName',
      header: 'Category Name',
      width: '220px',
      render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>,
    },
    {
      key: 'itemGroup',
      header: 'Item Group',
      width: '200px',
      render: (group) => {
        if (!group) return <span style={{ color: 'var(--neutral-400)' }}>—</span>;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                backgroundColor: 'var(--neutral-100)',
                color: 'var(--neutral-800)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid var(--neutral-300)',
              }}
            >
              {group.groupCode}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--neutral-700)' }}>{group.groupName}</span>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      width: '260px',
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
              setSelectedCategory(row);
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
                  setEditingCategory(row);
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
                title={row.status === 'active' ? 'Deactivate Category' : 'Activate Category'}
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
        title="Item Categories"
        description="Manage sub-classifications and material categories under master Item Groups."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Item Categories' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchCategoryData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingCategory(null);
                  setIsFormOpen(true);
                }}
              >
                Add Category
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
              placeholder="Search by category code, name, group, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} className="text-muted" />

            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="all">All Item Groups</option>
              {itemGroups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.groupCode} — {g.groupName}
                </option>
              ))}
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
          data={filteredCategories}
          loading={loading}
          emptyTitle="No Item Categories found"
          emptyDescription={
            searchTerm || statusFilter !== 'all' || groupFilter !== 'all'
              ? 'Try adjusting your search query or filters.'
              : 'Click "Add Category" above to create your first item category record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Showing {filteredCategories.length} of {itemCategories.length} total Item Categories</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <ItemCategoryFormModal
        category={editingCategory}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchCategoryData}
      />

      <ItemCategoryDetailModal
        category={selectedCategory}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(cat) => {
          setEditingCategory(cat);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default ItemCategoryList;
