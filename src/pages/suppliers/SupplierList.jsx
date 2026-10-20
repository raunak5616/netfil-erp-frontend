import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuppliers, updateSupplierStatus, approveOrRejectSupplier } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/FormField';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  RefreshCw,
  Power,
  Phone,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';

const SupplierList = () => {
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useAuth();

  const canCreate = hasPermission('SUPPLIER_CREATE') || hasPermission('PARTY_CREATE');
  const canEdit = hasPermission('SUPPLIER_EDIT') || hasPermission('PARTY_EDIT');

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  // Rejection modal state
  const [rejectingSupplier, setRejectingSupplier] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchSupplierData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSuppliers({ approvalStatus: 'all', limit: 200 });
      if (data.success && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error('Failed to fetch Suppliers:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const handleStatusToggle = async (supplier) => {
    const nextStatus = supplier.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to mark supplier "${supplier.supplierName}" (${supplier.supplierCode}) as ${nextStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(supplier._id);
    setError('');
    setSuccessMsg('');
    try {
      const res = await updateSupplierStatus(supplier._id, nextStatus);
      if (res.success) {
        setSuppliers((prev) =>
          prev.map((s) => (s._id === supplier._id ? { ...s, status: nextStatus } : s))
        );
        setSuccessMsg(`Supplier "${supplier.supplierName}" status updated to ${nextStatus}.`);
      }
    } catch (err) {
      console.error('Failed to update supplier status:', err);
      setError(err.response?.data?.message || 'Failed to update supplier status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (supplier) => {
    if (!window.confirm(`Are you sure you want to approve supplier "${supplier.supplierName}" (${supplier.supplierCode})?`)) {
      return;
    }
    setActionLoading(`approve_${supplier._id}`);
    setError('');
    setSuccessMsg('');
    try {
      const res = await approveOrRejectSupplier(supplier._id, { action: 'APPROVE' });
      if (res.success) {
        setSuppliers((prev) => prev.map((s) => (s._id === supplier._id ? res.supplier : s)));
        setSuccessMsg(`Supplier "${supplier.supplierName}" (${supplier.supplierCode}) approved successfully.`);
      }
    } catch (err) {
      console.error('Approval failed:', err);
      setError(err.response?.data?.message || 'Failed to approve supplier');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectModal = (supplier) => {
    setRejectingSupplier(supplier);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingSupplier) return;
    if (!rejectionReason.trim()) {
      setError('Please provide a specific rejection reason.');
      return;
    }
    setActionLoading(`reject_${rejectingSupplier._id}`);
    setError('');
    setSuccessMsg('');
    try {
      const res = await approveOrRejectSupplier(rejectingSupplier._id, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
      });
      if (res.success) {
        setSuppliers((prev) =>
          prev.map((s) => (s._id === rejectingSupplier._id ? res.supplier : s))
        );
        setSuccessMsg(`Supplier "${rejectingSupplier.supplierName}" (${rejectingSupplier.supplierCode}) has been rejected.`);
        setIsRejectModalOpen(false);
        setRejectingSupplier(null);
        setRejectionReason('');
      }
    } catch (err) {
      console.error('Rejection failed:', err);
      setError(err.response?.data?.message || 'Failed to reject supplier');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      // Status filter
      if (statusFilter !== 'all' && supplier.status !== statusFilter) return false;

      // Approval filter
      const appStatus = supplier.approvalStatus || 'APPROVED';
      if (approvalFilter !== 'all' && appStatus !== approvalFilter) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (supplier.supplierCode || '').toLowerCase();
      const name = (supplier.supplierName || '').toLowerCase();
      const legal = (supplier.legalName || '').toLowerCase();
      const contact = (supplier.contactPerson || '').toLowerCase();
      const phone = (supplier.phone || supplier.alternatePhone || '').toLowerCase();
      const email = (supplier.email || '').toLowerCase();
      const city = (supplier.city || '').toLowerCase();
      const state = (supplier.state || '').toLowerCase();
      const gstin = (supplier.gstin || '').toLowerCase();
      const pan = (supplier.pan || '').toLowerCase();

      return (
        code.includes(term) ||
        name.includes(term) ||
        legal.includes(term) ||
        contact.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        city.includes(term) ||
        state.includes(term) ||
        gstin.includes(term) ||
        pan.includes(term)
      );
    });
  }, [suppliers, searchTerm, statusFilter, approvalFilter]);

  const columns = useMemo(() => [
    {
      key: 'supplierCode',
      header: 'Supplier Code',
      width: '120px',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => navigate(`/suppliers/${row._id}`)}
          className="font-mono font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer text-left whitespace-nowrap text-xs"
          title={`View ${val}`}
        >
          {val}
        </button>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier Name',
      width: '260px',
      render: (val, row) => {
        const tradeName = row.legalName || row.tradeName;
        const hasDifferentTradeName = tradeName && tradeName.trim().toLowerCase() !== (val || '').trim().toLowerCase();
        return (
          <div className="flex flex-col min-w-[200px] max-w-[300px]">
            <button
              type="button"
              onClick={() => navigate(`/suppliers/${row._id}`)}
              className="font-medium text-slate-900 hover:text-blue-700 text-left transition-colors cursor-pointer text-xs truncate"
              title={val}
            >
              {val}
            </button>
            {hasDifferentTradeName && (
              <span className="text-[11px] text-slate-500 truncate" title={tradeName}>
                {tradeName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'contactPerson',
      header: 'Contact',
      width: '150px',
      render: (_, row) => (
        <div className="flex flex-col gap-0.5 text-xs min-w-0 max-w-[145px]">
          <span className="font-medium text-slate-800 truncate" title={row.contactPerson || '—'}>
            {row.contactPerson || '—'}
          </span>
          {(row.phone || row.alternatePhone) && (
            <span className="text-slate-500 text-[11px] flex items-center gap-1 truncate" title={row.phone || row.alternatePhone}>
              <Phone size={10} className="text-slate-400 shrink-0" />
              <span className="truncate">{row.phone || row.alternatePhone}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email / Location',
      width: '180px',
      render: (_, row) => {
        const location = [row.city, row.state].filter(Boolean).join(', ');
        return (
          <div className="flex flex-col gap-0.5 text-xs min-w-0 max-w-[170px]">
            {row.email ? (
              <span className="text-slate-700 flex items-center gap-1 truncate" title={row.email}>
                <Mail size={10} className="text-slate-400 shrink-0" />
                <span className="truncate">{row.email}</span>
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">—</span>
            )}
            {location && (
              <span className="text-[11px] text-slate-500 truncate" title={location}>
                {location}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'gstin',
      header: 'GSTIN / PAN',
      width: '150px',
      render: (_, row) => {
        const pan = row.pan || (row.gstin && row.gstin.length === 15 ? row.gstin.substring(2, 12) : null);
        return (
          <div className="flex flex-col gap-0.5">
            {row.gstin ? (
              <span className="font-mono text-xs font-medium text-slate-800">{row.gstin}</span>
            ) : (
              <span className="text-xs text-slate-400">Unregistered</span>
            )}
            {pan && (
              <span className="font-mono text-[10.5px] text-slate-500">PAN: {pan}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '90px',
      render: (val) => {
        const isActive = val === 'active';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border leading-tight ${
              isActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'approvalStatus',
      header: 'Approval',
      width: '130px',
      render: (val) => {
        const status = val || 'APPROVED';
        const badges = {
          APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
          REJECTED: 'bg-red-50 text-red-800 border-red-200',
        };
        const labels = {
          APPROVED: 'Approved',
          PENDING_APPROVAL: 'Pending Approval',
          REJECTED: 'Rejected',
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border leading-tight ${
              badges[status] || badges.APPROVED
            }`}
          >
            {labels[status] || status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '150px',
      render: (_, row) => {
        const isPending = row.approvalStatus === 'PENDING_APPROVAL';
        return (
          <div className="flex items-center justify-end gap-1.5 min-w-[130px] whitespace-nowrap">
            {/* View Icon */}
            <button
              type="button"
              onClick={() => navigate(`/suppliers/${row._id}`)}
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
              title="View Supplier Details"
              aria-label="View Supplier Details"
            >
              <Eye size={13} />
            </button>

            {/* Edit Icon */}
            {canEdit && (
              <button
                type="button"
                onClick={() => navigate(`/suppliers/${row._id}/edit`)}
                className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Edit Supplier"
                aria-label="Edit Supplier"
              >
                <Edit size={13} />
              </button>
            )}

            {/* Approve & Reject for Admin & PENDING_APPROVAL */}
            {isAdmin && isPending && (
              <>
                <button
                  type="button"
                  disabled={actionLoading === `approve_${row._id}`}
                  onClick={() => handleApprove(row)}
                  className="w-7 h-7 inline-flex items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                  title="Approve Supplier"
                  aria-label="Approve Supplier"
                >
                  <CheckCircle size={13} />
                </button>
                <button
                  type="button"
                  disabled={actionLoading === `reject_${row._id}`}
                  onClick={() => handleOpenRejectModal(row)}
                  className="w-7 h-7 inline-flex items-center justify-center rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400 transition-colors cursor-pointer disabled:opacity-50"
                  title="Reject Supplier"
                  aria-label="Reject Supplier"
                >
                  <XCircle size={13} />
                </button>
              </>
            )}

            {/* Activate/Deactivate Toggle for Approved/Rejected records */}
            {canEdit && !isPending && (
              <button
                type="button"
                disabled={actionLoading === row._id}
                onClick={() => handleStatusToggle(row)}
                className={`w-7 h-7 inline-flex items-center justify-center rounded border transition-colors cursor-pointer disabled:opacity-50 ${
                  row.status === 'active'
                    ? 'border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'
                }`}
                title={row.status === 'active' ? 'Deactivate Supplier' : 'Activate Supplier'}
                aria-label={row.status === 'active' ? 'Deactivate Supplier' : 'Activate Supplier'}
              >
                <Power size={13} />
              </button>
            )}
          </div>
        );
      },
    },
  ], [canEdit, isAdmin, actionLoading, navigate]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Supplier Master"
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Purchase & Procurement' },
          { label: 'Supplier Master' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={loading}
              onClick={fetchSupplierData}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => navigate('/suppliers/create')}
              >
                Add Supplier
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        {/* Horizontal Responsive Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-[380px] md:w-[420px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search supplier code, name, contact, phone, email, city, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '28px', height: '32px', fontSize: '12px' }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '32px', fontSize: '12px', minWidth: '125px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>

            <Select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              style={{ height: '32px', fontSize: '12px', minWidth: '145px' }}
            >
              <option value="all">All Approvals</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={loading}
          emptyTitle="No Supplier records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all' || approvalFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Supplier" above to register your first procurement vendor.'
          }
        />

        {/* Compact Footer Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="font-medium text-slate-700">{filteredSuppliers.length}</strong> of{' '}
            <strong className="font-medium text-slate-700">{suppliers.length}</strong> suppliers
          </span>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingSupplier && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => {
            setIsRejectModalOpen(false);
            setRejectingSupplier(null);
          }}
          title="Reject Supplier Master"
          maxWidth="460px"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectingSupplier(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                disabled={!rejectionReason.trim() || !!actionLoading}
                loading={actionLoading === `reject_${rejectingSupplier._id}`}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-700">
              Are you sure you want to reject supplier <strong>{rejectingSupplier.supplierName}</strong> ({rejectingSupplier.supplierCode})?
            </p>
            <div className="bg-red-50 border border-red-200 p-2.5 rounded text-red-800 text-[11.5px]">
              This supplier will be marked as REJECTED and blocked from purchase transactions until updated and resubmitted.
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="Specify the reason for rejecting this supplier registration..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SupplierList;
