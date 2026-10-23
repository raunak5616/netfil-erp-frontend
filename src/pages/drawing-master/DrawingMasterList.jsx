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
import Modal from '../../components/ui/Modal';
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
  const [typeFilter, setTypeFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDrawing, setPreviewDrawing] = useState(null);

  const [viewGradesModalDrawing, setViewGradesModalDrawing] = useState(null);

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

      // 2. Filter Grade filter (supports multi-grade array and legacy single field)
      const assignedIds = Array.isArray(drw.filterGrades) && drw.filterGrades.length > 0
        ? drw.filterGrades.map(g => String(g?._id || g))
        : (drw.filterGrade ? [String(drw.filterGrade?._id || drw.filterGrade)] : []);

      const matchGrade = !gradeFilter || assignedIds.includes(String(gradeFilter));

      // 3. Status filter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && drw.status === 'active') ||
        (statusFilter === 'inactive' && drw.status === 'inactive');

      // 4. Drawing Type filter
      const isFlange = drw.drawingType === 'FLANGE';
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'standard' && !isFlange) ||
        (typeFilter === 'flange' && isFlange);

      return matchSearch && matchGrade && matchStatus && matchType;
    });
  }, [drawings, searchTerm, typeFilter, gradeFilter, statusFilter]);

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
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" title="Designated Default Drawing">
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
        key: 'drawingType',
        header: 'Type',
        align: 'center',
        width: '105px',
        render: (_, row) => {
          const isFlange = row.drawingType === 'FLANGE';
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                isFlange 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {isFlange ? 'Flange' : 'Standard'}
              </span>
              {isFlange && row.constructionType && (
                <span className="text-[10px] text-slate-500 font-mono font-medium">
                  {row.constructionType}
                </span>
              )}
            </div>
          );
        }
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
          const assigned = Array.isArray(row.filterGrades) && row.filterGrades.length > 0
            ? row.filterGrades
            : (row.filterGrade ? [row.filterGrade] : []);

          if (assigned.length === 0) {
            if (row.drawingType === 'FLANGE') {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Universal (All Grades)
                </span>
              );
            }
            return <span className="text-slate-400 italic text-xs">—</span>;
          }

          const defaultIds = new Set(
            (Array.isArray(row.defaultForGrades) ? row.defaultForGrades : [])
              .map(g => String(g?._id || g))
          );
          if (row.isDefault && defaultIds.size === 0 && row.filterGrade) {
            defaultIds.add(String(row.filterGrade?._id || row.filterGrade));
          }

          const visibleGrades = assigned.slice(0, 2);
          const remainingCount = assigned.length - 2;

          const remainingNames = remainingCount > 0
            ? assigned.slice(2).map(g => g?.filterGrade || (typeof g === 'string' ? g : 'Grade')).join(', ')
            : '';

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleGrades.map((g, idx) => {
                const name = g?.filterGrade || (typeof g === 'string' ? g : 'Grade');
                const gid = String(g?._id || g);
                const isDef = defaultIds.has(gid);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                    title={g?.eurovent ? `Eurovent: ${g.eurovent}` : ''}
                  >
                    <span>{name}</span>
                    {isDef && (
                      <Star size={10} className="fill-emerald-600 text-emerald-600" title="Default drawing for this grade" />
                    )}
                  </span>
                );
              })}

              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setViewGradesModalDrawing(row)}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-300 transition-colors cursor-pointer"
                  title={`View all assigned grades: ${remainingNames}`}
                >
                  +{remainingCount} more
                </button>
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

          {/* Drawing Type Filter */}
          <div className="w-40">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs"
            >
              <option value="all">All Drawing Types</option>
              <option value="standard">Standard Drawings</option>
              <option value="flange">Flange Designs</option>
            </Select>
          </div>

          {/* Filter Grade Dropdown Filter */}
          <div className="w-48">
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

      {/* Complete Assigned Filter Grades Modal */}
      {viewGradesModalDrawing && (
        <Modal
          isOpen={Boolean(viewGradesModalDrawing)}
          onClose={() => setViewGradesModalDrawing(null)}
          title={`Assigned Filter Grades — ${viewGradesModalDrawing.drawingCode}`}
          maxWidth="560px"
          footer={
            <div className="flex justify-end w-full">
              <Button variant="secondary" onClick={() => setViewGradesModalDrawing(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block text-xs">
                {viewGradesModalDrawing.drawingName}
              </span>
              <span className="text-[11px] text-slate-500">
                This drawing is compatible and available for selection with the following Filter Grades:
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
              {(
                Array.isArray(viewGradesModalDrawing.filterGrades) && viewGradesModalDrawing.filterGrades.length > 0
                  ? viewGradesModalDrawing.filterGrades
                  : (viewGradesModalDrawing.filterGrade ? [viewGradesModalDrawing.filterGrade] : [])
              ).map((g, idx) => {
                const name = g?.filterGrade || (typeof g === 'string' ? g : 'Grade');
                const gid = String(g?._id || g);
                const isDef = (Array.isArray(viewGradesModalDrawing.defaultForGrades) ? viewGradesModalDrawing.defaultForGrades : [])
                  .map(dg => String(dg?._id || dg))
                  .includes(gid) || (viewGradesModalDrawing.isDefault && idx === 0);

                return (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-xs">{name}</span>
                      <span className="text-[11px] text-slate-500">
                        {[g?.eurovent ? `EU: ${g.eurovent}` : '', g?.iso ? `ISO: ${g.iso}` : ''].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                    {isDef ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <Star size={10} className="fill-emerald-600 text-emerald-600" /> Default Drawing
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Compatible
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DrawingMasterList;
