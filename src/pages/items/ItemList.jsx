import React, { useState, useEffect, useMemo } from 'react';
import { getItems, deleteItem } from '../../services/itemService';
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
import ItemTypeSelectionModal from './ItemTypeSelectionModal';
import DeleteItemModal from './DeleteItemModal';
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
  ArrowUpDown,
  RotateCcw,
  Trash2
} from 'lucide-react';

const ItemList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('ITEM_CREATE');
  const canEdit = hasPermission('ITEM_EDIT');
  const canDelete = hasPermission('ITEM_DELETE') || hasPermission('ITEM_EDIT');

  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination states (25 records per page)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('code_asc');

  // Modal states
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState('RAW_ITEM');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleDeleteClick = (item) => {
    setError('');
    setSuccessMessage('');
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await deleteItem(itemToDelete._id);
      if (res.success) {
        setSuccessMessage(res.message || `Item "${itemToDelete.itemName}" (${itemToDelete.itemCode}) deleted successfully.`);
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
        await fetchItemData();
      } else {
        setError(res.message || 'Failed to delete item');
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError(err.response?.data?.message || err.message || 'Failed to delete item');
      setIsDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load groups & categories on mount for filter dropdowns
  useEffect(() => {
    const loadFilterOptions = async () => {
      const isSystemCode = (code) => {
        if (!code) return false;
        const u = String(code).toUpperCase();
        return (
          u.startsWith('CAT-WO-') ||
          u === 'CAT-INV' ||
          u === 'CAT-OBOM' ||
          u.startsWith('GP-WO-') ||
          u === 'GP-INV' ||
          u === 'GP-OBOM'
        );
      };

      try {
        const [groupRes, catRes] = await Promise.all([
          getItemGroups({ typeFilter: 'MASTER' }).catch(() => ({ success: true, itemGroups: [] })),
          getItemCategories({ typeFilter: 'MASTER' }).catch(() => ({ success: true, itemCategories: [] })),
        ]);

        const groupsArray = groupRes.itemGroups || groupRes.groups;
        if (groupRes.success && Array.isArray(groupsArray)) {
          setItemGroups(groupsArray.filter((g) => !isSystemCode(g.groupCode)));
        }
        const categoriesArray = catRes.itemCategories || catRes.categories;
        if (catRes.success && Array.isArray(categoriesArray)) {
          setItemCategories(categoriesArray.filter((cat) => !isSystemCode(cat.categoryCode)));
        }
      } catch (err) {
        console.warn('Failed to load item groups/categories for filters:', err);
      }
    };
    loadFilterOptions();
  }, []);

  const fetchItemData = async (overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const activeSearch = overrides.search !== undefined ? overrides.search : debouncedSearch;
      const activeProductType = overrides.productType !== undefined ? overrides.productType : productTypeFilter;
      const activeGroup = overrides.group !== undefined ? overrides.group : groupFilter;
      const activeCategory = overrides.category !== undefined ? overrides.category : categoryFilter;
      const activeStatus = overrides.status !== undefined ? overrides.status : statusFilter;
      const activeSortBy = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
      const activePage = overrides.page !== undefined ? overrides.page : page;

      const params = {
        typeFilter: 'MASTER',
        page: activePage,
        limit: pageSize,
      };

      if (activeSearch && activeSearch.trim()) params.search = activeSearch.trim();
      if (activeProductType !== 'all') params.productType = activeProductType;
      if (activeGroup !== 'all') params.itemGroup = activeGroup;
      if (activeCategory !== 'all') params.itemCategory = activeCategory;
      if (activeStatus !== 'all') params.status = activeStatus;
      if (activeSortBy) params.sortBy = activeSortBy;

      const res = await getItems(params);
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items);
        const total = typeof res.total === 'number' ? res.total : (res.count || 0);
        setTotalRecords(total);
        setTotalPages(res.totalPages || Math.ceil(total / pageSize) || 1);
        if (res.page) setPage(res.page);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch Items:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch from page 1 whenever filters, search, or sorting change
  useEffect(() => {
    setPage(1);
    fetchItemData({ page: 1, search: debouncedSearch });
  }, [debouncedSearch, productTypeFilter, groupFilter, categoryFilter, statusFilter, sortBy]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchItemData({ page: newPage });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setProductTypeFilter('all');
    setGroupFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('code_asc');
    setPage(1);
    fetchItemData({
      page: 1,
      search: '',
      productType: 'all',
      group: 'all',
      category: 'all',
      status: 'all',
      sortBy: 'code_asc',
    });
  };

  // Categories available based on group filter
  const availableCategoryFilters = useMemo(() => {
    if (groupFilter === 'all') return itemCategories;
    return itemCategories.filter((c) => (c.itemGroup?._id || c.itemGroup) === groupFilter);
  }, [itemCategories, groupFilter]);

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
      key: 'productType',
      header: 'Product Type',
      width: '120px',
      render: (val, row) => {
        const type = val || (row.filterGrade ? 'FILTER' : 'RAW_ITEM');
        const labels = {
          RAW_ITEM: { text: 'Raw Item', color: 'bg-slate-100 text-slate-700 border-slate-200' },
          FILTER: { text: 'Filter', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          COIL: { text: 'Coil', color: 'bg-amber-50 text-amber-800 border-amber-200' },
          AHU: { text: 'AHU', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
        };
        const style = labels[type] || labels.RAW_ITEM;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style.color}`}>
            {style.text}
          </span>
        );
      },
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
      width: '190px',
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
          {canDelete && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleDeleteClick(row)}
              title="Delete Item"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const hasActiveFilters = Boolean(
    searchTerm ||
    productTypeFilter !== 'all' ||
    groupFilter !== 'all' ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'code_asc'
  );

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
            <Button variant="secondary" size="sm" onClick={() => fetchItemData()} loading={loading}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsTypeSelectionOpen(true);
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
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

      {/* Main Content Card Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3.5">
        {/* Structured Filter & Search Toolbar */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 space-y-3">
          {/* Row 1: Search & Primary Sorting Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 min-w-[260px] max-w-xl">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by item code, name, HSN, group, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Actions, Sorting & Status Controls */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <ArrowUpDown size={14} className="text-slate-500 shrink-0" />
                <span className="text-[11.5px] text-slate-500 font-medium whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs text-slate-800 bg-transparent font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="code_asc">Code: A to Z</option>
                  <option value="code_desc">Code: Z to A</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                  <option value="newest">Recently Added</option>
                  <option value="oldest">Oldest Added</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <span className="text-[11.5px] text-slate-500 font-medium mr-1.5">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={RotateCcw}
                  onClick={handleClearFilters}
                  title="Reset All Filters"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 h-[33px] px-2.5"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Row 2: Classification Filter Bar (Product Type, Group, Category) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/70">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider text-[11px] mr-1">
                <Filter size={13} className="text-blue-600" />
                <span>Filters:</span>
              </div>

              {/* Product Type Filter */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <span className="text-[11.5px] text-slate-500 font-medium mr-1.5">Type:</span>
                <select
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                  className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="RAW_ITEM">Raw Item</option>
                  <option value="FILTER">Filter</option>
                  <option value="COIL">Coil</option>
                  <option value="AHU">AHU</option>
                </select>
              </div>

              {/* Item Group Filter */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <span className="text-[11.5px] text-slate-500 font-medium mr-1.5">Group:</span>
                <select
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setCategoryFilter('all');
                  }}
                  className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="all">All Groups</option>
                  {itemGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.groupName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Category Filter */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <span className="text-[11.5px] text-slate-500 font-medium mr-1.5">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="all">All Categories</option>
                  {availableCategoryFilters.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total Record Counter Indicator */}
            <div className="text-[11.5px] text-slate-500">
              <span>Total: <strong className="text-slate-900 font-semibold font-mono">{totalRecords}</strong> catalog items</span>
            </div>
          </div>
        </div>

        {/* Data Table Component */}
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyTitle="No Item records found"
          emptyDescription={
            hasActiveFilters
              ? 'Try adjusting your search query or status/group/type filters.'
              : 'Click "Add Item" above to create your first item master record.'
          }
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            totalRecords: totalRecords,
            pageSize: pageSize,
            recordLabel: 'items',
            onPageChange: handlePageChange,
          }}
        />

        {/* Footer Summary */}
        <div className="flex items-center justify-between text-slate-500 text-xs pt-1 border-t border-slate-100">
          <span>Access Level: <strong>{canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</strong></span>
        </div>
      </div>

      {/* Type Selection Modal */}
      <ItemTypeSelectionModal
        isOpen={isTypeSelectionOpen}
        onClose={() => setIsTypeSelectionOpen(false)}
        onSelectType={(type) => {
          setSelectedProductType(type);
          setIsTypeSelectionOpen(false);
          setEditingItem(null);
          setIsFormOpen(true);
        }}
      />

      {/* Item Form Modal */}
      <ItemFormModal
        item={editingItem}
        initialProductType={selectedProductType}
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

      {/* Delete Item Confirmation Modal */}
      <DeleteItemModal
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ItemList;
