import React, { useState, useEffect, useMemo } from 'react';
import { getClients, updateClientStatus } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import ClientFormModal from './ClientFormModal';
import ClientDetailModal from './ClientDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Power,
  Phone,
  Mail
} from 'lucide-react';

const ClientList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('CLIENT_CREATE');
  const canEdit = hasPermission('CLIENT_EDIT');

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClientData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getClients();
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch Clients:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const handleStatusToggle = async (client) => {
    const nextStatus = client.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to mark client "${client.companyName}" (${client.clientCode}) as ${nextStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(client._id);
    try {
      const res = await updateClientStatus(client._id, nextStatus);
      if (res.success) {
        setClients((prev) =>
          prev.map((c) => (c._id === client._id ? { ...c, status: nextStatus } : c))
        );
      }
    } catch (err) {
      console.error("Failed to update client status:", err);
      setError(err.response?.data?.message || 'Failed to update client status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Status filter
      if (statusFilter !== 'all' && client.status !== statusFilter) return false;

      // Search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (client.clientCode || '').toLowerCase();
      const company = (client.companyName || '').toLowerCase();
      const contact = (client.contactPerson || '').toLowerCase();
      const mobile = (client.mobile || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const city = (client.city || '').toLowerCase();
      const state = (client.state || '').toLowerCase();

      return (
        code.includes(term) ||
        company.includes(term) ||
        contact.includes(term) ||
        mobile.includes(term) ||
        email.includes(term) ||
        city.includes(term) ||
        state.includes(term)
      );
    });
  }, [clients, searchTerm, statusFilter]);

  const columns = [
    {
      key: 'clientCode',
      header: 'Client Code',
      width: '140px',
      render: (val) => (
        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'companyName',
      header: 'Company Name',
      width: '240px',
      render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong>,
    },
    {
      key: 'contactPerson',
      header: 'Contact Person & Mobile',
      width: '220px',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 500, color: 'var(--neutral-900)' }}>
            {row.contactPerson || '—'}
          </span>
          {row.mobile && (
            <span style={{ fontSize: '12px', color: 'var(--neutral-600)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={12} color="var(--primary-600)" />
              {row.mobile}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email / City',
      width: '220px',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '13px', color: 'var(--neutral-800)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={12} color="var(--primary-600)" />
            {row.email || '—'}
          </span>
          {(row.city || row.state) && (
            <span style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
              {[row.city, row.state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
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
              setSelectedClient(row);
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
                  setEditingClient(row);
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
                title={row.status === 'active' ? 'Deactivate Client' : 'Activate Client'}
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
        title="Client Master"
        description="Manage commercial client accounts, customer profiles, and organization addresses."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Commercial' },
          { label: 'Clients' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchClientData}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingClient(null);
                  setIsFormOpen(true);
                }}
              >
                Add Client
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
              placeholder="Search by client code, company, contact person, mobile, email, or city..."
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
          data={filteredClients}
          loading={loading}
          emptyTitle="No Client records found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Client" above to create your first client account record.'
          }
        />

        {/* Footer Summary */}
        <div className="flex-between text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
          <span>Showing {filteredClients.length} of {clients.length} total Client accounts</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      {/* Modals */}
      <ClientFormModal
        client={editingClient}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchClientData}
      />

      <ClientDetailModal
        client={selectedClient}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(cl) => {
          setEditingClient(cl);
          setIsFormOpen(true);
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default ClientList;
