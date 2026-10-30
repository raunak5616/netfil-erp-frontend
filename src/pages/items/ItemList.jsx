import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  useGetItemsQuery,
  useDeleteItemMutation,
  useUploadItemImageMutation,
  useRemoveItemImageMutation
} from '../../features/products/productsApi';
import {
  useGetItemGroupsQuery,
  useGetItemCategoriesQuery
} from '../../features/masterData/masterDataApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
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
  Trash2,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  X
} from 'lucide-react';

const ItemList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('ITEM_CREATE');
  const canEdit = hasPermission('ITEM_EDIT');
  const canDelete = hasPermission('ITEM_DELETE') || hasPermission('ITEM_EDIT');

  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination states (25 records per page)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Filter & sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('code_asc');

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, productTypeFilter, groupFilter, categoryFilter, statusFilter, sortBy]);

  // RTK Query parameters
  const queryArgs = useMemo(() => {
    const params = {
      typeFilter: 'MASTER',
      page,
      limit: pageSize,
    };
    if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (productTypeFilter !== 'all') params.productType = productTypeFilter;
    if (groupFilter !== 'all') params.itemGroup = groupFilter;
    if (categoryFilter !== 'all') params.itemCategory = categoryFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (sortBy) params.sortBy = sortBy;
    return params;
  }, [page, pageSize, debouncedSearch, productTypeFilter, groupFilter, categoryFilter, statusFilter, sortBy]);

  // RTK Query Hooks
  const {
    data: itemsData,
    isLoading: loadingItems,
    isFetching: fetchingItems,
    error: itemsQueryError,
    refetch: fetchItemData
  } = useGetItemsQuery(queryArgs);

  const { data: groupsData } = useGetItemGroupsQuery({ typeFilter: 'MASTER' });
  const { data: categoriesData } = useGetItemCategoriesQuery({ typeFilter: 'MASTER' });

  const [deleteItemMutation] = useDeleteItemMutation();
  const [uploadItemImageMutation] = useUploadItemImageMutation();
  const [removeItemImageMutation] = useRemoveItemImageMutation();

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

  const itemGroups = useMemo(() => {
    const arr = groupsData?.itemGroups || groupsData?.groups || [];
    return Array.isArray(arr) ? arr.filter((g) => !isSystemCode(g.groupCode)) : [];
  }, [groupsData]);

  const itemCategories = useMemo(() => {
    const arr = categoriesData?.itemCategories || categoriesData?.categories || [];
    return Array.isArray(arr) ? arr.filter((cat) => !isSystemCode(cat.categoryCode)) : [];
  }, [categoriesData]);

  const items = useMemo(() => itemsData?.items || [], [itemsData]);
  const totalRecords = typeof itemsData?.total === 'number' ? itemsData.total : (itemsData?.count || 0);
  const totalPages = itemsData?.totalPages || Math.ceil(totalRecords / pageSize) || 1;
  const loading = loadingItems || fetchingItems;
  const error = localError || (itemsQueryError ? (itemsQueryError.data?.message || itemsQueryError.message || 'Failed to connect to server') : '');

  // Modal states
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState('RAW_ITEM');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Replace Image modal state
  const [imageModalItem, setImageModalItem] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageModalError, setImageModalError] = useState('');
  const [previewZoomUrl, setPreviewZoomUrl] = useState(null);
  const listFileInputRef = useRef(null);

  const openImageModal = (item) => {
    setImageModalItem(item);
    setImageModalError('');
    setIsImageModalOpen(true);
  };

  const handleReplaceImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !imageModalItem) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    const originalNameLower = (file.name || '').toLowerCase();
    const hasAllowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.svg'].some((ext) => originalNameLower.endsWith(ext));

    if (!allowedTypes.includes(file.type) && !hasAllowedExt) {
      setImageModalError('Only PNG, JPG, JPEG, WEBP, or SVG images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageModalError('Image file size must not exceed 5 MB.');
      return;
    }

    setImageModalError('');
    setImageUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const res = await uploadItemImageMutation({ id: imageModalItem._id, formData: uploadData }).unwrap();
      if (res.success || res.imageUrl) {
        setImageModalItem(prev => ({
          ...prev,
          imageUrl: res.imageUrl,
          imagePublicId: res.imagePublicId || '',
        }));
        setSuccessMessage(`Image updated successfully for ${imageModalItem.itemCode}`);
      } else {
        setImageModalError(res.message || 'Failed to replace image.');
      }
    } catch (err) {
      console.error('Failed to replace image:', err);
      setImageModalError(err.data?.message || err.message || 'Image replacement failed.');
    } finally {
      setImageUploading(false);
      if (listFileInputRef.current) listFileInputRef.current.value = '';
    }
  };

  const handleRemoveItemImage = async () => {
    if (!imageModalItem) return;
    setImageUploading(true);
    setImageModalError('');
    try {
      const res = await removeItemImageMutation(imageModalItem._id).unwrap();
      if (res.success) {
        setImageModalItem(prev => ({
          ...prev,
          imageUrl: '',
          imagePublicId: '',
        }));
        setSuccessMessage(`Image removed for ${imageModalItem.itemCode}`);
      } else {
        setImageModalError(res.message || 'Failed to remove image.');
      }
    } catch (err) {
      console.error('Failed to remove image:', err);
      setImageModalError(err.data?.message || err.message || 'Image removal failed.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteClick = (item) => {
    setLocalError('');
    setSuccessMessage('');
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setLocalError('');
    setSuccessMessage('');
    try {
      const res = await deleteItemMutation(itemToDelete._id).unwrap();
      setSuccessMessage(res.message || `Item "${itemToDelete.itemName}" (${itemToDelete.itemCode}) deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Failed to delete item:", err);
      setLocalError(err.data?.message || err.message || 'Failed to delete item');
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
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
      key: 'imageUrl',
      header: 'Image',
      width: '74px',
      align: 'center',
      render: (val, row) => (
        <div className="flex items-center justify-center">
          {val ? (
            <div
              className="relative group w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                openImageModal(row);
              }}
              title={`Click to view or replace image for ${row.itemName}`}
            >
              <img
                src={val}
                alt={row.itemName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-semibold">
                <Camera size={13} className="mb-0.5" />
                <span>Replace</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openImageModal(row);
              }}
              className="w-11 h-11 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/80 hover:bg-blue-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-all cursor-pointer group shadow-2xs"
              title={`Upload image for ${row.itemName}`}
            >
              <ImageIcon size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[8.5px] font-medium mt-0.5 text-slate-400 group-hover:text-blue-600">+ Image</span>
            </button>
          )}
        </div>
      ),
    },
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
              variant="ghost"
              size="xs"
              onClick={() => openImageModal(row)}
              title="Replace / View Item Image"
              className="text-slate-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Camera size={14} />
              <span>Image</span>
            </Button>
          )}
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

      {/* Replace / Manage Item Image Modal */}
      {isImageModalOpen && imageModalItem && (
        <Modal
          isOpen={isImageModalOpen}
          onClose={() => {
            if (!imageUploading) {
              setIsImageModalOpen(false);
              setImageModalItem(null);
              setImageModalError('');
            }
          }}
          title={`Product Image — ${imageModalItem.itemCode}`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                {imageModalItem.imageUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200"
                    icon={Trash2}
                    disabled={imageUploading}
                    onClick={handleRemoveItemImage}
                  >
                    Remove Image
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={imageUploading}
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setImageModalItem(null);
                    setImageModalError('');
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={imageUploading ? RefreshCw : (imageModalItem.imageUrl ? Camera : UploadCloud)}
                  disabled={imageUploading}
                  onClick={() => listFileInputRef.current?.click()}
                >
                  {imageUploading ? 'Uploading...' : imageModalItem.imageUrl ? 'Replace Image' : 'Upload Image'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  {imageModalItem.itemCode}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {imageModalItem.productType || 'ITEM'}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">
                {imageModalItem.itemName}
              </h4>
            </div>

            {/* Image Preview Box */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/60 min-h-[220px]">
              {imageModalItem.imageUrl ? (
                <div className="relative group max-w-full">
                  <img
                    src={imageModalItem.imageUrl}
                    alt={imageModalItem.itemName}
                    className="max-h-64 max-w-full rounded-lg object-contain shadow-sm cursor-pointer hover:opacity-95"
                    onClick={() => setPreviewZoomUrl(imageModalItem.imageUrl)}
                    title="Click to view full size"
                  />
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] shadow-2xs">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Active Image
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoomUrl(imageModalItem.imageUrl)}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline cursor-pointer"
                    >
                      View Full Size
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-blue-50/30 rounded-lg w-full transition-colors"
                  onClick={() => listFileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-2">
                    <UploadCloud size={26} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No image currently attached</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click here or use the button below to upload (PNG, JPG, WEBP, SVG max 5MB)</p>
                </div>
              )}
            </div>

            {imageUploading && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 py-2 rounded-md">
                <RefreshCw size={14} className="animate-spin" />
                <span>Uploading image to Cloudinary...</span>
              </div>
            )}

            {imageModalError && (
              <Alert type="error" message={imageModalError} />
            )}

            <input
              type="file"
              ref={listFileInputRef}
              onChange={handleReplaceImageFile}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              className="hidden"
            />
          </div>
        </Modal>
      )}

      {/* Full Size Image Lightbox */}
      {previewZoomUrl && (
        <Modal
          isOpen={!!previewZoomUrl}
          onClose={() => setPreviewZoomUrl(null)}
          title="Image Preview"
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setPreviewZoomUrl(null)}>
              Close
            </Button>
          }
        >
          <div className="flex items-center justify-center bg-slate-900 p-4 rounded-lg">
            <img
              src={previewZoomUrl}
              alt="Full Preview"
              className="max-h-[70vh] max-w-full object-contain rounded shadow-lg"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ItemList;
