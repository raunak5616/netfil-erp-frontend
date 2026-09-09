import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import DepartmentList from './pages/departments/DepartmentList';
import UserList from './pages/users/UserList';
import UOMList from './pages/uom/UOMList';
import ItemList from './pages/items/ItemList';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Protected Employee Module Route */}
              <Route element={<ProtectedRoute requiredPermission="EMPLOYEE_VIEW" />}>
                <Route path="/employees" element={<EmployeeList />} />
              </Route>

              {/* Protected User Accounts Route */}
              <Route element={<ProtectedRoute requiredPermission="USER_VIEW" />}>
                <Route path="/users" element={<UserList />} />
              </Route>

              {/* Protected Department Module Route */}
              <Route element={<ProtectedRoute requiredPermission="DEPARTMENT_VIEW" />}>
                <Route path="/departments" element={<DepartmentList />} />
              </Route>

              {/* Protected UOM Module Route */}
              <Route element={<ProtectedRoute requiredPermission="UOM_VIEW" />}>
                <Route path="/uoms" element={<UOMList />} />
              </Route>

              {/* Protected Items Module Route */}
              <Route element={<ProtectedRoute requiredPermission="ITEM_VIEW" />}>
                <Route path="/items" element={<ItemList />} />
              </Route>

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/employees" replace />} />
              <Route path="*" element={<Navigate to="/employees" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
