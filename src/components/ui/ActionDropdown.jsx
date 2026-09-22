import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

const ActionDropdown = ({ items = [], align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const filterItems = items.filter((item) => item.show !== false);

  if (filterItems.length === 0) return null;

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = filterItems.length * 34 + 16;
      const openUpward = rect.bottom + menuHeight > window.innerHeight;

      const leftPos = align === 'right' ? Math.max(10, rect.right - 180) : rect.left;

      setCoords({
        top: openUpward ? Math.max(10, rect.top - menuHeight) : rect.bottom + 4,
        left: leftPos,
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`p-1.5 rounded-md transition-all border ${
          isOpen
            ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-inner'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
        }`}
        title="Actions Menu"
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
        }}
      >
        <MoreVertical size={15} />
      </button>

      {isOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '185px',
              zIndex: 9999,
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.06)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
              padding: '4px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {filterItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={index}>
                  {item.divider && <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />}
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      item.onClick();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      color: item.danger
                        ? '#dc2626'
                        : item.color || '#334155',
                      opacity: item.disabled ? 0.5 : 1,
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!item.disabled) {
                        e.currentTarget.style.backgroundColor = item.danger ? '#fef2f2' : '#f1f5f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {Icon && <Icon size={14} style={{ color: item.danger ? '#dc2626' : item.color || 'inherit' }} />}
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionDropdown;
