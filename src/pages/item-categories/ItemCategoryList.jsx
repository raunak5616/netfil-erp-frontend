import React, { useState, useMemo } from 'react';
import {
  useGetItemCategoriesQuery,
  useUpdateItemCategoryStatusMutation,
  useDeleteItemCategoryMutation,
} from '../../features/masterData/masterDataApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
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
  Trash2,
  CheckCircle2
} from 'lucide-react';

const FIXED_CODES = ['RAW', 'FILTER', 'COIL', 'AHU'];

const ItemCategoryList = () => {
  const { hasPermission, user } = useAuth();

  const canCreate = hasPermission('ITEM_CATEGORY_CREATE');
  const canEdit = hasPermission('ITEM_CATEGORY_EDIT');

  // Enforce Admin role requirement and honor user-level DENY override
  const roles = user?.roles || (user?.role ? [user.role] : []);
  const isAdmin = roles.some(
    (r) => (typeof r === 'string' ? r : r.roleName)?.toLowerCase() === 'admin'
  );
  const hasDenyOverride = user?.permissions?.some(
    (p) => p.permission?.permissionCode === 'ITEM_CATEGORY_DELETE' && p.effect === 'DENY'
  );
  const canDelete = isAdmin && !hasDenyOverride;

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useGetItemCategoriesQuery({ typeFilter: 'MASTER' });

  const [updateItemCategoryStatusMutation] = useUpdateItemCategoryStatusMutation();
  const [deleteItemCategoryMutation] = useDeleteItemCategoryMutation();

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Delete confirmation modal states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deactivateCandidate, setDeactivateCandidate] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  const itemCategories = useMemo(() => {
    const list = categoriesData?.itemCategories || categoriesData?.categories || (Array.isArray(categoriesData) ? categoriesData : []);
    const valid = list.filter((c) => !isSystemCode(c.categoryCode));

    // Sort to show 4 fixed categories at the top (Raw, Filter, Coil, AHU)
    return [...valid].sort((a, b) => {
      const aFixed = FIXED_CODES.indexOf(a.categoryCode?.toUpperCase());
      const bFixed = FIXED_CODES.indexOf(b.categoryCode?.toUpperCase());
      if (aFixed !== -1 && bFixed !== -1) return aFixed - bFixed;
      if (aFixed !== -1) return -1;
      if (bFixed !== -1) return 1;
      return (a.categoryName || '').localeCompare(b.categoryName || '');
    });
  }, [categoriesData]);

  const loading = categoriesLoading;

  const handleStatusToggle = async (category) => {
    const nextStatus = category.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to mark "${category.categoryName}" (${category.categoryCode}) as ${nextStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(category._id);
    try {
      await updateItemCategoryStatusMutation({ id: category._id, status: nextStatus }).unwrap();
    } catch (err) {
      console.error("Failed to update category status:", err);
      setError(err?.data?.message || err?.message || 'Failed to update category status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (category) => {
    setError('');
    setSuccessMessage('');
    setDeactivateCandidate(null);
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const target = categoryToDelete;
    setDeleteLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await deleteItemCategoryMutation(target._id).unwrap();
      setSuccessMessage(res?.message || `Item category "${target.categoryName}" deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setDeactivateCandidate(null);
    } catch (err) {
      console.error("Failed to delete item category:", err);
      const errMsg = err?.data?.message || err?.message || 'Failed to delete category';
      setError(errMsg);
      setDeactivateCandidate(target);
      setIsDeleteDialogOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return itemCategories.filter((cat) => {
      // Status filter
      if (statusFilter !== 'all' && cat.status !== statusFilter) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (cat.categoryCode || '').toLowerCase();
      const name = (cat.categoryName || '').toLowerCase();
      const desc = (cat.description || '').toLowerCase();

      return (
        code.includes(term) ||
        name.includes(term) ||
        desc.includes(term)
      );
    });
  }, [itemCategories, searchTerm, statusFilter]);

  const columns = [
    {
      key: 'categoryCode',
      header: 'Category Code',
      width: '150px',
      render: (val) => {
        const isFixed = FIXED_CODES.includes(String(val).toUpperCase());
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
              {val}
            </span>
            {isFixed && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Fixed
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'categoryName',
      header: 'Category Name',
      width: '200px',
      render: (val, row) => {
        const isFixed = FIXED_CODES.includes(String(row.categoryCode).toUpperCase());
        return (
          <div className="flex items-center gap-2">
            <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>
            {isFixed && (
              <CheckCircle2 size={13} className="text-blue-500" title="Fixed System Category" />
            )}
          </div>
        );
      },
    },
    {
      key: 'itemGroup',
      header: 'Item Group',
      width: '150px',
      render: (_, row) => {
        const grp = row.itemGroup;
        if (!grp) return <span className="text-slate-400 italic text-xs">—</span>;
        const name = typeof grp === 'object' ? grp.groupName : grp;
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            {name}
          </span>
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
      width: canDelete ? '240px' : '180px',
      render: (_, row) => {
        const isFixed = FIXED_CODES.includes(String(row.categoryCode).toUpperCase());
        return (
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
            {canDelete && (
              isFixed ? (
                <span
                  className="text-[11px] text-slate-400 italic px-2 py-1"
                  title="Fixed system categories cannot be deleted"
                >
                  System
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteClick(row)}
                  title="Delete Category"
                  style={{
                    color: 'var(--danger-600)',
                  }}
                >
                  Delete
                </Button>
              )
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Item Categories"
        description="Predefined system categories (Raw, Filter, Coil, AHU) and category technical specifications."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Item Categories' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={refetchCategories}>
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

      {error && (
        <Alert
          type="danger"
          message={error}
          onClose={() => {
            setError('');
            setDeactivateCandidate(null);
          }}
        >
          {deactivateCandidate && deactivateCandidate.status === 'active' && canEdit && (
            <div className="mt-2.5 pt-2 border-t border-red-200/80 flex items-center justify-between gap-3">
              <span className="text-xs text-red-800 font-medium">
                Recommendation: Deactivate this category to safely retire it without breaking existing quotes or inventory.
              </span>
              <Button
                size="sm"
                variant="secondary"
                icon={Power}
                onClick={async () => {
                  const cat = deactivateCandidate;
                  setError('');
                  setDeactivateCandidate(null);
                  await handleStatusToggle(cat);
                }}
              >
                Deactivate Instead
              </Button>
            </div>
          )}
        </Alert>
      )}
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input className="pl-8"
              placeholder="Search by category code, name, or description..."
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
          data={filteredCategories}
          loading={loading}
          emptyTitle="No Item Categories found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or filters.'
              : 'Click "Add Category" above to create an item category record.'
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
        onSuccess={refetchCategories}
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

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Item Category"
        message={
          categoryToDelete
            ? `Are you sure you want to permanently delete category "${categoryToDelete.categoryName}" (${categoryToDelete.categoryCode})? Any assigned technical specifications will be safely detached. Categories referenced by actual Items or transactional records cannot be deleted and must be deactivated instead.`
            : 'Are you sure you want to delete this category?'
        }
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default ItemCategoryList;
