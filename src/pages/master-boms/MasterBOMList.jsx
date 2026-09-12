import React, { useState, useEffect, useMemo } from 'react';
import { getBOMs, releaseBOM } from '../../services/masterBomService';
import { getItems } from '../../services/itemService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';

import MasterBOMFormModal from './MasterBOMFormModal';
import MasterBOMDetailModal from './MasterBOMDetailModal';
import MasterBOMCopyModal from './MasterBOMCopyModal';

import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  RefreshCw,
  CheckCircle2,
  Layers,
  Package
} from 'lucide-react';

const MasterBOMList = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('BOM_CREATE');
  const canEdit = hasPermission('BOM_EDIT');
  const canRelease = hasPermission('BOM_RELEASE');

  const [boms, setBoms] = useState([]);
  const [parentItems, setParentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [versionFilter, setVersionFilter] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBOMId, setSelectedBOMId] = useState(null);
  const [editingBOM, setEditingBOM] = useState(null);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [copyingBOM, setCopyingBOM] = useState(null);

  const fetchBOMsData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (parentFilter !== 'all') params.parentItem = parentFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (versionFilter.trim()) params.version = versionFilter.trim();

      const [bomRes, itemRes] = await Promise.all([
        getBOMs(params),
        getItems().catch(() => ({ success: false, items: [] }))
      ]);

      if (bomRes.success && Array.isArray(bomRes.boms)) {
        setBoms(bomRes.boms);
        if (bomRes.total !== undefined) setTotalRecords(bomRes.total);
      } else {
        setError('Unexpected response format from server');
      }

      if (itemRes.success && Array.isArray(itemRes.items)) {
        setParentItems(itemRes.items);
      }
    } catch (err) {
      console.error('Failed to fetch Master BOMs:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOMsData();
  }, [parentFilter, statusFilter, versionFilter, page, limit]);

  // Client-side search filtering on loaded records
  const filteredBOMs = useMemo(() => {
    if (!searchTerm.trim()) return boms;
    const term = searchTerm.toLowerCase();
    return boms.filter((b) => {
      const code = (b.bomCode || '').toLowerCase();
      const parentCode = (b.parentItem?.itemCode || '').toLowerCase();
      const parentName = (b.parentItem?.itemName || '').toLowerCase();
      const desc = (b.description || '').toLowerCase();
      return code.includes(term) || parentCode.includes(term) || parentName.includes(term) || desc.includes(term);
    });
  }, [boms, searchTerm]);

  const handleQuickRelease = async (b) => {
    if (b.status !== 'draft') return;
    const confirmMsg = `Are you sure you want to RELEASE Master BOM "${b.bomCode}" (Version ${b.version})?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(b._id);
    try {
      const res = await releaseBOM(b._id);
      if (res.success) {
        fetchBOMsData();
      } else {
        setError(res.message || 'Failed to release Master BOM');
      }
    } catch (err) {
      console.error('Failed to release BOM:', err);
      setError(err.response?.data?.message || 'Error releasing Master BOM');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'bomCode',
        header: 'BOM Code',
        sortable: true,
        render: (val, row) => (
          <button
            type="button"
            onClick={() => {
              setSelectedBOMId(row._id);
              setIsDetailOpen(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontWeight: 700,
              color: 'var(--primary-700)',
              textAlign: 'left'
            }}
            className="font-mono hover:underline"
            title="View BOM Details"
          >
            {val}
          </button>
        )
      },
      {
        key: 'parentItem',
        header: 'Parent Finished Item',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
              {row.parentItem?.itemName || 'N/A'}
            </div>
            {row.parentItem?.itemCode && (
              <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }} className="font-mono">
                Code: {row.parentItem.itemCode}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'version',
        header: 'Version',
        sortable: true,
        render: (val) => (
          <span className="badge badge-primary" style={{ fontSize: '11.5px', fontWeight: 700 }}>
            v{val}
          </span>
        )
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (val) => <StatusBadge status={val} />
      },
      {
        key: 'effectiveFrom',
        header: 'Effective Date',
        sortable: true,
        render: (val) => (val ? new Date(val).toLocaleDateString('en-GB') : '-')
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '210px',
        render: (_, row) => (
          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSelectedBOMId(row._id);
                setIsDetailOpen(true);
              }}
              title="View Details"
            >
              <Eye size={14} style={{ marginRight: '3px' }} /> View
            </Button>

            {canEdit && row.status === 'draft' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setEditingBOM(row);
                  setIsFormOpen(true);
                }}
                title="Edit Draft BOM Header"
              >
                <Edit size={14} style={{ marginRight: '3px' }} /> Edit
              </Button>
            )}

            {canRelease && row.status === 'draft' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleQuickRelease(row)}
                disabled={actionLoading === row._id}
                title="Release Master BOM"
              >
                <CheckCircle2 size={14} style={{ marginRight: '3px' }} color="var(--success-600)" /> Release
              </Button>
            )}

            {canCreate && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setCopyingBOM(row);
                  setIsCopyOpen(true);
                }}
                title="Copy / Create Revision"
              >
                <Copy size={14} style={{ marginRight: '3px' }} /> Revise
              </Button>
            )}
          </div>
        )
      }
    ],
    [canEdit, canRelease, canCreate, actionLoading]
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Master Bill of Materials (Master BOM)"
        subtitle="Define, maintain, release, and revise reusable manufacturing recipes and component structures for finished items."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBOMsData}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingBOM(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus size={14} style={{ marginRight: '6px' }} /> Create Master BOM
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card">
        {/* Toolbar Filter Controls */}
        <div className="toolbar" style={{ padding: '16px', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div className="search-input-wrap" style={{ flex: '1', minWidth: '220px' }}>
              <Search size={16} />
              <Input
                placeholder="Search by BOM Code, Parent Code, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={parentFilter}
              onChange={(e) => {
                setParentFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '220px' }}
            >
              <option value="all">All Parent Items</option>
              {parentItems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.itemCode} — {p.itemName}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '140px' }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="released">Released</option>
              <option value="revised">Revised</option>
              <option value="inactive">Inactive</option>
            </Select>

            <Input
              type="number"
              min="1"
              placeholder="Version (e.g. 1)"
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              style={{ width: '130px' }}
              title="Version Filter"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredBOMs}
          loading={loading}
          emptyTitle="No Master BOMs found"
          emptyDescription="Click '+ Create Master BOM' to define a manufacturing recipe for a finished item."
        />
      </div>

      {/* Form Modal (Create / Edit Header) */}
      {isFormOpen && (
        <MasterBOMFormModal
          isOpen={isFormOpen}
          bom={editingBOM}
          onClose={() => {
            setIsFormOpen(false);
            setEditingBOM(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingBOM(null);
            fetchBOMsData();
          }}
        />
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedBOMId && (
        <MasterBOMDetailModal
          isOpen={isDetailOpen}
          bomId={selectedBOMId}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedBOMId(null);
          }}
          onBOMUpdated={fetchBOMsData}
        />
      )}

      {/* Copy / Revision Modal */}
      {isCopyOpen && copyingBOM && (
        <MasterBOMCopyModal
          isOpen={isCopyOpen}
          bom={copyingBOM}
          onClose={() => {
            setIsCopyOpen(false);
            setCopyingBOM(null);
          }}
          onSuccess={(newBom) => {
            setIsCopyOpen(false);
            setCopyingBOM(null);
            fetchBOMsData();
            if (newBom && newBom._id) {
              setSelectedBOMId(newBom._id);
              setIsDetailOpen(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default MasterBOMList;
