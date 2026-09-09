import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { 
  Users, 
  Building2, 
  LogOut, 
  Shield, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Boxes, 
  FileText,
  Menu,
  ChevronRight,
  Layers
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Persist sidebar collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('netfil_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('netfil_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build breadcrumb items based on path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Dashboard' }];
    }
    if (path === '/employees') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Organization' }, { label: 'Employees' }];
    }
    if (path === '/design-system') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'System' }, { label: 'UI Design System' }];
    }
    return [{ label: 'Home', path: '/dashboard' }];
  };

  // Define module menu structure
  const menuSections = [
    {
      title: 'CORE MODULES',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          permission: null,
        },
      ],
    },
    {
      title: 'ORGANIZATION & SECURITY',
      items: [
        {
          label: 'Employees',
          path: '/employees',
          icon: Users,
          permission: 'EMPLOYEE_VIEW',
        },
        {
          label: 'Departments',
          path: '/departments',
          icon: Building2,
          permission: 'DEPARTMENT_VIEW',
          phase2: true,
        },
      ],
    },
    {
      title: 'COMMERCIAL & INVENTORY',
      items: [
        {
          label: 'Clients',
          path: '/clients',
          icon: Users,
          permission: 'CLIENT_VIEW',
          phase2: true,
        },
        {
          label: 'Items',
          path: '/items',
          icon: Package,
          permission: 'ITEM_VIEW',
          phase2: true,
        },
        {
          label: 'Quotations',
          path: '/quotations',
          icon: FileText,
          permission: 'QUOTATION_VIEW',
          phase2: true,
        },
        {
          label: 'Sales Orders',
          path: '/sales-orders',
          icon: ShoppingCart,
          permission: 'SALES_ORDER_VIEW',
          phase2: true,
        },
        {
          label: 'Inventory',
          path: '/inventory',
          icon: Boxes,
          permission: 'INVENTORY_STOCK_VIEW',
          phase2: true,
        },
      ],
    },
  ];

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="app-container">
      {/* Collapsible Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
        <div className="sidebar-header">
          <Shield size={22} color="var(--primary-500)" style={{ flexShrink: 0 }} />
          {!collapsed && <div className="sidebar-brand">NETFIL ERP</div>}
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => {
              if (!item.permission) return true;
              return hasPermission(item.permission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} style={{ marginBottom: '8px' }}>
                {!collapsed && <div className="nav-section-title">{section.title}</div>}
                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  if (item.phase2 && item.path !== '/employees' && item.path !== '/dashboard') {
                    return (
                      <div
                        key={item.path}
                        className="nav-item"
                        style={{ opacity: 0.4, cursor: 'not-allowed' }}
                        title={`${item.label} (Queued for Phase 2)`}
                      >
                        <Icon size={16} />
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={16} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="header">
          <div className="header-left">
            <button
              type="button"
              className="btn btn-ghost btn-icon-only"
              onClick={toggleSidebar}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Context */}
            <nav className="breadcrumb">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={12} color="var(--neutral-400)" />}
                  <span className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="header-user-info">
            <div className="user-avatar">
              {user?.employee?.fullName
                ? user.employee.fullName.charAt(0).toUpperCase()
                : user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-900)' }}>
                {user?.employee?.fullName || user?.username || 'User'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                {user?.role?.roleName || 'System User'}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              onClick={handleLogout}
              style={{ marginLeft: '8px' }}
              title="Sign Out"
            >
              Logout
            </Button>
          </div>
        </header>

        {/* Content Body Area */}
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
