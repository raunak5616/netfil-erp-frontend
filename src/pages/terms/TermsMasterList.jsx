import React, { useState, useMemo } from 'react';
import { 
  useGetTermsQuery, 
  useUpdateTermStatusMutation, 
  useDeleteTermMutation 
} from '../../features/masterData/masterDataApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import TermFormModal from './TermFormModal';
import DeleteTermModal from './DeleteTermModal';
import {
  Truck,
  CreditCard,
  Plus,
  Search,
  Edit,
  Power,
  Trash2,
  RefreshCw,
  Layers,
  FileText
} from 'lucide-react';

const TAB_DELIVERY = 'DELIVERY';
const TAB_PAYMENT = 'PAYMENT';

const TermsMasterList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('TERM_CREATE');
  const canEdit = hasPermission('TERM_EDIT');
  const canDelete = hasPermission('TERM_DELETE');

  // Active Tab state ('DELIVERY' | 'PAYMENT')
  const [activeTab, setActiveTab] = useState(TAB_DELIVERY);

  // RTK Query hooks
  const { data: termsData, isLoading: loading, error: queryError, refetch } = useGetTermsQuery();
  const [updateTermStatusMutation] = useUpdateTermStatusMutation();
  const [deleteTermMutation] = useDeleteTermMutation();

  const terms = termsData?.terms || [];
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tab counts for quick metrics
  const deliveryCount = useMemo(
    () => terms.filter((t) => t.termType === TAB_DELIVERY).length,
    [terms]
  );
  const paymentCount = useMemo(
    () => terms.filter((t) => t.termType === TAB_PAYMENT).length,
    [terms]
  );

  // Filtered terms for the currently active tab
  const tabFilteredTerms = useMemo(() => {
    const list = terms.filter((term) => {
      // 1. Strict tab match: Delivery Terms NEVER show Payment Terms & vice-versa
      if (term.termType !== activeTab) return false;

      // 2. Status filter
      if (statusFilter !== 'all') {
        const isTermActive = term.isActive !== undefined ? term.isActive : term.status === 'active';
        if (statusFilter === 'active' && !isTermActive) return false;
        if (statusFilter === 'inactive' && isTermActive) return false;
      }

      // 3. Search filter
      if (!searchTerm.trim()) return true;

      const termLower = searchTerm.toLowerCase();
      const name = (term.termName || '').toLowerCase();
      const desc = (term.description || '').toLowerCase();

      return name.includes(termLower) || desc.includes(termLower);
    });

    // Natural alphanumeric sorting
    return [...list].sort((a, b) =>
      (a.termName || '').localeCompare(b.termName || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }, [terms, activeTab, statusFilter, searchTerm]);

  // Fast toggle status (activate / deactivate)
  const handleToggleStatus = async (term) => {
    try {
      const newActiveState = !(term.isActive !== undefined ? term.isActive : term.status === 'active');
      await updateTermStatusMutation({ id: term._id, statusOrIsActive: newActiveState }).unwrap();
      setSuccessMessage(
        `${term.termType === TAB_DELIVERY ? 'Delivery' : 'Payment'} term "${
          term.termName
        }" ${newActiveState ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err) {
      console.error('Failed to toggle term status:', err);
      setError(err?.data?.message || err?.message || 'Failed to update term status');
    }
  };

  // Open delete modal
  const handleDeleteClick = (term) => {
    setError('');
    setSuccessMessage('');
    setTermToDelete(term);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!termToDelete) return;
    setDeleteLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await deleteTermMutation(termToDelete._id).unwrap();
      setSuccessMessage(
        res?.message ||
          `${termToDelete.termType === TAB_DELIVERY ? 'Delivery' : 'Payment'} term "${
            termToDelete.termName
          }" deleted successfully.`
      );
      setIsDeleteDialogOpen(false);
      setTermToDelete(null);
    } catch (err) {
      console.error('Failed to delete term:', err);
      setError(err?.data?.message || err?.message || 'Failed to delete term');
      setIsDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open form modal for new term (inherits active tab automatically)
  const handleAddNewTerm = () => {
    setError('');
    setSuccessMessage('');
    setEditingTerm(null);
    setIsFormOpen(true);
  };

  // Open form modal for editing term
  const handleEditClick = (term) => {
    setError('');
    setSuccessMessage('');
    setEditingTerm(term);
    setIsFormOpen(true);
  };

  const columns = [
    {
      key: 'termName',
      header: 'Term Name',
      width: '240px',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
            {val}
          </span>
          <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
            ID: {row._id ? String(row._id).slice(-6) : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description / Contractual Clause',
      render: (val) =>
        val ? (
          <span className="text-slate-700 line-clamp-2 max-w-xl text-xs">{val}</span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">— No description —</span>
        ),
    },
    {
      key: 'termType',
      header: 'Term Type',
      width: '130px',
      render: (val) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
            val === TAB_DELIVERY
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {val === TAB_DELIVERY ? <Truck size={12} /> : <CreditCard size={12} />}
          {val}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '110px',
      render: (val, row) => {
        const isCurrentActive = val !== undefined ? val : row.status === 'active';
        return <StatusBadge status={isCurrentActive ? 'active' : 'inactive'} />;
      },
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      width: '130px',
      render: (val) => (
        <span className="text-slate-500 text-[11px]">
          {val
            ? new Date(val).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '130px',
      render: (_, row) => {
        const isCurrentActive = row.isActive !== undefined ? row.isActive : row.status === 'active';
        return (
          <div className="flex justify-end gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={Edit}
                onClick={() => handleEditClick(row)}
                title="Edit Term"
              />
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={Power}
                className={
                  isCurrentActive
                    ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                    : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                }
                onClick={() => handleToggleStatus(row)}
                title={isCurrentActive ? 'Deactivate Term' : 'Activate Term'}
              />
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                className="text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                onClick={() => handleDeleteClick(row)}
                title="Delete Term"
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Terms Master"
        description="Unified master management for commercial delivery and payment terms."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Master' },
          { label: 'Terms Master' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              loading={loading}
              onClick={refetch}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={handleAddNewTerm}
              >
                {activeTab === TAB_DELIVERY ? 'Add Delivery Term' : 'Add Payment Term'}
              </Button>
            )}
          </div>
        }
      />

      {/* Global Alerts */}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Top Tab Bar Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            {/* Delivery Terms Tab */}
            <button
              type="button"
              onClick={() => setActiveTab(TAB_DELIVERY)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === TAB_DELIVERY
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Truck size={15} />
              <span>Delivery Terms</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                  activeTab === TAB_DELIVERY
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {deliveryCount}
              </span>
            </button>

            {/* Payment Terms Tab */}
            <button
              type="button"
              onClick={() => setActiveTab(TAB_PAYMENT)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === TAB_PAYMENT
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <CreditCard size={15} />
              <span>Payment Terms</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                  activeTab === TAB_PAYMENT
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {paymentCount}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Single collection: <code className="font-mono text-slate-600 font-semibold">terms</code> (termType: {activeTab})
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <Input
              type="text"
              placeholder={`Search ${
                activeTab === TAB_DELIVERY ? 'delivery' : 'payment'
              } terms by name or clause...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={tabFilteredTerms}
          loading={loading}
          keyField="_id"
          emptyTitle={`No ${
            activeTab === TAB_DELIVERY ? 'Delivery' : 'Payment'
          } Terms Found`}
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'No matching records match the current filter criteria.'
              : `Create standard ${
                  activeTab === TAB_DELIVERY ? 'delivery' : 'payment'
                } terms using the button above.`
          }
        />
      </div>

      {/* Shared Create / Edit Form Modal */}
      <TermFormModal
        term={editingTerm}
        defaultTermType={activeTab}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          refetch();
        }}
      />

      {/* Shared Delete Confirmation Modal */}
      <DeleteTermModal
        term={termToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setTermToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default TermsMasterList;
