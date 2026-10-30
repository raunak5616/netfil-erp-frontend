import React, { useState, useMemo } from 'react';
import { useGetClientsQuery, useApproveOrRejectClientMutation } from '../../features/masterData/masterDataApi';
import { useGetSuppliersQuery, useApproveOrRejectSupplierMutation } from '../../features/suppliers/suppliersApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/FormField';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle
} from 'lucide-react';

const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('pending-parties');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    data: clientsData,
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useGetClientsQuery({ approvalStatus: 'all', limit: 200 });

  const {
    data: suppliersData,
    isLoading: suppliersLoading,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useGetSuppliersQuery({ approvalStatus: 'all', limit: 200 });

  const [approveOrRejectClientMutation] = useApproveOrRejectClientMutation();
  const [approveOrRejectSupplierMutation] = useApproveOrRejectSupplierMutation();

  const loading = clientsLoading || suppliersLoading;

  const parties = useMemo(() => {
    return clientsData?.clients || (Array.isArray(clientsData) ? clientsData : []);
  }, [clientsData]);

  const suppliers = useMemo(() => {
    return suppliersData?.suppliers || (Array.isArray(suppliersData) ? suppliersData : []);
  }, [suppliersData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [masterTypeFilter, setMasterTypeFilter] = useState('all'); // for approved/rejected tabs: 'all' | 'party' | 'supplier'

  // Action Modals State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Metrics
  const metrics = useMemo(() => {
    const pendingPartiesCount = parties.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
    const pendingSuppliersCount = suppliers.filter((s) => s.approvalStatus === 'PENDING_APPROVAL').length;

    const approvedCount =
      parties.filter((p) => p.approvalStatus === 'APPROVED' || !p.approvalStatus).length +
      suppliers.filter((s) => s.approvalStatus === 'APPROVED' || !s.approvalStatus).length;

    const rejectedCount =
      parties.filter((p) => p.approvalStatus === 'REJECTED').length +
      suppliers.filter((s) => s.approvalStatus === 'REJECTED').length;

    return {
      pendingPartiesCount,
      pendingSuppliersCount,
      approvedCount,
      rejectedCount,
    };
  }, [parties, suppliers]);

  // Handle Approve Action
  const handleApprove = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (selectedRecord.masterType === 'party') {
        await approveOrRejectClientMutation({ id: selectedRecord._id, action: 'APPROVE' }).unwrap();
        setSuccessMsg(`Party "${selectedRecord.companyName}" (${selectedRecord.clientCode}) approved successfully.`);
      } else {
        await approveOrRejectSupplierMutation({ id: selectedRecord._id, action: 'APPROVE' }).unwrap();
        setSuccessMsg(`Supplier "${selectedRecord.supplierName}" (${selectedRecord.supplierCode}) approved successfully.`);
      }
      setIsApproveOpen(false);
      setIsDetailOpen(false);
    } catch (err) {
      console.error('Approval failed:', err);
      setError(err?.data?.message || err?.message || 'Failed to approve record');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Action
  const handleReject = async () => {
    if (!selectedRecord) return;
    if (!rejectionReason.trim()) {
      setError('Please provide a specific rejection reason.');
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (selectedRecord.masterType === 'party') {
        await approveOrRejectClientMutation({
          id: selectedRecord._id,
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }).unwrap();
        setSuccessMsg(`Party "${selectedRecord.companyName}" (${selectedRecord.clientCode}) rejected.`);
      } else {
        await approveOrRejectSupplierMutation({
          id: selectedRecord._id,
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }).unwrap();
        setSuccessMsg(`Supplier "${selectedRecord.supplierName}" (${selectedRecord.supplierCode}) rejected.`);
      }
      setIsRejectOpen(false);
      setRejectionReason('');
      setIsDetailOpen(false);
    } catch (err) {
      console.error('Rejection failed:', err);
      setError(err?.data?.message || err?.message || 'Failed to reject record');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered dataset according to active tab
  const tabData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = (item) => {
      if (!term) return true;
      return (
        (item.code || '').toLowerCase().includes(term) ||
        (item.name || '').toLowerCase().includes(term) ||
        (item.legalName || '').toLowerCase().includes(term) ||
        (item.contactPerson || '').toLowerCase().includes(term) ||
        (item.city || '').toLowerCase().includes(term)
      );
    };

    if (activeTab === 'pending-parties') {
      return parties
        .filter((p) => p.approvalStatus === 'PENDING_APPROVAL')
        .map((p) => ({ ...p, masterType: 'party', code: p.clientCode, name: p.companyName }))
        .filter(matchesSearch);
    }

    if (activeTab === 'pending-suppliers') {
      return suppliers
        .filter((s) => s.approvalStatus === 'PENDING_APPROVAL')
        .map((s) => ({ ...s, masterType: 'supplier', code: s.supplierCode, name: s.supplierName }))
        .filter(matchesSearch);
    }

    if (activeTab === 'approved') {
      const pList = parties
        .filter((p) => p.approvalStatus === 'APPROVED' || !p.approvalStatus)
        .map((p) => ({ ...p, masterType: 'party', code: p.clientCode, name: p.companyName }));
      const sList = suppliers
        .filter((s) => s.approvalStatus === 'APPROVED' || !s.approvalStatus)
        .map((s) => ({ ...s, masterType: 'supplier', code: s.supplierCode, name: s.supplierName }));

      let combined = [];
      if (masterTypeFilter === 'all') combined = [...pList, ...sList];
      else if (masterTypeFilter === 'party') combined = pList;
      else if (masterTypeFilter === 'supplier') combined = sList;

      return combined.filter(matchesSearch);
    }

    if (activeTab === 'rejected') {
      const pList = parties
        .filter((p) => p.approvalStatus === 'REJECTED')
        .map((p) => ({ ...p, masterType: 'party', code: p.clientCode, name: p.companyName }));
      const sList = suppliers
        .filter((s) => s.approvalStatus === 'REJECTED')
        .map((s) => ({ ...s, masterType: 'supplier', code: s.supplierCode, name: s.supplierName }));

      let combined = [];
      if (masterTypeFilter === 'all') combined = [...pList, ...sList];
      else if (masterTypeFilter === 'party') combined = pList;
      else if (masterTypeFilter === 'supplier') combined = sList;

      return combined.filter(matchesSearch);
    }

    return [];
  }, [activeTab, parties, suppliers, searchTerm, masterTypeFilter]);

  // Columns definition (6 clean columns)
  const columns = useMemo(() => {
    return [
      {
        key: 'code',
        header: 'Code',
        width: '130px',
        render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-mono font-medium text-slate-800 text-xs">{val}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {row.masterType === 'party' ? 'Party' : 'Supplier'}
            </span>
          </div>
        ),
      },
      {
        key: 'name',
        header: 'Company / Trade Name',
        width: '240px',
        render: (val, row) => (
          <div>
            <div className="font-medium text-slate-900 text-xs">{val}</div>
            {row.legalName && row.legalName !== val && (
              <div className="text-[11px] text-slate-500 truncate">{row.legalName}</div>
            )}
          </div>
        ),
      },
      {
        key: 'contactPerson',
        header: 'Contact & Phone',
        width: '180px',
        render: (_, row) => (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium text-slate-800">{row.contactPerson || '—'}</span>
            {(row.mobile || row.phone) && (
              <span className="text-slate-500 text-[11px]">
                {row.mobile || row.phone}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'submittedBy',
        header: 'Created By / Date',
        width: '180px',
        render: (_, row) => {
          const creator = row.createdBy?.fullName || row.createdBy?.username || 'System / Legacy';
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-medium text-slate-800">{creator}</span>
              <span className="text-slate-500 text-[11px]">{formatDate(row.createdAt)}</span>
            </div>
          );
        },
      },
      {
        key: 'approvalStatus',
        header: 'Status',
        width: '140px',
        render: (val, row) => (
          <div className="flex flex-col gap-1 items-start">
            <StatusBadge status={val || 'APPROVED'} />
            {row.approvalStatus === 'REJECTED' && row.rejectionReason && (
              <span className="text-[10.5px] text-red-600 truncate max-w-[180px]" title={row.rejectionReason}>
                {row.rejectionReason}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '190px',
        render: (_, row) => (
          <div className="inline-flex gap-1.5 items-center justify-end">
            <Button
              variant="secondary"
              size="sm"
              icon={Eye}
              onClick={() => {
                setSelectedRecord(row);
                setIsDetailOpen(true);
              }}
            >
              Review
            </Button>

            {row.approvalStatus === 'PENDING_APPROVAL' && (
              <>
                <Button
                  size="sm"
                  className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-transparent"
                  onClick={() => {
                    setSelectedRecord(row);
                    setIsApproveOpen(true);
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setSelectedRecord(row);
                    setRejectionReason('');
                    setIsRejectOpen(true);
                  }}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        ),
      },
    ];
  }, []);

  const approvalTabs = [
    { key: 'pending-parties', label: 'Pending Parties', count: metrics.pendingPartiesCount },
    { key: 'pending-suppliers', label: 'Pending Suppliers', count: metrics.pendingSuppliersCount },
    { key: 'approved', label: 'Approved', count: metrics.approvedCount },
    { key: 'rejected', label: 'Rejected', count: metrics.rejectedCount },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Approvals"
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Admin Approvals' },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={() => {
              refetchClients();
              refetchSuppliers();
            }}
          >
            Refresh
          </Button>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Horizontal Tabs */}
      <Tabs
        tabs={approvalTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {(activeTab === 'approved' || activeTab === 'rejected') && (
            <Select
              value={masterTypeFilter}
              onChange={(e) => setMasterTypeFilter(e.target.value)}
              style={{ width: '130px', height: '32px', fontSize: '12px' }}
            >
              <option value="all">All Types</option>
              <option value="party">Parties</option>
              <option value="supplier">Suppliers</option>
            </Select>
          )}
        </div>

        <div className="relative w-full sm:w-64 sm:ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search code, name, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '28px' }}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tabData}
        loading={loading}
        emptyTitle="No approval records"
        emptyDescription="There are no records matching the selected tab or search criteria."
      />

      {/* REVIEW DETAILS MODAL */}
      {selectedRecord && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Review Master Record: ${selectedRecord.code}`}
          maxWidth="640px"
          footer={
            <div className="flex justify-between w-full">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
              {selectedRecord.approvalStatus === 'PENDING_APPROVAL' && (
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    icon={XCircle}
                    onClick={() => {
                      setRejectionReason('');
                      setIsRejectOpen(true);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle}
                    style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
                    onClick={() => setIsApproveOpen(true)}
                  >
                    Approve Record
                  </Button>
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Record Type</span>
                <span className="font-bold text-slate-800">
                  {selectedRecord.masterType === 'party' ? 'Party (Client Master)' : 'Supplier Master'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Current Status</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={selectedRecord.status} />
                  <StatusBadge status={selectedRecord.approvalStatus || 'APPROVED'} />
                </div>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Code</span>
                <span className="font-mono font-bold text-primary-700">{selectedRecord.code}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Name</span>
                <span className="font-semibold text-slate-900">{selectedRecord.name}</span>
              </div>
            </div>

            {/* Rejection Alert if rejected */}
            {selectedRecord.approvalStatus === 'REJECTED' && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs space-y-1">
                <span className="font-bold text-red-900 flex items-center gap-1">
                  <AlertTriangle size={14} className="text-red-600" /> Rejection Details
                </span>
                <p className="text-red-800">{selectedRecord.rejectionReason || 'No reason specified'}</p>
                {selectedRecord.rejectedBy && (
                  <div className="text-[11px] text-red-600">
                    Reviewed by: {selectedRecord.rejectedBy.fullName || selectedRecord.rejectedBy.username} on{' '}
                    {formatDate(selectedRecord.rejectedAt)}
                  </div>
                )}
              </div>
            )}

            {/* Contact details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border rounded-lg bg-white space-y-1">
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Contact Person</span>
                <span className="font-medium text-slate-900">{selectedRecord.contactPerson || '—'}</span>
                <div className="text-slate-600 flex items-center gap-1 pt-1">
                  <Phone size={12} className="text-primary-600" />
                  {selectedRecord.mobile || selectedRecord.phone || '—'}
                </div>
              </div>

              <div className="p-3 border rounded-lg bg-white space-y-1">
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Email & Location</span>
                <div className="text-slate-600 flex items-center gap-1">
                  <Mail size={12} className="text-primary-600" />
                  {selectedRecord.email || '—'}
                </div>
                <div className="text-slate-600 flex items-center gap-1 pt-1">
                  <MapPin size={12} className="text-primary-600" />
                  {[selectedRecord.city, selectedRecord.state, selectedRecord.country || 'India'].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 border rounded-lg bg-white text-xs space-y-1">
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Complete Address</span>
              <p className="text-slate-800">
                {[selectedRecord.address, selectedRecord.addressLine2, selectedRecord.city, selectedRecord.state, selectedRecord.pincode, selectedRecord.country || 'India'].filter(Boolean).join(', ') || 'No address specified'}
              </p>
            </div>

            {/* Tax & Commercial Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border rounded-lg bg-white space-y-1">
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Tax Registration</span>
                <div className="font-mono text-slate-800">GSTIN: {selectedRecord.gstin || 'Unregistered'}</div>
                {selectedRecord.pan && <div className="font-mono text-slate-800">PAN: {selectedRecord.pan}</div>}
              </div>

              <div className="p-3 border rounded-lg bg-white space-y-1">
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Terms & Payment</span>
                <div>Payment Terms: {selectedRecord.paymentTerms || 'Standard'}</div>
                {selectedRecord.creditDays !== undefined && (
                  <div>Credit Days: {selectedRecord.creditDays} days</div>
                )}
              </div>
            </div>

            {/* Audit / Creator details */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">Submitted By</span>
                <span className="font-medium text-slate-800">
                  {selectedRecord.createdBy?.fullName || selectedRecord.createdBy?.username || '—'}
                </span>
                <div className="text-[11px] text-slate-500">{formatDate(selectedRecord.createdAt)}</div>
              </div>

              {selectedRecord.approvedBy && (
                <div>
                  <span className="text-slate-500 uppercase font-semibold block text-[10px]">Approved By</span>
                  <span className="font-medium text-slate-800">
                    {selectedRecord.approvedBy.fullName || selectedRecord.approvedBy.username}
                  </span>
                  <div className="text-[11px] text-slate-500">{formatDate(selectedRecord.approvedAt)}</div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {selectedRecord && (
        <Modal
          isOpen={isApproveOpen}
          onClose={() => setIsApproveOpen(false)}
          title="Confirm Master Record Approval"
          maxWidth="480px"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsApproveOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={CheckCircle}
                loading={actionLoading}
                style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
                onClick={handleApprove}
              >
                Confirm Approval
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-slate-700">
              Are you sure you want to approve <strong>{selectedRecord.name}</strong> ({selectedRecord.code})?
            </p>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-800">
              Once approved, this record will be immediately available and selectable in enquiries, quotations, purchase orders, and other business transactions.
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT WITH REASON MODAL */}
      {selectedRecord && (
        <Modal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          title="Reject Master Record"
          maxWidth="500px"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsRejectOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={XCircle}
                loading={actionLoading}
                disabled={!rejectionReason.trim()}
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <p className="text-slate-700">
              Rejecting <strong>{selectedRecord.name}</strong> ({selectedRecord.code}).
            </p>
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-800">
              This record will remain blocked from all transaction selectors until revised and resubmitted by the creator.
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="State the reason (e.g. Missing valid GSTIN registration, invalid phone number, duplicate company)..."
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

export default AdminApprovals;
