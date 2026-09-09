# NETFIL ERP — Frontend Development Documentation

## Phase Overview

- **PHASE 1 (Completed)**: Functional ERP Application Shell + Employee Module. Clean, simple, easy to navigate, permission-aware UI designed for workflow validation and client demonstration.
- **PHASE 2 (Upcoming)**: Professional visual redesign, rich graphics, animations, branding, and implementation of remaining ERP modules (Department, Client, Item, Quotation, Sales Order, Inventory, Production).

---

## 1. Frontend Architecture

The codebase follows a modular React component architecture structured as follows:

```text
netfil-erp-frontend/
├── src/
│   ├── components/       # Common reusable components
│   ├── context/          # Central state management (AuthContext)
│   ├── layouts/          # Application shell (MainLayout, Sidebar, Topbar)
│   ├── pages/            # Page-level modules
│   │   ├── employees/    # Employee list, form modal, detail modal
│   │   ├── Dashboard.jsx # Welcome landing page
│   │   └── Login.jsx     # User authentication page
│   ├── routes/           # Protected route guards
│   ├── services/         # API service layer (Axios instance, employeeService)
│   ├── App.jsx           # Application route definitions
│   ├── index.css         # Enterprise CSS tokens & system styles
│   └── main.jsx          # Entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## 2. Authentication Flow

1. User submits credentials on `/login` (`POST /api/auth/login`).
2. Backend responds with JWT `token` and `user` profile object (populated with employee data and role/permissions).
3. `token` is stored in `localStorage` (`netfil_token`) and attached to every HTTP request via Axios request interceptors (`Authorization: Bearer <token>`).
4. `AuthContext` maintains user session state and validates active token upon startup via `GET /api/auth/me`.
5. Axios response interceptor automatically handles 401 Unauthorized responses (token expiration) by purging local session state and redirecting to `/login`.

---

## 3. RBAC (Role-Based Access Control) & Permissions

NETFIL ERP enforces granular permission checking both on the backend and frontend.

- **Permission Checking Algorithm** (`AuthContext.hasPermission`):
  1. Checks user-level overrides (`user.permissions`):
     - If code matches with `effect: "DENY"`, returns `false`.
     - If code matches with `effect: "ALLOW"`, returns `true`.
  2. Checks role permissions (`user.role.permissions`):
     - Returns `true` if `permissionCode` exists in role permissions array.
  3. Returns `false` if permission is not granted.

- **UI Permission Awareness**:
  - **Sidebar**: Hides module links if user lacks the corresponding `VIEW` permission (e.g. `EMPLOYEE_VIEW`).
  - **Protected Routes**: `<ProtectedRoute requiredPermission="EMPLOYEE_VIEW" />` blocks direct URL navigation if permission is absent.
  - **Action Visibility**: Buttons like **"Add Employee"** (`EMPLOYEE_CREATE`) and **"Edit"** (`EMPLOYEE_EDIT`) are conditionally rendered based on user permissions.

---

## 4. API Integration Strategy

- **API Layer Separation**: All HTTP requests are encapsulated inside `src/services/` modules rather than being called directly in UI components.
- **Base URL**: Configurable via `import.meta.env.VITE_API_URL` or defaults to `/api` (proxied to `http://localhost:5000` via `vite.config.js`).
- **Error Handling**: Standardized response error extraction (`err.response.data.message`) with alert banners and retry capabilities.

---

## 5. Current Completed Module: Employee Master

- **List & Table**: Displays all employees with Code, Name, Department, Designation, Email, Joining Date, and Status.
- **Search & Filter**: Real-time client-side filter across code, name, designation, department, and active/inactive status.
- **Add Employee Modal**: Validates inputs (`employeeCode`, `fullName`, `department`, `designation`, `joiningDate`, `status`) and submits to `POST /api/employees`. Department select dropdown is dynamically fetched from `GET /api/departments`.
- **Edit Employee Modal**: Pre-fills existing record, disables immutable fields (`employeeCode`), and submits updates to `PUT /api/employees/:id`.
- **Detail Viewer Modal**: Comprehensive view of complete employee details.

---

## 6. Known Limitations (Phase 1 Scope)

- Pagination: The backend returns full lists sorted by creation date; pagination UI controls are prepared for backend server-side pagination endpoints.
- Single-module scope: Only Employee module is active in Phase 1 as requested. Remaining sidebar items are disabled with Phase 2 badges.

---

## 7. Future UI Redesign Plan (Phase 2)

After client approval of Phase 1 functionality:
- Introduce theme customization (Dark/Light mode).
- Advanced analytics dashboards & charts.
- Custom dropdowns & advanced data table sorting/pagination components.
- Implementation of Department, Client, Item, Quotation, Sales Order, Inventory, and Production modules.
