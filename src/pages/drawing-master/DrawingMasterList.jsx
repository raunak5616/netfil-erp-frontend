import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getDrawings,
  updateDrawingStatus,
  deleteDrawing,
  getVersionedImageUrl
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
import HoleImageManagementTab from './HoleImageManagementTab';
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
  Image as ImageIcon,
  Box,
  Sparkles,
  ShieldCheck,
  LayoutGrid,
  Disc
} from 'lucide-react';

const DrawingMasterList = () => {
  const { user, hasPermission, isAdmin } = useAuth();

  // Admin permissions check: Admin role or explicit DRAWING_MANAGE permission
  const canManageDrawings = isAdmin || hasPermission('DRAWING_MANAGE') || hasPermission('ITEM_CREATE');

  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial category tab from URL param ?tab= or localStorage, default to 'fine_pre'
  const getInitialTab = () => {
    const urlTab = (searchParams.get('tab') || searchParams.get('category') || '').toLowerCase();
    if (['fine_pre', 'hepa', 'all', 'hole_images'].includes(urlTab)) {
      return urlTab;
    }
    // Backward compatibility for legacy url params
    if (urlTab === 'fine' || urlTab === 'box') return 'fine_pre';
    if (urlTab === 'hepa') return 'hepa';
    if (urlTab === 'hole' || urlTab === 'holes') return 'hole_images';
    const savedTab = (localStorage.getItem('netfil_drawing_master_tab') || '').toLowerCase();
    if (['fine_pre', 'hepa', 'all', 'hole_images'].includes(savedTab)) {
      return savedTab;
    }
    return 'fine_pre';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL'); // 'ALL' | 'BOX' | 'FLANGE'

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    localStorage.setItem('netfil_drawing_master_tab', newTab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    }, { replace: true });
  };

  const [drawings, setDrawings] = useState([]);
  const [filterGrades, setFilterGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [holeFilter, setHoleFilter] = useState('all');
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

  // Main Category Tab Definitions
  const tabs = useMemo(
    () => [
      {
        id: 'fine_pre',
        label: 'Fine / Pre',
        description: 'Fine & Pre filter drawings',
        icon: Layers,
        badgeColor: 'bg-emerald-100 text-emerald-800'
      },
      {
        id: 'hepa',
        label: 'HEPA',
        description: 'High-efficiency particulate air drawings',
        icon: ShieldCheck,
        badgeColor: 'bg-amber-100 text-amber-800'
      },
      {
        id: 'hole_images',
        label: 'Hole Image Management',
        description: 'Dedicated flange hole image management (4, 8, and 12 Holes)',
        icon: Disc,
        badgeColor: 'bg-slate-200 text-slate-800'
      },
      {
        id: 'all',
        label: 'All Drawings',
        description: 'Complete engineering drawings registry',
        icon: LayoutGrid,
        badgeColor: 'bg-slate-200 text-slate-800'
      }
    ],
    []
  );

  // Helper to distinguish flange hole pattern drawings from filter product drawings
  const isHoleDrawing = (d) => Boolean(
    d?.isHolePattern ||
    (d?.drawingCode && d.drawingCode.toUpperCase().startsWith('HOLE-'))
  );

  // Dynamic counts per category
  const counts = useMemo(() => {
    const res = { fine_pre: 0, hepa: 0, all: 0, hole_images: 0 };
    for (const d of drawings) {
      if (isHoleDrawing(d)) {
        res.hole_images++;
      } else {
        res.all++;
        const cat = (d.filterCategory || '').toUpperCase();
        const dt = (d.drawingType || '').toUpperCase();
        if (cat === 'HEPA' || dt === 'HEPA') {
          res.hepa++;
        } else {
          res.fine_pre++;
        }
      }
    }
    return res;
  }, [drawings]);

  // Extract unique hole configurations across drawings
  const holeConfigOptions = useMemo(() => {
    const set = new Set(['12 Holes', '8 Holes', '4 Holes', '2 Holes']);
    for (const d of drawings) {
      if (d.holeConfig && d.holeConfig.toLowerCase() !== 'ing1') set.add(d.holeConfig);
      else if (d.holes) set.add(`${d.holes} Holes`);
    }
    return Array.from(set);
  }, [drawings]);

  // Filtered drawings
  const filteredDrawings = useMemo(() => {
    return drawings.filter((drw) => {
      // Hole drawings are hole pattern configurations, NOT filter product drawings.
      // They belong exclusively in the Hole Image Management tab.
      if (isHoleDrawing(drw)) {
        return false;
      }

      // 1. Category Tab filter
      const cat = (drw.filterCategory || '').toUpperCase();
      const dt = (drw.drawingType || '').toUpperCase();
      const isHepa = cat === 'HEPA' || dt === 'HEPA';

      if (activeTab === 'fine_pre' && isHepa) return false;
      if (activeTab === 'hepa' && !isHepa) return false;

      // 2. Drawing Type sub-filter
      if (activeTypeFilter === 'BOX') {
        const isBox = dt === 'BOX' || dt === 'STANDARD' || (!drw.holesSlotHandle && dt !== 'FLANGE');
        if (!isBox) return false;
      } else if (activeTypeFilter === 'FLANGE') {
        const isFlange = dt === 'FLANGE';
        if (!isFlange) return false;
      }

      // 3. Search filter
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const matchSearch =
          drw.drawingCode?.toLowerCase().includes(term) ||
          drw.drawingName?.toLowerCase().includes(term) ||
          drw.description?.toLowerCase().includes(term) ||
          drw.holeConfig?.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      // 4. Hole Config Filter
      if (holeFilter !== 'all') {
        const effectiveHoleConfig = drw.holeConfig || (drw.holes ? `${drw.holes} Holes` : '');
        if (effectiveHoleConfig.toLowerCase() !== holeFilter.toLowerCase()) {
          return false;
        }
      }

      // 5. Filter Grade filter
      if (gradeFilter) {
        const assignedIds = Array.isArray(drw.filterGrades) && drw.filterGrades.length > 0
          ? drw.filterGrades.map(g => String(g?._id || g))
          : (drw.filterGrade ? [String(drw.filterGrade?._id || drw.filterGrade)] : []);
        if (!assignedIds.includes(String(gradeFilter))) return false;
      }

      // 6. Status filter
      if (statusFilter !== 'all') {
        if (drw.status !== statusFilter) return false;
      }

      return true;
    });
  }, [drawings, activeTab, activeTypeFilter, searchTerm, gradeFilter, holeFilter, statusFilter]);

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: 'preview',
        header: 'Preview',
        align: 'center',
        width: '64px',
        render: (_, row) => {
          const isPdf = row.format === 'pdf' || row.fileUrl?.toLowerCase().endsWith('.pdf');
          const rawSrc = row.holeImageUrl || row.fileUrl;
          const previewSrc = getVersionedImageUrl(rawSrc, row.updatedAt);
          return (
            <div
              onClick={() => handlePreview(row)}
              className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-xs flex items-center justify-center transition-all group shrink-0 mx-auto"
              title="Click to view full preview"
            >
              {isPdf ? (
                <FileText size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
              ) : (
                <img
                  src={previewSrc}
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
        width: '130px',
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
              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">
                {row.description}
              </p>
            )}
          </div>
        )
      },
      {
        key: 'category',
        header: 'Category',
        align: 'center',
        width: '95px',
        render: (_, row) => {
          if (isHoleDrawing(row)) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border bg-purple-50 text-purple-800 border-purple-200">
                Hole Pattern
              </span>
            );
          }
          const isHepa = (row.filterCategory === 'HEPA') || (row.drawingType === 'HEPA');
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
              isHepa
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isHepa ? 'HEPA' : 'Fine / Pre'}
            </span>
          );
        }
      },
      {
        key: 'drawingType',
        header: 'Type',
        align: 'center',
        width: '85px',
        render: (_, row) => {
          const isFlange = row.drawingType === 'FLANGE';
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isFlange
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {isFlange ? 'Flange' : 'Box'}
            </span>
          );
        }
      },
      {
        key: 'holeDetails',
        header: 'Holes & Handles',
        width: '170px',
        render: (_, row) => {
          const isFlange = row.drawingType === 'FLANGE';
          if (!isFlange) {
            return (
              <span className="text-[11px] text-slate-400 italic">
                Box Casing (No Flange)
              </span>
            );
          }

          const holeLabel = (row.holeConfig && row.holeConfig.toLowerCase() !== 'ing1')
            ? row.holeConfig
            : (row.holes !== undefined && row.holes !== null ? `${row.holes} Holes` : 'Flange Holes');

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-purple-900 bg-purple-100/80 px-1.5 py-0.5 rounded border border-purple-200">
                  {holeLabel}
                </span>
                <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                  2 Handles
                </span>
              </div>
              <span className="text-[9px] text-slate-400">Normal Branch</span>
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
        width: '90px',
        render: (val, row) => (
          <StatusBadge status={val || row.status || 'active'} />
        )
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '100px',
        render: (_, row) => {
          const actionItems = [
            {
              label: 'View Preview',
              icon: Eye,
              onClick: () => handlePreview(row)
            },
            {
              label: 'Edit Configuration',
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
            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
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
                  title="Edit Configuration"
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
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Drawing Master"
        subtitle="Configure, upload, and manage Filter Drawing images: Fine/Pre &amp; HEPA categories, Box &amp; Flange types, and configurable hole patterns"
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

      {/* Main Category Tabs Bar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = counts[tab.id] || 0;

            let activeClass = 'bg-slate-900 text-white shadow-xs';
            if (isActive && tab.id === 'fine_pre') {
              activeClass = 'bg-emerald-700 text-white shadow-xs';
            } else if (isActive && tab.id === 'hepa') {
              activeClass = 'bg-amber-700 text-white shadow-xs';
            } else if (isActive && tab.id === 'hole_images') {
              activeClass = 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-700';
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? activeClass
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Sub-filter Pills: Drawing Type (Box / Flange) - Hidden on Hole Image Management */}
        {activeTab !== 'hole_images' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 hidden sm:inline">Type:</span>
            {['ALL', 'BOX', 'FLANGE'].map((typeOption) => {
              const isSelected = activeTypeFilter === typeOption;
              return (
                <button
                  key={typeOption}
                  type="button"
                  onClick={() => setActiveTypeFilter(typeOption)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {typeOption === 'ALL' ? 'All Types' : (typeOption === 'BOX' ? 'Box' : 'Flange')}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeTab === 'hole_images' ? (
        <HoleImageManagementTab />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-2.5 items-center justify-between">
            <div className="flex flex-1 flex-wrap gap-2.5 items-center min-w-[280px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <Input
                  type="text"
                  placeholder="Search code, name, hole config..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs"
                />
              </div>

              {/* Hole Config Filter */}
              <div className="w-40">
                <Select
                  value={holeFilter}
                  onChange={(e) => setHoleFilter(e.target.value)}
                  className="text-xs"
                >
                  <option value="all">All Hole Options</option>
                  {holeConfigOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
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
              <div className="w-32">
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
              Showing <strong>{filteredDrawings.length}</strong> of <strong>{drawings.length}</strong> drawings
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredDrawings}
              loading={loading}
              emptyTitle={`No ${activeTab === 'all' ? '' : tabs.find(t => t.id === activeTab)?.label || ''} engineering drawings found`}
              emptyDescription="Click 'Add Drawing' to create one for this category and type, or adjust your search filters."
            />
          </div>
        </>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <DrawingMasterFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchDrawings}
          initialData={editingDrawing}
          defaultCategory={activeTab === 'hepa' ? 'HEPA' : 'FINE_PRE'}
          defaultDrawingType={activeTypeFilter !== 'ALL' ? activeTypeFilter : 'BOX'}
          onHoleImageTabSelect={() => {
            setIsFormOpen(false);
            handleTabChange('hole_images');
          }}
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
