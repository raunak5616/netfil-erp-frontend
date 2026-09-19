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
    <div className="mb-4">
      {/* Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-slate-400" />}
                {isLast || !crumb.path ? (
                  <span className={isLast ? 'text-slate-900 font-semibold' : 'text-slate-600'}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.path} className="text-slate-600 hover:text-slate-900 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Page Title Header */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
          {description && <p className="text-[12.5px] text-slate-500 mt-0.5">{description}</p>}
        </div>

        {(actions || children) && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
