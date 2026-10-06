import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import ActionDropdown from '../../components/ui/ActionDropdown';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormField';

import {
  getFlangeDesigns,
  updateFlangeDesignStatus,
  deleteFlangeDesign
} from '../../services/flangeDesignService';
import FlangeDesignModal from './FlangeDesignModal';

import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  Ban,
  Trash2
} from 'lucide-react';

const FlangeDesignList = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchDesigns = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.constructionType = typeFilter;

      const res = await getFlangeDesigns(params);
      if (res.success && Array.isArray(res.flangeDesigns)) {
        setDesigns(res.flangeDesigns);
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      console.error('Fetch Flange Designs error:', err);
      setError(err.response?.data?.message || 'Failed to load Flange Designs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [statusFilter, typeFilter]);

  const handleApplySearch = (e) => {
    if (e) e.preventDefault();
    fetchDesigns();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    fetchDesigns();
  };

  const handleToggleStatus = async (design, newStatus) => {
    const confirmMsg = `Are you sure you want to mark ${design.designCode} as ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await updateFlangeDesignStatus(design._id, newStatus);
      if (res.success) {
        fetchDesigns();
      } else {
        setError(res.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (design) => {
    if (!window.confirm(`Are you sure you want to delete Flange Design "${design.designCode}"?`)) return;

    try {
      const res = await deleteFlangeDesign(design._id);
      if (res.success) {
        fetchDesigns();
      } else {
        setError(res.message || 'Failed to delete record');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete Flange Design');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'designCode',
        header: 'Design Code',
        sortable: true,
        render: (val, row) => (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-700 text-[12.5px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {val}
            </span>
          </div>
        )
      },
      {
        key: 'designName',
        header: 'Design Name',
        sortable: true,
        render: (val, row) => (
          <div>
            <div className="font-semibold text-slate-900 text-xs">{val}</div>
            {row.description && (
              <div className="text-[11px] text-slate-500 truncate max-w-[280px]">
                {row.description}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'constructionType',
        header: 'Construction Type',
        sortable: true,
        render: (val) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${
              val === 'BOX'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {val}
          </span>
        )
      },
      {
        key: 'referenceImage',
        header: 'Reference Drawing',
        render: (val, row) => (
          val ? (
            <button
              type="button"
              onClick={() => setPreviewImage({ url: val, title: `${row.designCode} — ${row.designName}` })}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline bg-slate-50 px-2 py-1 rounded border border-slate-200"
            >
              <ImageIcon size={13} /> View Reference
            </button>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          )
        )
      },
      {
        key: 'drawingTemplate',
        header: 'Template Key',
        render: (val) => (
          <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {val || 'FLANGE_TEMPLATE_001'}
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
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '120px',
        render: (_, row) => {
          const actionItems = [
            {
              label: 'Edit Design',
              icon: Edit,
              onClick: () => {
                setEditingDesign(row);
                setIsModalOpen(true);
              }
            },
            {
              label: 'View Reference Image',
              icon: Eye,
              show: Boolean(row.referenceImage),
              onClick: () => setPreviewImage({ url: row.referenceImage, title: `${row.designCode} — ${row.designName}` })
            },
            {
              label: row.status === 'active' ? 'Deactivate' : 'Activate',
              icon: row.status === 'active' ? Ban : CheckCircle2,
              color: row.status === 'active' ? 'var(--warning-700)' : 'var(--success-600)',
              onClick: () => handleToggleStatus(row, row.status === 'active' ? 'inactive' : 'active')
            },
            {
              label: 'Delete Design',
              icon: Trash2,
              danger: true,
              divider: true,
              onClick: () => handleDelete(row)
            }
          ];

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setEditingDesign(row);
                  setIsModalOpen(true);
                }}
                title="Edit Design"
              >
                <Edit size={13} className="mr-1" /> Edit
              </Button>
              <ActionDropdown items={actionItems} />
            </div>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Flange Design Master"
        subtitle="Manage filter flange constructions, slot geometry options, and reference technical drawings."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDesigns}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin mr-1.5' : 'mr-1.5'} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingDesign(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={14} className="mr-1.5" /> Add Flange Design
            </Button>
          </>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        {/* Filter Controls Toolbar */}
        <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 mb-4">
          <form onSubmit={handleApplySearch} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                className="pl-9 text-xs h-[36px]"
                placeholder="Search by Design Code, Name, Description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-[150px]">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="FLANGE">FLANGE</option>
                <option value="BOX">BOX</option>
              </Select>
            </div>

            <div className="w-[150px]">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <RotateCcw size={14} className="mr-1" /> Reset
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" className="h-[36px] px-4">
                <Filter size={14} className="mr-1.5" /> Filter
              </Button>
            </div>
          </form>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={designs}
          loading={loading}
          emptyTitle="No Flange Design records found"
          emptyDescription="Click '+ Add Flange Design' to create a new flange construction master."
        />
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <FlangeDesignModal
          isOpen={isModalOpen}
          flangeDesign={editingDesign}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDesign(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingDesign(null);
            fetchDesigns();
          }}
        />
      )}

      {/* Preview Image Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
          size="lg"
        >
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded border border-slate-200">
            <img
              src={previewImage.url}
              alt="Reference Technical Drawing"
              className="max-h-[500px] object-contain rounded border border-slate-300 bg-white shadow-sm"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FlangeDesignList;
