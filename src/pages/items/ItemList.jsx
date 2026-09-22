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
import ItemFormModal from './ItemFormModal';
import ItemDetailModal from './ItemDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Package,
  CheckCircle2,
  Layers,
  Tag,
  X
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
        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded border border-blue-200/80 inline-block shadow-2xs">
          {val}
        </span>
      ),
    },
    {
      key: 'itemName',
      header: 'Item Name',
      width: '240px',
      render: (val, row) => (
        <div className="flex flex-col">
          <strong className="text-slate-900 font-semibold text-xs leading-snug">{val}</strong>
          {row.hsnCode && (
            <span className="text-[10.5px] text-slate-400 font-mono mt-0.5">HSN: {row.hsnCode}</span>
          )}
        </div>
      ),
    },
    {
      key: 'itemGroup',
      header: 'Group',
      width: '150px',
      render: (group) => (
        group?.groupName ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium bg-purple-50 text-purple-800 border border-purple-200/60">
            {group.groupName}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
      ),
    },
    {
      key: 'itemCategory',
      header: 'Category',
      width: '160px',
      render: (cat) => (
        cat?.categoryName ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {cat.categoryName}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
      ),
    },
    {
      key: 'inventoryUom',
      header: 'UOM',
      width: '80px',
      render: (uom) => (
        <span className="font-mono text-slate-600 font-semibold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {uom?.uomCode || '—'}
        </span>
      ),
    },
    {
      key: 'defaultBin',
      header: 'Default Bin',
      width: '130px',
      render: (bin) => (
        bin?.binCode ? (
          <span className="font-mono text-[11px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200">
            {bin.binCode}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
      ),
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
      width: '140px',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setSelectedItem(row);
              setIsDetailOpen(true);
            }}
            title="View Details"
          >
            <Eye size={14} className="text-slate-500" />
            <span>View</span>
          </Button>
          {canEdit && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setEditingItem(row);
                setIsFormOpen(true);
              }}
              title="Edit Item"
            >
              <Edit size={14} className="text-blue-600" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Item Master"
        subtitle="Manage system item master catalog, specifications, unit conversions, and inventory controls."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Items' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchItemData} loading={loading}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus size={14} />
                <span>Add Item</span>
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}



      {/* Main Content Card Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3.5">
        {/* Horizontal Toolbar Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/70">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by item code, name, HSN, group, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Inline Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
              <Filter size={14} className="text-slate-400" />
              <span>Filters:</span>
            </div>

            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setCategoryFilter('all');
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Groups</option>
              {itemGroups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.groupName}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {availableCategoryFilters.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {(searchTerm || groupFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setGroupFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-medium transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
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
        <div className="flex items-center justify-between text-slate-500 text-xs pt-1 border-t border-slate-100">
          <span>Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> total item catalog records</span>
          <span>Access Level: <strong>{canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</strong></span>
        </div>
      </div>

      {/* Modals */}
      <ItemFormModal
        item={editingItem}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchItemData}
      />

      {/* Detail View Modal */}
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
