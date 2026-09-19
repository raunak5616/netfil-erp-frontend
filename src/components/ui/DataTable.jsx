import React from 'react';
import EmptyState from './EmptyState';
import Alert from './Alert';
import Button from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = '',
  onRetry = null,
  keyField = '_id',
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  pagination = null,
  className = '',
}) => {
  if (error) {
    return (
      <Alert type="danger" message={error}>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} style={{ marginTop: '8px' }}>
            Retry Loading
          </Button>
        )}
      </Alert>
    );
  }

  return (
    <div className={`overflow-x-auto border border-slate-200 rounded-md bg-white ${className}`}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-xs">Loading data...</span>
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    className="bg-slate-50 text-slate-700 font-semibold px-3 py-2 border-b border-slate-200 text-[11px] uppercase tracking-wider whitespace-nowrap"
                    style={{
                      textAlign: col.align || 'left',
                      width: col.width || 'auto',
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, rowIndex) => {
                const rowKey = row[keyField] || rowIndex;
                return (
                  <tr key={rowKey} className="hover:bg-slate-50 transition-colors">
                    {columns.map((col) => {
                      const cellValue = row[col.key];
                      const renderedContent = col.render
                        ? col.render(cellValue, row, rowIndex)
                        : cellValue !== undefined && cellValue !== null
                        ? String(cellValue)
                        : '—';

                      return (
                        <td
                          key={col.key || col.header}
                          className="px-3 py-2.5 border-b border-slate-200 text-slate-800 align-middle"
                          style={{ textAlign: col.align || 'left' }}
                        >
                          {renderedContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls Footer */}
          {pagination && (
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex-wrap gap-2.5">
              <div>
                Showing <strong className="font-semibold text-slate-900">{data.length}</strong> of <strong className="font-semibold text-slate-900">{pagination.totalRecords || data.length}</strong> records
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </Button>

                  <span className="px-2 text-xs font-semibold text-slate-800">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
