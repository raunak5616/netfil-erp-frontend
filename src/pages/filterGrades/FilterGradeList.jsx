import React, { useState, useEffect, useMemo } from 'react';
import { getFilterGrades, updateFilterGradeStatus } from '../../services/filterGradeService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import FilterGradeForm from './FilterGradeForm';
import FilterGradeDetail from './FilterGradeDetail';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  RefreshCw,
  Power
} from 'lucide-react';

const FilterGradeList = () => {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('FILTER_GRADE_CREATE');
  const canEdit = hasPermission('FILTER_GRADE_EDIT');
  const canChangeStatus = hasPermission('FILTER_GRADE_STATUS');

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);

  const fetchGrades = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFilterGrades();
      if (data.success && Array.isArray(data.filterGrades)) {
        setGrades(data.filterGrades);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err) {
      console.error("Failed to fetch filter grades:", err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const filteredGrades = useMemo(() => {
    return grades.filter((grade) => {
      if (statusFilter !== 'all' && grade.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const code = (grade.filterGrade || '').toLowerCase();
      const euro = (grade.eurovent || '').toLowerCase();
      const iso = (grade.iso || '').toLowerCase();

      return code.includes(term) || euro.includes(term) || iso.includes(term);
    });
  }, [grades, searchTerm, statusFilter]);

  const toggleStatus = async (grade) => {
    try {
      const newStatus = grade.status === 'active' ? 'inactive' : 'active';
      await updateFilterGradeStatus(grade._id, newStatus);
      fetchGrades();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      key: 'filterGrade',
      header: 'Filter Grade',
      width: '150px',
      render: (val) => (
        <span className="font-semibold text-primary-700">
          {val}
        </span>
      ),
    },
    {
      key: 'eurovent',
      header: 'EUROVENT',
      width: '120px',
      render: (val) => val || '—',
    },
    {
      key: 'iso',
      header: 'ISO',
      width: '120px',
      render: (val) => val || '—',
    },
    {
      key: 'variants',
      header: 'Variants',
      width: '120px',
      render: (val) => (
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
          {val?.length || 0} Variants
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '180px',
      render: (_, row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedGrade(row);
              setIsDetailOpen(true);
            }}
            title="View Details"
          />
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => {
                setEditingGrade(row);
                setIsFormOpen(true);
              }}
              title="Edit Grade"
            />
          )}
          {canChangeStatus && (
            <Button
              variant="ghost"
              size="sm"
              icon={Power}
              className={row.status === 'active' ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}
              onClick={() => toggleStatus(row)}
              title={row.status === 'active' ? 'Deactivate Grade' : 'Activate Grade'}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Filter Grade Master"
        description="Manage standard filter technical grades and variant specifications."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Item Master' },
          { label: 'Filter Grades' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={fetchGrades}>
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingGrade(null);
                  setIsFormOpen(true);
                }}
              >
                Add Filter Grade
              </Button>
            )}
          </>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input 
              className="pl-8"
              placeholder="Search by Grade, EUROVENT, or ISO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredGrades}
          loading={loading}
          emptyTitle="No filter grades found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "Add Filter Grade" above to create your first standard.'
          }
        />

        <div className="flex justify-between text-slate-500 mt-3 text-xs font-medium">
          <span>Showing {filteredGrades.length} of {grades.length} total filter grades</span>
          <span>Access Level: {canEdit ? 'Full Edit Access' : canCreate ? 'Create & View' : 'Read Only'}</span>
        </div>
      </div>

      <FilterGradeForm
        gradeData={editingGrade}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchGrades}
      />

      <FilterGradeDetail
        grade={selectedGrade}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(gd) => {
          setEditingGrade(gd);
          setIsFormOpen(true);
        }}
        onSuccess={fetchGrades}
        canEdit={canEdit}
      />
    </div>
  );
};

export default FilterGradeList;
