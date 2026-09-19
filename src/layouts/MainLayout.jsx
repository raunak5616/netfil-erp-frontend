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
  Layers,
  ClipboardList,
  Calculator,
  CheckSquare,
  Wrench,
  FileCheck
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
    return { 'item-master': true, 'commercial-module': true };
  });

  // Auto-expand parent group on route match or browser refresh
  useEffect(() => {
    const path = location.pathname;
    const itemMasterPaths = ['/uoms', '/items', '/item-groups', '/item-categories', '/specifications'];
    const isItemMasterChild = itemMasterPaths.some((p) => path.startsWith(p));

    const commercialPaths = ['/clients', '/parties', '/requirements', '/enquiries', '/enquiry-mis', '/quotations', '/sales-orders', '/master-boms', '/order-boms', '/work-orders'];
    const isCommercialChild = commercialPaths.some((p) => path.startsWith(p));

    if (isItemMasterChild) {
      setExpandedGroups((prev) => {
        if (prev['item-master']) return prev;
        const next = { ...prev, 'item-master': true };
        localStorage.setItem('netfil_sidebar_expanded_groups', JSON.stringify(next));
        return next;
      });
    }

    if (isCommercialChild) {
      setExpandedGroups((prev) => {
        if (prev['commercial-module']) return prev;
        const next = { ...prev, 'commercial-module': true };
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
    if (path === '/clients' || path === '/parties') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Party Master' }];
    }
    if (path === '/requirements' || path === '/enquiries') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Requirement / Enquiry' }];
    }
    if (path === '/enquiry-mis') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Enquiry MIS' }];
    }
    if (path === '/quotations') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Quotation' }];
    }
    if (path === '/sales-orders') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Sales Order' }];
    }
    if (path === '/master-boms') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Master BOM' }];
    }
    if (path === '/order-boms') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Order BOM' }];
    }
    if (path === '/work-orders') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Commercial' }, { label: 'Work Order' }];
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
          id: 'commercial-module',
          label: 'Commercial',
          icon: ShoppingCart,
          isGroup: true,
          children: [
            {
              label: 'Party Master',
              path: '/clients',
              icon: Users,
              permission: 'CLIENT_VIEW',
            },
            {
              label: 'Requirement / Enquiry',
              path: '/requirements',
              icon: ClipboardList,
              permission: 'REQUIREMENT_VIEW',
            },
            {
              label: 'Enquiry MIS',
              path: '/enquiry-mis',
              icon: FileText,
              permission: 'REQUIREMENT_VIEW',
            },
            {
              label: 'Quotation',
              path: '/quotations',
              icon: Calculator,
              permission: 'QUOTATION_VIEW',
            },
            {
              label: 'Sales Order',
              path: '/sales-orders',
              icon: FileCheck,
              permission: 'SALES_ORDER_VIEW',
            },
            {
              label: 'Master BOM',
              path: '/master-boms',
              icon: Layers,
              permission: 'BOM_VIEW',
            },
            {
              label: 'Order BOM',
              path: '/order-boms',
              icon: ClipboardList,
              permission: 'ORDER_BOM_VIEW',
            },
            {
              label: 'Work Order',
              path: '/work-orders',
              icon: Wrench,
              permission: 'WORK_ORDER_VIEW',
            },
          ],
        },
      ],
    },
  ];

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Collapsible Sidebar */}
      <aside className={`bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-200 z-50 ${collapsed ? 'w-15' : 'w-60'}`}>
        <div className="h-13 px-4 border-b border-white/10 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <Shield size={22} className="text-blue-500 shrink-0" />
          {!collapsed && <div className="font-bold text-sm tracking-wider text-white">NETFIL ERP</div>}
        </div>

        <nav className="p-2 flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
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
              <div key={idx} className="mb-2">
                {!collapsed && <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2.5 pt-3.5 pb-1 font-bold whitespace-nowrap">{section.title}</div>}
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
                          className={`flex items-center justify-center p-2.5 rounded text-xs text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer ${
                            isChildActive ? 'bg-blue-700 text-white' : ''
                          }`}
                          title={`${item.label} (${item.children.length} items)`}
                          onClick={() => {
                            toggleSidebar();
                            setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
                          }}
                        >
                          <GroupIcon size={16} />
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="mb-1">
                        <div
                          className={`flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors cursor-pointer select-none ${
                            isChildActive ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                          onClick={() => toggleGroup(item.id)}
                          title={item.label}
                        >
                          <div className="flex items-center gap-2.5">
                            <GroupIcon size={16} />
                            <span>{item.label}</span>
                          </div>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>

                        {isExpanded && (
                          <div className="ml-3.5 pl-2.5 border-l border-white/10 mt-0.5 mb-1 flex flex-col gap-0.5">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;

                              if (child.phase2 && child.path !== '/uoms' && child.path !== '/items' && child.path !== '/item-groups' && child.path !== '/item-categories' && child.path !== '/specifications' && child.path !== '/requirements' && child.path !== '/enquiries') {
                                return (
                                  <div
                                    key={child.path}
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[12.5px] text-slate-400 opacity-40 cursor-not-allowed whitespace-nowrap"
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
                                  className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[12.5px] font-medium transition-colors whitespace-nowrap ${
                                      isActive ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`
                                  }
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

                  if (item.phase2 && item.path !== '/employees' && item.path !== '/dashboard' && item.path !== '/clients') {
                    return (
                      <div
                        key={item.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-xs opacity-40 cursor-not-allowed whitespace-nowrap ${
                          collapsed ? 'justify-center' : ''
                        }`}
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
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                          collapsed ? 'justify-center' : ''
                        } ${isActive ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
                      }
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-13 bg-white border-b border-slate-200 flex items-center justify-between px-5 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-1.5 rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              onClick={toggleSidebar}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Context */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-500">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={12} className="text-slate-400" />}
                  <span className={idx === breadcrumbs.length - 1 ? 'text-slate-900 font-semibold' : 'text-slate-600'}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold text-xs border border-blue-200">
              {user?.employee?.fullName
                ? user.employee.fullName.charAt(0).toUpperCase()
                : user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="flex flex-col leading-snug">
              <span className="font-semibold text-xs text-slate-900">
                {user?.employee?.fullName || user?.username || 'User'}
              </span>
              <span className="text-[11px] text-slate-500">
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
              className="ml-2"
              title="Sign Out"
            >
              Logout
            </Button>
          </div>
        </header>

        {/* Content Body Area */}
        <main className="p-5 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
