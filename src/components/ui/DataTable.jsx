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
    <div className={`table-container ${className}`}>
      {loading ? (
        <div className="flex-center" style={{ padding: '40px 0', flexDirection: 'column', gap: '8px' }}>
          <div className="loading-spinner" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent', width: '24px', height: '24px' }} />
          <span className="text-muted" style={{ fontSize: '13px' }}>Loading data...</span>
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
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
            <tbody>
              {data.map((row, rowIndex) => {
                const rowKey = row[keyField] || rowIndex;
                return (
                  <tr key={rowKey}>
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
            <div className="table-pagination">
              <div>
                Showing <strong>{data.length}</strong> of <strong>{pagination.totalRecords || data.length}</strong> records
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination-controls">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </Button>

                  <span style={{ padding: '0 8px', fontSize: '12.5px', fontWeight: 600 }}>
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
