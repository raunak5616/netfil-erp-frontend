import React, { useState, useEffect, useMemo } from 'react';
import { getItems } from '../../services/itemService';
import { getItemGroups } from '../../services/itemGroupService';
import { getItemCategories } from '../../services/itemCategoryService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import ItemFormModal from './ItemFormModal';
import ItemDetailModal from './ItemDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw 
} from 'lucide-react';

const ItemList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('ITEM_CREATE');
  const canEdit = hasPermission('ITEM_EDIT');

  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchItemData = async () => {
    setLoading(true);
    setError('');
    try {
      const [itemRes, groupRes, catRes] = await Promise.all([
        getItems(),
        getItemGroups().catch(() => ({ success: true, itemGroups: [] })),
        getItemCategories().catch(() => ({ success: true, itemCategories: [] })),
      ]);

      if (itemRes.success && Array.isArray(itemRes.items)) {
        setItems(itemRes.items);
      } else {
        setError('Unexpected API response format');
      }

      const groupsArray = groupRes.itemGroups || groupRes.groups;
      if (groupRes.success && Array.isArray(groupsArray)) {
        setItemGroups(groupsArray);
      }
      const categoriesArray = catRes.itemCategories || catRes.categories;
      if (catRes.success && Array.isArray(categoriesArray)) {
        setItemCategories(categoriesArray);
      }
    } catch (err) {
      console.error("Failed to fetch Items:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, []);

  // Categories available based on group filter
  const availableCategoryFilters = useMemo(() => {
    if (groupFilter === 'all') return itemCategories;
    return itemCategories.filter((c) => (c.itemGroup?._id || c.itemGroup) === groupFilter);
  }, [itemCategories, groupFilter]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Group filter
      if (groupFilter !== 'all') {
        const groupId = item.itemGroup?._id || item.itemGroup;
        if (groupId !== groupFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const catId = item.itemCategory?._id || item.itemCategory;
        if (catId !== categoryFilter) return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (item.itemCode || '').toLowerCase();
      const name = (item.itemName || '').toLowerCase();
      const groupName = (item.itemGroup?.groupName || '').toLowerCase();
      const categoryName = (item.itemCategory?.categoryName || '').toLowerCase();
      const hsn = (item.hsnCode || '').toLowerCase();

      return (
        code.includes(term) ||
        name.includes(term) ||
        groupName.includes(term) ||
        categoryName.includes(term) ||
        hsn.includes(term)
      );
    });
  }, [items, searchTerm, statusFilter, groupFilter, categoryFilter]);

  const columns = [
    {
      key: 'itemCode',
      header: 'Item Code',
      width: '140px',
      render: (val) => (
        <span className="font-mono font-semibold text-blue-700">
          {val}
        </span>
      ),
    },
    {
      key: 'itemName',
      header: 'Item Name',
      width: '220px',
      render: (val) => <strong className="text-slate-900 font-semibold">{val}</strong>,
    },
    {
      key: 'itemGroup',
      header: 'Group',
      width: '140px',
      render: (group) => (
        <span className="text-xs text-slate-800 font-medium">
          {group?.groupName || '—'}
        </span>
      ),
    },
    {
      key: 'itemCategory',
      header: 'Category',
      width: '140px',
      render: (cat) => (
        <span className="text-xs text-slate-800 font-medium">
          {cat?.categoryName || '—'}
        </span>
      ),
    },
    {
      key: 'inventoryUom',
      header: 'UOM',
      width: '90px',
      render: (uom) => (
        <span className="font-mono text-slate-500 font-semibold text-xs">
          {uom?.uomCode || '—'}
        </span>
      ),
    },
    {
      key: 'defaultBin',
      header: 'Default Bin',
      width: '110px',
      render: (bin) => (
        <span className="font-mono text-slate-500 text-xs">
          {bin?.binCode || '—'}
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
      width: '130px',
      render: (_, row) => (
        <div className="inline-flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedItem(row);
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
                setEditingItem(row);
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
        title="Item Master"
        description="Manage system item master catalog, specifications, unit conversions, and inventory controls."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Items' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchItemData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingItem(null);
                  setIsFormOpen(true);
                }}
              >
                Add Item
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs mb-4">
        {/* Toolbar Controls */}
        <div className="flex flex-wrap gap-2.5 items-center mb-3.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search by item code, name, HSN, group, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-slate-400" />

            <Select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setCategoryFilter('all');
              }}
              className="w-36"
            >
              <option value="all">All Groups</option>
              {itemGroups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.groupName}
                </option>
              ))}
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-36"
            >
              <option value="all">All Categories</option>
              {availableCategoryFilters.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-32"
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
          data={filteredItems}
          loading={loading}
          emptyTitle="No Item records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all' || groupFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search query or status/group filters.'
              : 'Click "Add Item" above to create your first item master record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex items-center justify-between text-slate-500 mt-3 text-xs">
          <span>Showing {filteredItems.length} of {items.length} total item master records</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <ItemFormModal
        item={editingItem}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchItemData}
      />

      <ItemDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(itm) => {
          setEditingItem(itm);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default ItemList;
