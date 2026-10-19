import React, { useState, useEffect, useMemo } from 'react';
import { getClients, approveOrRejectClient } from '../../services/clientService';
import { getSuppliers, approveOrRejectSupplier } from '../../services/supplierService';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
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
  Users,
  Truck,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle
} from 'lucide-react';

const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('pending-parties');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [parties, setParties] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [masterTypeFilter, setMasterTypeFilter] = useState('all'); // for approved/rejected tabs: 'all' | 'party' | 'supplier'

  // Action Modals State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all parties and suppliers
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [partyRes, supplierRes] = await Promise.all([
        getClients({ approvalStatus: 'all', limit: 200 }).catch(() => ({ success: false, clients: [] })),
        getSuppliers({ approvalStatus: 'all', limit: 200 }).catch(() => ({ success: false, suppliers: [] }))
      ]);

      if (partyRes.success && Array.isArray(partyRes.clients)) {
        setParties(partyRes.clients);
      }
      if (supplierRes.success && Array.isArray(supplierRes.suppliers)) {
        setSuppliers(supplierRes.suppliers);
      }
    } catch (err) {
      console.error('Failed to load approval items:', err);
      setError(err.response?.data?.message || 'Failed to fetch master records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        const res = await approveOrRejectClient(selectedRecord._id, { action: 'APPROVE' });
        if (res.success) {
          setParties((prev) =>
            prev.map((p) => (p._id === selectedRecord._id ? res.client : p))
          );
          setSuccessMsg(`Party "${selectedRecord.companyName}" (${selectedRecord.clientCode}) approved successfully.`);
        }
      } else {
        const res = await approveOrRejectSupplier(selectedRecord._id, { action: 'APPROVE' });
        if (res.success) {
          setSuppliers((prev) =>
            prev.map((s) => (s._id === selectedRecord._id ? res.supplier : s))
          );
          setSuccessMsg(`Supplier "${selectedRecord.supplierName}" (${selectedRecord.supplierCode}) approved successfully.`);
        }
      }
      setIsApproveOpen(false);
      setIsDetailOpen(false);
    } catch (err) {
      console.error('Approval failed:', err);
      setError(err.response?.data?.message || 'Failed to approve record');
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
        const res = await approveOrRejectClient(selectedRecord._id, {
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        });
        if (res.success) {
          setParties((prev) =>
            prev.map((p) => (p._id === selectedRecord._id ? res.client : p))
          );
          setSuccessMsg(`Party "${selectedRecord.companyName}" (${selectedRecord.clientCode}) rejected.`);
        }
      } else {
        const res = await approveOrRejectSupplier(selectedRecord._id, {
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        });
        if (res.success) {
          setSuppliers((prev) =>
            prev.map((s) => (s._id === selectedRecord._id ? res.supplier : s))
          );
          setSuccessMsg(`Supplier "${selectedRecord.supplierName}" (${selectedRecord.supplierCode}) rejected.`);
        }
      }
      setIsRejectOpen(false);
      setRejectionReason('');
      setIsDetailOpen(false);
    } catch (err) {
      console.error('Rejection failed:', err);
      setError(err.response?.data?.message || 'Failed to reject record');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered dataset according to active tab
  const tabData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (activeTab === 'pending-parties') {
      return parties
        .filter((p) => p.approvalStatus === 'PENDING_APPROVAL')
        .map((p) => ({ ...p, masterType: 'party', code: p.clientCode, name: p.companyName }))
        .filter((item) => {
          if (!term) return true;
          return (
            (item.code || '').toLowerCase().includes(term) ||
            (item.name || '').toLowerCase().includes(term) ||
            (item.contactPerson || '').toLowerCase().includes(term) ||
            (item.city || '').toLowerCase().includes(term)
          );
        });
    }

    if (activeTab === 'pending-suppliers') {
      return suppliers
        .filter((s) => s.approvalStatus === 'PENDING_APPROVAL')
        .map((s) => ({ ...s, masterType: 'supplier', code: s.supplierCode, name: s.supplierName }))
        .filter((item) => {
          if (!term) return true;
          return (
            (item.code || '').toLowerCase().includes(term) ||
            (item.name || '').toLowerCase().includes(term) ||
            (item.contactPerson || '').toLowerCase().includes(term) ||
            (item.city || '').toLowerCase().includes(term)
          );
        });
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

      return combined.filter((item) => {
        if (!term) return true;
        return (
          (item.code || '').toLowerCase().includes(term) ||
          (item.name || '').toLowerCase().includes(term) ||
          (item.contactPerson || '').toLowerCase().includes(term) ||
          (item.city || '').toLowerCase().includes(term)
        );
      });
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

      return combined.filter((item) => {
        if (!term) return true;
        return (
          (item.code || '').toLowerCase().includes(term) ||
          (item.name || '').toLowerCase().includes(term) ||
          (item.contactPerson || '').toLowerCase().includes(term) ||
          (item.city || '').toLowerCase().includes(term) ||
          (item.rejectionReason || '').toLowerCase().includes(term)
        );
      });
    }

    return [];
  }, [activeTab, parties, suppliers, searchTerm, masterTypeFilter]);

  // Columns definition
  const columns = useMemo(() => {
    const base = [
      {
        key: 'code',
        header: 'Code',
        width: '130px',
        render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-mono font-semibold text-primary-700">{val}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {row.masterType === 'party' ? 'Party Master' : 'Supplier Master'}
            </span>
          </div>
        ),
      },
      {
        key: 'name',
        header: 'Company / Trade Name',
        width: '230px',
        render: (val, row) => (
          <div>
            <div className="font-semibold text-slate-900">{val}</div>
            {row.legalName && row.legalName !== val && (
              <div className="text-xs text-slate-500 truncate">{row.legalName}</div>
            )}
          </div>
        ),
      },
      {
        key: 'contactPerson',
        header: 'Contact & Phone',
        width: '200px',
        render: (_, row) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-slate-800 text-xs">{row.contactPerson || '—'}</span>
            {(row.mobile || row.phone) && (
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Phone size={11} className="text-primary-600 shrink-0" />
                {row.mobile || row.phone}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'submittedBy',
        header: 'Creator & Date',
        width: '200px',
        render: (_, row) => {
          const creator = row.createdBy?.fullName || row.createdBy?.username || 'System / Legacy';
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-slate-800 flex items-center gap-1">
                <User size={11} className="text-slate-400" />
                {creator}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                {formatDate(row.createdAt)}
              </span>
            </div>
          );
        },
      },
      {
        key: 'approvalStatus',
        header: 'Approval Status',
        width: '140px',
        render: (val) => <StatusBadge status={val || 'APPROVED'} />,
      },
    ];

    if (activeTab === 'rejected') {
      base.push({
        key: 'rejectionReason',
        header: 'Rejection Reason',
        width: '250px',
        render: (val, row) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-red-700 font-medium bg-red-50 p-1.5 rounded border border-red-200">
              {val || 'No reason specified'}
            </span>
            {row.rejectedBy && (
              <span className="text-[10px] text-slate-400">
                Rejected by: {row.rejectedBy.fullName || row.rejectedBy.username} ({formatDate(row.rejectedAt)})
              </span>
            )}
          </div>
        ),
      });
    }

    base.push({
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '180px',
      render: (_, row) => (
        <div className="inline-flex gap-1.5 items-center">
          <Button
            variant="ghost"
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
                variant="primary"
                size="sm"
                icon={CheckCircle}
                style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
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
                icon={XCircle}
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
    });

    return base;
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Approval Center"
        subtitle="Authorize or reject newly submitted Party and Supplier master records"
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Admin Approvals' },
        ]}
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchData}>
            Refresh
          </Button>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* METRIC COUNTER CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('pending-parties')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'pending-parties'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Parties
            </span>
            <Users size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{metrics.pendingPartiesCount}</div>
          <div className="text-xs text-slate-500 mt-1">Clients requiring approval</div>
        </div>

        <div
          onClick={() => setActiveTab('pending-suppliers')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'pending-suppliers'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Suppliers
            </span>
            <Truck size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{metrics.pendingSuppliersCount}</div>
          <div className="text-xs text-slate-500 mt-1">Suppliers requiring approval</div>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'approved'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Records
            </span>
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{metrics.approvedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Active in transactions</div>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'rejected'
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rejected Records
            </span>
            <XCircle size={18} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">{metrics.rejectedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Excluded from transactions</div>
        </div>
      </div>

      {/* TABS & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending-parties')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending-parties'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users size={14} /> Pending Parties ({metrics.pendingPartiesCount})
            </button>

            <button
              onClick={() => setActiveTab('pending-suppliers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending-suppliers'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Truck size={14} /> Pending Suppliers ({metrics.pendingSuppliersCount})
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'approved'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle size={14} /> Approved ({metrics.approvedCount})
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rejected'
                  ? 'bg-red-100 text-red-900 border border-red-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle size={14} /> Rejected ({metrics.rejectedCount})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {(activeTab === 'approved' || activeTab === 'rejected') && (
              <Select
                value={masterTypeFilter}
                onChange={(e) => setMasterTypeFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="all">All Masters</option>
                <option value="party">Party Only</option>
                <option value="supplier">Supplier Only</option>
              </Select>
            )}

            <div className="relative w-64">
              <Input
                placeholder="Search code, name, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <DataTable
          columns={columns}
          data={tabData}
          loading={loading}
          emptyMessage="No approval records matching this criteria."
        />
      </div>

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
