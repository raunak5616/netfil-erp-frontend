import React, { useState } from 'react';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { viewEmployeeDocument } from '../../services/employeeService';

const EmployeeDetailModal = ({ employee, isOpen, onClose, onEdit, canEdit }) => {
  const [isViewingPdf, setIsViewingPdf] = useState(false);
  const [viewError, setViewError] = useState(null);

  if (!isOpen || !employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getInitials = (name) => {
    if (!name) return 'E';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleViewPdf = async () => {
    try {
      setIsViewingPdf(true);
      setViewError(null);
      await viewEmployeeDocument(employee._id);
    } catch (err) {
      console.error('Error opening employee PDF:', err);
      const msg = err.response?.data?.message || err.message || 'Unable to open employee document.';
      setViewError(msg);
    } finally {
      setIsViewingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Employee Details — ${employee.employeeCode || 'N/A'}`}
      maxWidth="560px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
            >
              Edit Employee
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Section 1: Employee Summary */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">
              {getInitials(employee.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {employee.fullName || '—'}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {employee.designation || '—'}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={employee.status} />
          </div>
        </div>

        {/* Section 2: Employee Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
          <div>
            <div className="text-slate-500 font-medium">Employee Code</div>
            <div className="font-mono font-medium text-slate-900 mt-0.5">
              {employee.employeeCode || '—'}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Department</div>
            <div className="font-medium text-slate-900 mt-0.5">
              {employee.department?.departmentName
                ? `${employee.department.departmentName}${employee.department?.departmentCode ? ` (${employee.department.departmentCode})` : ''}`
                : '—'}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Designation</div>
            <div className="font-medium text-slate-900 mt-0.5">
              {employee.designation || '—'}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Joining Date</div>
            <div className="font-medium text-slate-900 mt-0.5">
              {formatDate(employee.joiningDate)}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Email Address</div>
            <div className="font-medium text-slate-900 mt-0.5 truncate">
              {employee.email ? (
                <a
                  href={`mailto:${employee.email}`}
                  className="text-blue-600 hover:underline"
                  title={employee.email}
                >
                  {employee.email}
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Mobile Number</div>
            <div className="font-medium text-slate-900 mt-0.5">
              {employee.mobile ? (
                <a
                  href={`tel:${employee.mobile}`}
                  className="hover:underline"
                >
                  {employee.mobile}
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Employee Document */}
        <div className="pt-3.5 border-t border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-2">
            Employee Document
          </div>

          {employee.employeeDocument ? (
            <div>
              <div className="flex items-center justify-between gap-3 p-2.5 rounded border border-slate-200 bg-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-red-600 shrink-0" />
                  <span
                    className="text-xs font-medium text-slate-900 truncate"
                    title={employee.employeeDocument.fileName || 'employee_document.pdf'}
                  >
                    {employee.employeeDocument.fileName || 'employee_document.pdf'}
                  </span>
                  {employee.employeeDocument.fileSize ? (
                    <span className="text-xs text-slate-400 font-mono shrink-0">
                      {formatFileSize(employee.employeeDocument.fileSize)}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleViewPdf}
                  disabled={isViewingPdf}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  title="View PDF document"
                >
                  {isViewingPdf ? (
                    <Loader2 size={13} className="animate-spin text-slate-500" />
                  ) : (
                    <ExternalLink size={13} className="text-slate-500" />
                  )}
                  <span>View PDF</span>
                </button>
              </div>

              {viewError && (
                <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
                  <span>{viewError}</span>
                  <button
                    type="button"
                    onClick={() => setViewError(null)}
                    className="text-red-500 hover:text-red-700 ml-2 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No employee document uploaded.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeDetailModal;
