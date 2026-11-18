import React, { useState, useMemo } from 'react';
import {
  useGetFaceVelocitiesQuery,
  useUpdateFaceVelocityStatusMutation,
  useDeleteFaceVelocityMutation,
  useSeedFaceVelocityMutation,
  useGetFilterGradesQuery,
} from '../../features/masterData/masterDataApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import FaceVelocityFormModal from './FaceVelocityFormModal';
import FaceVelocityDetailModal from './FaceVelocityDetailModal';
import DeleteFaceVelocityModal from './DeleteFaceVelocityModal';
import {
  Gauge,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  Power,
  Trash2,
  Layers,
  Sparkles,
  Ruler,
} from 'lucide-react';

const FaceVelocityMasterList = () => {
  const { hasPermission, isAdmin } = useAuth();

  const canCreate = hasPermission('FILTER_GRADE_CREATE') || isAdmin;
  const canEdit = hasPermission('FILTER_GRADE_EDIT') || isAdmin;
  const canChangeStatus = hasPermission('FILTER_GRADE_STATUS') || isAdmin;
  const canDelete = hasPermission('FILTER_GRADE_DELETE') || hasPermission('FILTER_GRADE_EDIT') || isAdmin;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status feedback
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Queries & Mutations
  const queryParams = useMemo(() => {
    const params = { all: true };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (gradeFilter !== 'all') params.filterGrade = gradeFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    return params;
  }, [searchTerm, gradeFilter, statusFilter]);

  const { data: configsData, isLoading: loading, refetch } = useGetFaceVelocitiesQuery(queryParams);
  const { data: gradesData } = useGetFilterGradesQuery();
  const [updateStatusMutation] = useUpdateFaceVelocityStatusMutation();
  const [deleteMutation] = useDeleteFaceVelocityMutation();
  const [seedMutation, { isLoading: seedLoading }] = useSeedFaceVelocityMutation();

  const configurations = configsData?.configurations || [];
  const filterGrades = gradesData?.filterGrades || [];

  const handleToggleStatus = async (config) => {
    try {
      const newStatus = config.status === 'active' ? 'inactive' : 'active';
      await updateStatusMutation({ id: config._id, status: newStatus }).unwrap();
      setSuccessMessage(`Configuration status changed to ${newStatus}.`);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to update status');
    }
  };

  const handleDeleteClick = (config) => {
    setError('');
    setSuccessMessage('');
    setConfigToDelete(config);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!configToDelete) return;
    setDeleteLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await deleteMutation(configToDelete._id).unwrap();
      setSuccessMessage(res?.message || 'Configuration deleted successfully.');
      setIsDeleteDialogOpen(false);
      setConfigToDelete(null);
    } catch (err) {
      console.error('Failed to delete configuration:', err);
      setError(err?.data?.message || err?.message || 'Failed to delete configuration');
      setIsDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setError('');
    setSuccessMessage('');
    try {
      const res = await seedMutation().unwrap();
      setSuccessMessage(res?.message || 'Standard reference configurations verified / seeded successfully.');
      refetch();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to seed reference configurations');
    }
  };

  const columns = [
    {
      key: 'filterGrades',
      header: 'Filter Grades',
      width: '210px',
      render: (_, row) => {
        const grades = Array.isArray(row.filterGrades) && row.filterGrades.length > 0
          ? row.filterGrades
          : (row.filterGrade ? [row.filterGrade] : []);

        if (grades.length === 0) return <span className="text-slate-400 text-xs">—</span>;

        return (
          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
            {grades.map((g, idx) => {
              const name = g.filterGrade || 'Grade';
              const euro = g.eurovent ? ` (${g.eurovent})` : '';
              return (
                <span
                  key={g._id || idx}
                  className="inline-flex items-center gap-1 font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded text-[11px] border border-primary-200 shadow-2xs"
                  title={`${name}${euro}`}
                >
                  <Layers size={11} className="text-primary-600 shrink-0" />
                  <span>{name}</span>
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'depthRange',
      header: 'Depth Range',
      width: '150px',
      render: (_, row) => (
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          {row.minDepth} – {row.maxDepth} mm
        </span>
      ),
    },
    {
      key: 'pleatsPerFeet',
      header: 'Pleats / Ft',
      width: '110px',
      align: 'center',
      render: (val) => <span className="text-xs font-semibold text-slate-700">{val}</span>,
    },
    {
      key: 'filtrationArea',
      header: 'Area (Sq. M.)',
      width: '130px',
      align: 'center',
      render: (val) => (
        <span className="text-xs font-semibold text-slate-800">
          {val} <span className="text-[10px] font-normal text-slate-400">Sq.M.</span>
        </span>
      ),
    },
    {
      key: 'faceVelocity',
      header: 'Face Velocity',
      width: '130px',
      align: 'center',
      render: (val) => (
        <span className="text-xs font-bold text-primary-700 bg-primary-50/80 px-2.5 py-0.5 rounded-full border border-primary-100">
          {val} FPM
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '140px',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setSelectedConfig(row);
              setIsDetailOpen(true);
            }}
            title="View Details"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Eye size={15} />
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setEditingConfig(row);
                setIsFormOpen(true);
              }}
              title="Edit"
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors"
            >
              <Edit size={15} />
            </button>
          )}
          {canChangeStatus && (
            <button
              onClick={() => handleToggleStatus(row)}
              title={row.status === 'active' ? 'Deactivate' : 'Activate'}
              className={`p-1.5 rounded-md transition-colors ${
                row.status === 'active'
                  ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-600'
                  : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
              }`}
            >
              <Power size={15} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteClick(row)}
              title="Delete"
              className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Face Velocity Master"
        subtitle="Manage Grade-wise dimensions, depth ranges, pleats, filtration area, and face velocities"
        breadcrumbs={[
          { label: 'Master' },
          { label: 'Item Master' },
          { label: 'Face Velocity Master' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Sparkles}
              onClick={handleSeedDefaults}
              loading={seedLoading}
              title="Ensure standard reference data (15 rows for EU-2/3/4) is populated"
              className="text-xs px-3 py-1.5"
            >
              Seed Defaults
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingConfig(null);
                  setIsFormOpen(true);
                }}
                className="text-xs px-3 py-1.5 font-semibold"
              >
                Add Configuration
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}
      {successMessage && <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search dimension, pleats, velocity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="w-44">
            <Select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs"
            >
              <option value="all">All Filter Grades</option>
              {filterGrades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.filterGrade}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(searchTerm || gradeFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setGradeFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Reset Filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => refetch()}
            loading={loading}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={configurations}
          loading={loading}
          emptyMessage="No Face Velocity configurations found. Click 'Add Configuration' or 'Seed Defaults' to get started."
        />
      </div>

      {/* Form Modal (Create / Edit) */}
      <FaceVelocityFormModal
        isOpen={isFormOpen}
        configData={editingConfig}
        onClose={() => {
          setIsFormOpen(false);
          setEditingConfig(null);
        }}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          refetch();
        }}
      />

      {/* Detail Modal */}
      <FaceVelocityDetailModal
        isOpen={isDetailOpen}
        config={selectedConfig}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedConfig(null);
        }}
        onEdit={(cfg) => {
          setEditingConfig(cfg);
          setIsFormOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteFaceVelocityModal
        isOpen={isDeleteDialogOpen}
        config={configToDelete}
        loading={deleteLoading}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setConfigToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default FaceVelocityMasterList;
