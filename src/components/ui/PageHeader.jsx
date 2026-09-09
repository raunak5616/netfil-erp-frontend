import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const PageHeader = ({
  title,
  description,
  breadcrumbs = [],
  actions = null,
  children,
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumb" style={{ marginBottom: '6px' }}>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} color="var(--neutral-400)" />}
                {isLast || !crumb.path ? (
                  <span className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-item">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Page Title Header */}
      <div className="page-header-container">
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>

        {(actions || children) && (
          <div className="page-actions">
            {actions}
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
