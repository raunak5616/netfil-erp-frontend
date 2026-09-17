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
import ItemGroupList from './pages/item-groups/ItemGroupList';
import ItemCategoryList from './pages/item-categories/ItemCategoryList';
import SpecificationList from './pages/specifications/SpecificationList';
import ClientList from './pages/clients/ClientList';
import RequirementList from './pages/requirements/RequirementList';
import EnquiryMis from './pages/requirements/EnquiryMis';
import QuotationList from './pages/quotations/QuotationList';
import SalesOrderList from './pages/sales-orders/SalesOrderList';
import MasterBOMList from './pages/master-boms/MasterBOMList';
import OrderBOMList from './pages/order-boms/OrderBOMList';
import WorkOrderList from './pages/work-orders/WorkOrderList';

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

              {/* Protected Party Master Route */}
              <Route element={<ProtectedRoute requiredPermission="CLIENT_VIEW" />}>
                <Route path="/clients" element={<ClientList />} />
                <Route path="/parties" element={<ClientList />} />
              </Route>

              {/* Protected Requirement / Enquiry & Enquiry MIS Route */}
              <Route element={<ProtectedRoute requiredPermission="REQUIREMENT_VIEW" />}>
                <Route path="/requirements" element={<RequirementList />} />
                <Route path="/enquiries" element={<RequirementList />} />
                <Route path="/enquiry-mis" element={<EnquiryMis />} />
              </Route>

              {/* Protected Quotation Module Route */}
              <Route element={<ProtectedRoute requiredPermission="QUOTATION_VIEW" />}>
                <Route path="/quotations" element={<QuotationList />} />
              </Route>

              {/* Protected Sales Order Module Route */}
              <Route element={<ProtectedRoute requiredPermission="SALES_ORDER_VIEW" />}>
                <Route path="/sales-orders" element={<SalesOrderList />} />
              </Route>

              {/* Protected Master BOM Module Route */}
              <Route element={<ProtectedRoute requiredPermission="BOM_VIEW" />}>
                <Route path="/master-boms" element={<MasterBOMList />} />
              </Route>

              {/* Protected Order BOM Module Route */}
              <Route element={<ProtectedRoute requiredPermission="ORDER_BOM_VIEW" />}>
                <Route path="/order-boms" element={<OrderBOMList />} />
              </Route>

              {/* Protected Work Order Module Route */}
              <Route element={<ProtectedRoute requiredPermission="WORK_ORDER_VIEW" />}>
                <Route path="/work-orders" element={<WorkOrderList />} />
              </Route>

              {/* Protected UOM Module Route */}
              <Route element={<ProtectedRoute requiredPermission="UOM_VIEW" />}>
                <Route path="/uoms" element={<UOMList />} />
              </Route>

              {/* Protected Item Groups Module Route */}
              <Route element={<ProtectedRoute requiredPermission="ITEM_GROUP_VIEW" />}>
                <Route path="/item-groups" element={<ItemGroupList />} />
              </Route>

              {/* Protected Item Categories Module Route */}
              <Route element={<ProtectedRoute requiredPermission="ITEM_CATEGORY_VIEW" />}>
                <Route path="/item-categories" element={<ItemCategoryList />} />
              </Route>

              {/* Protected Specifications Module Route */}
              <Route element={<ProtectedRoute requiredPermission="SPECIFICATION_VIEW" />}>
                <Route path="/specifications" element={<SpecificationList />} />
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
