import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { 
  Users, 
  UserCheck,
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
  ChevronDown,
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

  // Track expanded parent groups
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const savedState = localStorage.getItem('netfil_sidebar_expanded_groups');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error("Failed to parse expanded groups state:", e);
      }
    }
    return { 'item-master': true };
  });

  // Auto-expand parent group on route match or browser refresh
  useEffect(() => {
    const path = location.pathname;
    const itemMasterPaths = ['/uoms', '/items', '/item-groups', '/item-categories', '/specifications'];
    const isItemMasterChild = itemMasterPaths.some((p) => path.startsWith(p));

    if (isItemMasterChild) {
      setExpandedGroups((prev) => {
        if (prev['item-master']) return prev;
        const next = { ...prev, 'item-master': true };
        localStorage.setItem('netfil_sidebar_expanded_groups', JSON.stringify(next));
        return next;
      });
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('netfil_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      localStorage.setItem('netfil_sidebar_expanded_groups', JSON.stringify(next));
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
    if (path === '/users') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'System & Security' }, { label: 'User Accounts' }];
    }
    if (path === '/departments') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Organization' }, { label: 'Departments' }];
    }
    if (path === '/uoms') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Item Master' }, { label: 'Units of Measure' }];
    }
    if (path === '/items') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Item Master' }, { label: 'Items' }];
    }
    if (path === '/item-groups') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Item Master' }, { label: 'Item Groups' }];
    }
    if (path === '/item-categories') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Item Master' }, { label: 'Item Categories' }];
    }
    if (path === '/specifications') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Item Master' }, { label: 'Specifications' }];
    }
    return [{ label: 'Home', path: '/dashboard' }];
  };

  // Centralized module menu structure
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
          label: 'User Accounts',
          path: '/users',
          icon: UserCheck,
          permission: 'USER_VIEW',
        },
        {
          label: 'Departments',
          path: '/departments',
          icon: Building2,
          permission: 'DEPARTMENT_VIEW',
        },
      ],
    },
    {
      title: 'COMMERCIAL & INVENTORY',
      items: [
        {
          id: 'item-master',
          label: 'Item Master',
          icon: Package,
          isGroup: true,
          children: [
            {
              label: 'Items',
              path: '/items',
              icon: Package,
              permission: 'ITEM_VIEW',
            },
            {
              label: 'Item Groups',
              path: '/item-groups',
              icon: Layers,
              permission: 'ITEM_GROUP_VIEW',
              phase2: true,
            },
            {
              label: 'Item Categories',
              path: '/item-categories',
              icon: Layers,
              permission: 'ITEM_CATEGORY_VIEW',
              phase2: true,
            },
            {
              label: 'Specifications',
              path: '/specifications',
              icon: Layers,
              permission: 'SPECIFICATION_VIEW',
              phase2: true,
            },
            {
              label: 'Units of Measure (UOM)',
              path: '/uoms',
              icon: Layers,
              permission: 'UOM_VIEW',
            },
          ],
        },
        {
          label: 'Clients',
          path: '/clients',
          icon: Users,
          permission: 'CLIENT_VIEW',
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
            // Filter items & groups by user permissions
            const visibleItems = section.items
              .map((item) => {
                if (item.isGroup) {
                  const visibleChildren = item.children.filter((child) => {
                    if (!child.permission) return true;
                    return hasPermission(child.permission);
                  });

                  if (visibleChildren.length === 0) return null;
                  return { ...item, children: visibleChildren };
                }

                if (!item.permission || hasPermission(item.permission)) {
                  return item;
                }
                return null;
              })
              .filter(Boolean);

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} style={{ marginBottom: '8px' }}>
                {!collapsed && <div className="nav-section-title">{section.title}</div>}
                {visibleItems.map((item) => {
                  if (item.isGroup) {
                    const isExpanded = !!expandedGroups[item.id];
                    const isChildActive = item.children.some((child) =>
                      location.pathname.startsWith(child.path)
                    );
                    const GroupIcon = item.icon;

                    if (collapsed) {
                      return (
                        <div
                          key={item.id}
                          className={`nav-item ${isChildActive ? 'active' : ''}`}
                          title={`${item.label} (${item.children.length} items)`}
                          onClick={() => {
                            toggleSidebar();
                            setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <GroupIcon size={16} />
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} style={{ marginBottom: '4px' }}>
                        <div
                          className={`nav-group-header ${isChildActive ? 'active-group' : ''}`}
                          onClick={() => toggleGroup(item.id)}
                          title={item.label}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <GroupIcon size={16} />
                            <span>{item.label}</span>
                          </div>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>

                        {isExpanded && (
                          <div className="nav-sub-items">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;

                              if (child.phase2 && child.path !== '/uoms' && child.path !== '/items') {
                                return (
                                  <div
                                    key={child.path}
                                    className="nav-item"
                                    style={{ opacity: 0.4, cursor: 'not-allowed' }}
                                    title={`${child.label} (Queued for Phase 2)`}
                                  >
                                    <ChildIcon size={15} />
                                    <span>{child.label}</span>
                                  </div>
                                );
                              }

                              return (
                                <NavLink
                                  key={child.path}
                                  to={child.path}
                                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                >
                                  <ChildIcon size={15} />
                                  <span>{child.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Standard single navigation item
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
                {user?.roles && user.roles.length > 0
                  ? user.roles.map((r) => (typeof r === 'string' ? r : r.roleName)).join(', ')
                  : user?.role?.roleName || 'System User'}
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
