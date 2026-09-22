import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserCheck,
  Building2, 
  LogOut, 
  Shield, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText,
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  ClipboardList,
  Calculator,
  FileCheck,
  Wrench,
  Search,
  Command,
  User,
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Screen size check for mobile drawer mode
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  // Sidebar collapsed state for desktop
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('netfil_sidebar_collapsed') === 'true';
  });

  // Mobile sidebar open drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dropdown states for header popovers
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef(null);

  // Track expanded navigation groups
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const savedState = localStorage.getItem('netfil_sidebar_expanded_groups');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error("Failed to parse expanded groups state:", e);
      }
    }
    return { 'item-master': true, 'commercial-module': true, 'bom-module': true, 'production-module': true };
  });

  // Handle window resize for mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (⌘K or Ctrl+K) to open Quick Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-expand parent group on route change
  useEffect(() => {
    const path = location.pathname;
    const itemMasterPaths = ['/uoms', '/items', '/item-groups', '/item-categories', '/specifications'];
    const isItemMasterChild = itemMasterPaths.some((p) => path.startsWith(p));

    const commercialPaths = ['/clients', '/parties', '/requirements', '/enquiries', '/enquiry-mis', '/quotations', '/sales-orders', '/master-boms', '/order-boms', '/work-orders'];
    const isCommercialChild = commercialPaths.some((p) => path.startsWith(p));

    if (isItemMasterChild) {
      setExpandedGroups((prev) => ({ ...prev, 'item-master': true }));
    }
    if (isCommercialChild) {
      setExpandedGroups((prev) => ({ ...prev, 'commercial-module': true }));
    }
    // Close mobile drawer on route navigation
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('netfil_sidebar_collapsed', String(next));
        return next;
      });
    }
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

  // Breadcrumbs generator
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const map = {
      '/dashboard': [{ label: 'Operations' }, { label: 'Dashboard' }],
      '/employees': [{ label: 'Organization' }, { label: 'Employee Master' }],
      '/users': [{ label: 'Security' }, { label: 'User Accounts' }],
      '/roles': [{ label: 'Security' }, { label: 'Role Management' }],
      '/departments': [{ label: 'Organization' }, { label: 'Departments' }],
      '/uoms': [{ label: 'Item Master' }, { label: 'Units of Measure (UOM)' }],
      '/items': [{ label: 'Item Master' }, { label: 'Items Catalog' }],
      '/item-groups': [{ label: 'Item Master' }, { label: 'Item Groups' }],
      '/item-categories': [{ label: 'Item Master' }, { label: 'Item Categories' }],
      '/specifications': [{ label: 'Item Master' }, { label: 'Specifications' }],
      '/clients': [{ label: 'Commercial' }, { label: 'Party Master' }],
      '/parties': [{ label: 'Commercial' }, { label: 'Party Master' }],
      '/requirements': [{ label: 'Commercial' }, { label: 'Client Requirements' }],
      '/enquiries': [{ label: 'Commercial' }, { label: 'Client Enquiries' }],
      '/enquiry-mis': [{ label: 'Commercial' }, { label: 'Enquiry MIS Reports' }],
      '/quotations': [{ label: 'Commercial' }, { label: 'Quotation Register' }],
      '/sales-orders': [{ label: 'Commercial' }, { label: 'Sales Orders' }],
      '/master-boms': [{ label: 'BOM' }, { label: 'Master BOMs' }],
      '/order-boms': [{ label: 'BOM' }, { label: 'Order BOMs' }],
      '/work-orders': [{ label: 'Shop Floor' }, { label: 'Work Orders' }],
    };
    return map[path] || [{ label: 'Workspace' }];
  };

  // Menu structure
  const menuSections = [
    {
      title: 'CORE MODULES',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null },
      ],
    },
    {
      title: 'ORGANIZATION & SECURITY',
      items: [
        { label: 'Employees', path: '/employees', icon: Users, permission: 'EMPLOYEE_VIEW' },
        { label: 'User Accounts', path: '/users', icon: UserCheck, permission: 'USER_VIEW' },
        { label: 'Role Management', path: '/roles', icon: Shield, permission: 'ROLE_VIEW' },
        { label: 'Departments', path: '/departments', icon: Building2, permission: 'DEPARTMENT_VIEW' },
      ],
    },
    {
      title: 'COMMERCIAL & ENGINEERING',
      items: [
        {
          id: 'item-master',
          label: 'Item Master',
          icon: Package,
          isGroup: true,
          children: [
            { label: 'Items Catalog', path: '/items', icon: Package, permission: 'ITEM_VIEW' },
            { label: 'Item Groups', path: '/item-groups', icon: Layers, permission: 'ITEM_GROUP_VIEW' },
            { label: 'Item Categories', path: '/item-categories', icon: Layers, permission: 'ITEM_CATEGORY_VIEW' },
            { label: 'Specifications', path: '/specifications', icon: Layers, permission: 'SPECIFICATION_VIEW' },
            { label: 'Units of Measure', path: '/uoms', icon: Layers, permission: 'UOM_VIEW' },
          ],
        },
        {
          id: 'commercial-module',
          label: 'Commercial & Sales',
          icon: ShoppingCart,
          isGroup: true,
          children: [
            { label: 'Party Master', path: '/clients', icon: Users, permission: 'CLIENT_VIEW' },
            { label: 'Enquiry & Requirement', path: '/requirements', icon: ClipboardList, permission: 'REQUIREMENT_VIEW' },
            { label: 'Enquiry MIS', path: '/enquiry-mis', icon: FileText, permission: 'REQUIREMENT_VIEW' },
            { label: 'Quotation', path: '/quotations', icon: Calculator, permission: 'QUOTATION_VIEW' },
            { label: 'Sales Orders', path: '/sales-orders', icon: FileCheck, permission: 'SALES_ORDER_VIEW' },
          ],
        },
        {
          id: 'bom-module',
          label: 'BOM',
          icon: Layers,
          isGroup: true,
          children: [
            { label: 'Master BOM', path: '/master-boms', icon: Layers, permission: 'BOM_VIEW' },
            { label: 'Order BOM Routing', path: '/order-boms', icon: ClipboardList, permission: 'ORDER_BOM_VIEW' },
          ],
        },
        {
          id: 'production-module',
          label: 'Production & Shop Floor',
          icon: Wrench,
          isGroup: true,
          children: [
            { label: 'Work Orders', path: '/work-orders', icon: Wrench, permission: 'WORK_ORDER_VIEW' },
          ],
        },
      ],
    },
  ];

  // Quick navigation items for Cmd+K search dialog
  const quickJumpItems = [
    { label: 'Items Catalog', path: '/items', category: 'Item Master', permission: 'ITEM_VIEW' },
    { label: 'Item Groups', path: '/item-groups', category: 'Item Master', permission: 'ITEM_GROUP_VIEW' },
    { label: 'Item Categories', path: '/item-categories', category: 'Item Master', permission: 'ITEM_CATEGORY_VIEW' },
    { label: 'Party Master', path: '/clients', category: 'Commercial', permission: 'CLIENT_VIEW' },
    { label: 'Requirement / Enquiry', path: '/requirements', category: 'Commercial', permission: 'REQUIREMENT_VIEW' },
    { label: 'Quotation Register', path: '/quotations', category: 'Commercial', permission: 'QUOTATION_VIEW' },
    { label: 'Sales Orders', path: '/sales-orders', category: 'Commercial', permission: 'SALES_ORDER_VIEW' },
    { label: 'Master BOMs', path: '/master-boms', category: 'BOM', permission: 'BOM_VIEW' },
    { label: 'Order BOMs', path: '/order-boms', category: 'BOM', permission: 'ORDER_BOM_VIEW' },
    { label: 'Work Orders', path: '/work-orders', category: 'Production', permission: 'WORK_ORDER_VIEW' },
    { label: 'Employee Master', path: '/employees', category: 'Organization', permission: 'EMPLOYEE_VIEW' },
    { label: 'User Accounts', path: '/users', category: 'Security', permission: 'USER_VIEW' },
    { label: 'Role Management', path: '/roles', category: 'Security', permission: 'ROLE_VIEW' },
  ].filter((item) => !item.permission || hasPermission(item.permission));

  const filteredQuickJumps = quickJumpItems.filter((i) =>
    i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden font-sans select-none">
      
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobile && mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside 
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-50
          bg-slate-900 text-slate-200 flex flex-col shrink-0
          border-r border-slate-800 shadow-xl lg:shadow-none
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isMobile ? (mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full w-60') : (collapsed ? 'w-[60px]' : 'w-60')}
        `}
      >
        {/* Sidebar Brand Header */}
        <div className="h-14 px-3 border-b border-slate-800/80 flex items-center justify-between overflow-hidden shrink-0 bg-white transition-all duration-300">
          <div className="flex items-center justify-center overflow-hidden py-1 w-full">
            <img 
              src="/logo.png" 
              alt="Netfil Clean Solutions" 
              className={`object-contain transition-all duration-300 ${collapsed && !isMobile ? 'h-7 w-7' : 'h-8 max-w-[170px]'}`} 
            />
          </div>

          {/* Close button for mobile drawer */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-2 flex-1 overflow-y-auto overflow-x-hidden space-y-3 custom-scrollbar">
          {menuSections.map((section, sIdx) => {
            const visibleItems = section.items
              .map((item) => {
                if (item.isGroup) {
                  const visibleChildren = item.children.filter(
                    (child) => !child.permission || hasPermission(child.permission)
                  );
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
              <div key={sIdx} className="space-y-1">
                {/* Section Title */}
                <div 
                  className={`
                    text-[10px] uppercase tracking-wider text-slate-400 px-2.5 py-1 font-bold font-mono
                    transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap
                    ${collapsed && !isMobile ? 'opacity-0 max-h-0 py-0' : 'opacity-100 max-h-8'}
                  `}
                >
                  {section.title}
                </div>

                {visibleItems.map((item) => {
                  if (item.isGroup) {
                    const isExpanded = !!expandedGroups[item.id];
                    const isChildActive = item.children.some((child) =>
                      location.pathname.startsWith(child.path)
                    );
                    const GroupIcon = item.icon;

                    return (
                      <div key={item.id} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (collapsed && !isMobile) {
                              setCollapsed(false);
                              setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
                            } else {
                              toggleGroup(item.id);
                            }
                          }}
                          title={collapsed && !isMobile ? item.label : undefined}
                          className={`
                            w-full flex items-center justify-between py-2 rounded-lg text-xs font-medium
                            transition-all duration-300 ease-in-out group cursor-pointer overflow-hidden
                            ${collapsed && !isMobile ? 'px-0 justify-center' : 'px-2.5'}
                            ${isChildActive ? 'text-blue-400 font-semibold bg-slate-800/80 shadow-xs' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}
                          `}
                        >
                          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed && !isMobile ? 'justify-center w-full' : ''}`}>
                            <GroupIcon size={17} className={`shrink-0 transition-colors ${isChildActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                            <span 
                              className={`
                                truncate transition-all duration-300 ease-in-out whitespace-nowrap
                                ${collapsed && !isMobile ? 'opacity-0 max-w-0 hidden' : 'opacity-100 max-w-xs'}
                              `}
                            >
                              {item.label}
                            </span>
                          </div>
                          <div 
                            className={`
                              transition-all duration-300 shrink-0
                              ${collapsed && !isMobile ? 'opacity-0 hidden' : 'opacity-100 scale-100'}
                              ${isExpanded ? 'rotate-180 text-blue-400' : 'text-slate-500'}
                            `}
                          >
                            <ChevronDown size={14} />
                          </div>
                        </button>

                        {/* Accordion Submenu */}
                        <div 
                          className={`
                            pl-2.5 border-l border-slate-800/80 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out
                            ${collapsed && !isMobile 
                              ? 'max-h-0 opacity-0 ml-0' 
                              : (isExpanded ? 'max-h-96 opacity-100 ml-3 mt-0.5' : 'max-h-0 opacity-0 ml-3')}
                          `}
                        >
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                className={({ isActive }) => `
                                  flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] font-medium
                                  transition-all duration-200 relative group whitespace-nowrap
                                  ${isActive 
                                    ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}
                                `}
                              >
                                <ChildIcon size={14} className="shrink-0" />
                                <span className="truncate">{child.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Single NavLink item
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={collapsed && !isMobile ? item.label : undefined}
                      className={({ isActive }) => `
                        flex items-center py-2 rounded-lg text-xs font-medium
                        transition-all duration-300 ease-in-out group overflow-hidden whitespace-nowrap
                        ${collapsed && !isMobile ? 'justify-center px-0' : 'px-2.5 gap-2.5'}
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}
                      `}
                    >
                      <Icon size={17} className="shrink-0 text-slate-400 group-hover:text-slate-200 transition-colors" />
                      <span 
                        className={`
                          truncate transition-all duration-300 ease-in-out
                          ${collapsed && !isMobile ? 'opacity-0 max-w-0 hidden' : 'opacity-100 max-w-xs'}
                        `}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div 
                className={`
                  transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap min-w-0
                  ${collapsed && !isMobile ? 'opacity-0 max-w-0 hidden' : 'opacity-100 max-w-xs'}
                `}
              >
                <div className="text-xs font-semibold text-white truncate">
                  {user?.employee?.fullName || user?.username || 'Admin'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">NETFIL Workspace</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className={`
                p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-300 cursor-pointer shrink-0
                ${collapsed && !isMobile ? 'opacity-0 max-w-0 hidden' : 'opacity-100'}
              `}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-100">
        
        {/* TOP NAVBAR */}
        <header className="h-14 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 lg:px-6 shadow-2xs z-30 shrink-0">
          
          {/* Left Controls: Hamburger + Breadcrumbs */}
          <div className="flex items-center gap-3">
            
            {/* Custom Animated Hamburger Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 active:scale-95 transition-all cursor-pointer border border-slate-200 shadow-2xs group"
              title={isMobile ? (mobileOpen ? 'Close Menu' : 'Open Menu') : (collapsed ? 'Expand Sidebar' : 'Collapse Sidebar')}
            >
              {/* Morphing Hamburger Icon */}
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${collapsed ? 'w-4' : 'w-4'}`} />
                <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${collapsed ? 'w-2.5' : 'w-3.5'}`} />
                <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${collapsed ? 'w-3.5' : 'w-2.5'}`} />
              </div>
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">NETFIL</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight size={13} className="text-slate-300" />
                  <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-900' : 'text-slate-500 font-medium'}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>

          </div>

          {/* Center Command Quick Search Trigger */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-500 transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>Search pages, modules, or BOMs...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                <Command size={10} /> K
              </div>
            </button>
          </div>

          {/* Right Controls: User Menu */}
          <div className="flex items-center gap-2.5">
            
            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs shadow-2xs">
                  {user?.employee?.fullName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-semibold text-xs text-slate-900">
                    {user?.employee?.fullName || user?.username || 'Admin User'}
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    {user?.roles && user.roles.length > 0
                      ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].roleName)
                      : 'System Admin'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Popover */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-fadeIn p-1.5 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-semibold text-slate-900">{user?.employee?.fullName || user?.username}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.employee?.email || 'admin@netfil-erp.local'}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/users'); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <User size={14} />
                    <span>User Account & Security</span>
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/employees'); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 size={14} />
                    <span>Organization Matrix</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* QUICK JUMP COMMAND SEARCH DIALOG (⌘K) */}
      {searchOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex items-center gap-2.5">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to page or module..."
                className="w-full text-sm bg-transparent outline-none text-slate-900 placeholder-slate-400"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {filteredQuickJumps.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No matching pages found</div>
              ) : (
                filteredQuickJumps.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      navigate(item.path);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between text-xs text-slate-700 transition-colors cursor-pointer group"
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10.5px] px-2 py-0.5 rounded bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-800">
                      {item.category}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>Use <kbd className="font-mono bg-white px-1 border rounded">↑</kbd> <kbd className="font-mono bg-white px-1 border rounded">↓</kbd> to navigate</span>
              <span><kbd className="font-mono bg-white px-1 border rounded">ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MainLayout;
