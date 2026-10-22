import React, { useState, useEffect, useMemo } from 'react';
import {
  getDrawings,
  updateDrawingStatus,
  deleteDrawing
} from '../../services/drawingMasterService';
import { getFilterGrades } from '../../services/filterGradeService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import DrawingMasterFormModal from './DrawingMasterFormModal';
import DrawingPreviewModal from './DrawingPreviewModal';
import ActionDropdown from '../../components/ui/ActionDropdown';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Power,
  Trash2,
  FileText,
  Star,
  CheckCircle2,
  ExternalLink,
  Ban,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

const DrawingMasterList = () => {
  const { user, hasPermission, isAdmin } = useAuth();

  // Admin permissions check: Admin role or explicit DRAWING_MANAGE permission
  const canManageDrawings = isAdmin || hasPermission('DRAWING_MANAGE') || hasPermission('ITEM_CREATE');

  const [drawings, setDrawings] = useState([]);
  const [filterGrades, setFilterGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDrawing, setPreviewDrawing] = useState(null);

  const fetchDrawings = async () => {
    setLoading(true);
    setError('');
    try {
      const [drwRes, fgRes] = await Promise.all([
        getDrawings({ status: 'all' }),
        getFilterGrades().catch(() => ({ success: false, filterGrades: [] }))
      ]);

      if (drwRes.success && Array.isArray(drwRes.drawings)) {
        setDrawings(drwRes.drawings);
      } else {
        setError('Unexpected API response format');
      }

      if (fgRes.success && Array.isArray(fgRes.filterGrades)) {
        setFilterGrades(fgRes.filterGrades);
      }
    } catch (err) {
      console.error('Failed to fetch drawings:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, []);

  const handleCreate = () => {
    setEditingDrawing(null);
    setIsFormOpen(true);
  };

  const handleEdit = (drawing) => {
    setEditingDrawing(drawing);
    setIsFormOpen(true);
  };

  const handlePreview = (drawing) => {
    setPreviewDrawing(drawing);
    setIsPreviewOpen(true);
  };

  const handleToggleStatus = async (drawing) => {
    try {
      const newStatus = drawing.status === 'active' ? 'inactive' : 'active';
      await updateDrawingStatus(drawing._id, newStatus);
      setSuccessMsg(`Drawing ${drawing.drawingCode} is now ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchDrawings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (drawing) => {
    if (!window.confirm(`Are you sure you want to delete drawing ${drawing.drawingCode}?`)) {
      return;
    }

    try {
      await deleteDrawing(drawing._id);
      setSuccessMsg(`Drawing ${drawing.drawingCode} deleted successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchDrawings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete drawing');
    }
  };

  // Filtered drawings
  const filteredDrawings = useMemo(() => {
    return drawings.filter((drw) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        drw.drawingCode?.toLowerCase().includes(term) ||
        drw.drawingName?.toLowerCase().includes(term) ||
        drw.description?.toLowerCase().includes(term);

      // 2. Filter Grade filter
      const drwGradeId = drw.filterGrade?._id || drw.filterGrade;
      const matchGrade = !gradeFilter || String(drwGradeId) === String(gradeFilter);

      // 3. Status filter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && drw.status === 'active') ||
        (statusFilter === 'inactive' && drw.status === 'inactive');

      return matchSearch && matchGrade && matchStatus;
    });
  }, [drawings, searchTerm, gradeFilter, statusFilter]);

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: 'preview',
        header: 'Preview',
        align: 'center',
        width: '70px',
        render: (_, row) => {
          const isPdf = row.format === 'pdf' || row.fileUrl?.toLowerCase().endsWith('.pdf');
          return (
            <div
              onClick={() => handlePreview(row)}
              className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-xs flex items-center justify-center transition-all group shrink-0 mx-auto"
              title="Click to view full preview"
            >
              {isPdf ? (
                <FileText size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
              ) : (
                <img
                  src={row.fileUrl}
                  alt={row.drawingName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
            </div>
          );
        }
      },
      {
        key: 'drawingCode',
        header: 'Drawing Code',
        sortable: true,
        render: (val, row) => (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {val || row.drawingCode}
              </span>
              {row.isDefault && (
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" title="Designated Default Drawing for this Filter Grade">
                  <Star size={10} className="mr-0.5 fill-emerald-600 text-emerald-600" /> Default
                </span>
              )}
            </div>
            {row.description && (
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-[260px]">
                {row.description}
              </p>
            )}
          </div>
        )
      },
      {
        key: 'drawingName',
        header: 'Drawing Name',
        sortable: true,
        render: (val, row) => (
          <span className="font-medium text-slate-900 text-xs">
            {val || row.drawingName}
          </span>
        )
      },
      {
        key: 'filterGrade',
        header: 'Assigned Filter Grade',
        render: (_, row) => {
          const fg = row.filterGrade;
          const name = fg?.filterGrade || (typeof fg === 'string' ? fg : '—');
          const standards = [fg?.eurovent ? `EU: ${fg.eurovent}` : '', fg?.iso ? `ISO: ${fg.iso}` : ''].filter(Boolean).join(' • ');

          return (
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {name}
              </span>
              {standards && (
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {standards}
                </span>
              )}
            </div>
          );
        }
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        width: '100px',
        render: (val, row) => (
          <StatusBadge status={val || row.status || 'active'} />
        )
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '120px',
        render: (_, row) => {
          const actionItems = [
            {
              label: 'View Preview',
              icon: Eye,
              onClick: () => handlePreview(row)
            },
            {
              label: 'Edit Drawing',
              icon: Edit,
              show: canManageDrawings,
              onClick: () => handleEdit(row)
            },
            {
              label: row.status === 'active' ? 'Deactivate' : 'Activate',
              icon: row.status === 'active' ? Ban : CheckCircle2,
              show: canManageDrawings,
              color: row.status === 'active' ? 'var(--warning-700)' : 'var(--success-600)',
              onClick: () => handleToggleStatus(row)
            },
            {
              label: 'Delete Drawing',
              icon: Trash2,
              show: canManageDrawings,
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
                onClick={() => handlePreview(row)}
                title="View Preview"
                className="text-slate-600 hover:text-slate-900"
              >
                <Eye size={14} />
              </Button>

              {canManageDrawings && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleEdit(row)}
                  title="Edit Drawing"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={14} />
                </Button>
              )}

              <ActionDropdown items={actionItems} />
            </div>
          );
        }
      }
    ],
    [canManageDrawings, drawings]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Drawing Master"
        subtitle="Manage reusable CAD engineering drawings and filter grade assignments"
        actions={
          canManageDrawings ? (
            <Button variant="primary" onClick={handleCreate} className="shadow-xs">
              <Plus size={16} className="mr-1.5" /> Add Drawing
            </Button>
          ) : null
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <Input
              type="text"
              placeholder="Search by code, name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filter Grade Dropdown Filter */}
          <div className="w-52">
            <Select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs"
            >
              <option value="">All Filter Grades</option>
              {filterGrades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.filterGrade} {g.eurovent ? `(${g.eurovent})` : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
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

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredDrawings.length}</strong> of <strong>{drawings.length}</strong> records
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredDrawings}
          loading={loading}
          emptyTitle="No engineering drawings found"
          emptyDescription="Click 'Add Drawing' to create one, or adjust your search filters."
        />
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <DrawingMasterFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchDrawings}
          initialData={editingDrawing}
        />
      )}

      {/* Drawing Preview Modal */}
      {isPreviewOpen && (
        <DrawingPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          drawing={previewDrawing}
        />
      )}
    </div>
  );
};

export default DrawingMasterList;
