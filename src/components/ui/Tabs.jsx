import React from 'react';

const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  return (
    <div className={`tabs-header ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            className={`tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {Icon && <Icon size={14} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'var(--primary-100)' : 'var(--neutral-100)',
                    color: isActive ? 'var(--primary-800)' : 'var(--neutral-600)',
                    fontWeight: 600,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
