import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import PageLoader from './components/common/PageLoader';

// Eager load critical initial screen (Login)
import Login from './pages/Login';

// Lazy load all major application modules for code splitting and performance
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const EmployeeList = lazy(() => import('./pages/employees/EmployeeList'));
const DepartmentList = lazy(() => import('./pages/departments/DepartmentList'));
const UserList = lazy(() => import('./pages/users/UserList'));
const RoleList = lazy(() => import('./pages/roles/RoleList'));
const UOMList = lazy(() => import('./pages/uom/UOMList'));
const ItemList = lazy(() => import('./pages/items/ItemList'));
const ItemGroupList = lazy(() => import('./pages/item-groups/ItemGroupList'));
const ItemCategoryList = lazy(() => import('./pages/item-categories/ItemCategoryList'));
const SpecificationList = lazy(() => import('./pages/specifications/SpecificationList'));
const FilterGradeList = lazy(() => import('./pages/filterGrades/FilterGradeList'));
const FaceVelocityMasterList = lazy(() => import('./pages/face-velocity-master/FaceVelocityMasterList'));
const DrawingMasterList = lazy(() => import('./pages/drawing-master/DrawingMasterList'));
const TermsMasterList = lazy(() => import('./pages/terms/TermsMasterList'));
const ClientList = lazy(() => import('./pages/clients/ClientList'));
const RequirementList = lazy(() => import('./pages/requirements/RequirementList'));
const EnquiryMis = lazy(() => import('./pages/requirements/EnquiryMis'));
const QuotationList = lazy(() => import('./pages/quotations/QuotationList'));
const SalesOrderList = lazy(() => import('./pages/sales-orders/SalesOrderList'));
const MasterBOMList = lazy(() => import('./pages/master-boms/MasterBOMList'));
const OrderBOMList = lazy(() => import('./pages/order-boms/OrderBOMList'));
const WorkOrderList = lazy(() => import('./pages/work-orders/WorkOrderList'));
const PurchaseRequisitionList = lazy(() => import('./pages/purchaseRequisitions/PurchaseRequisitionList'));
const PurchaseRequisitionForm = lazy(() => import('./pages/purchaseRequisitions/PurchaseRequisitionForm'));
const PurchaseRequisitionDetail = lazy(() => import('./pages/purchaseRequisitions/PurchaseRequisitionDetail'));
const PurchaseEnquiryList = lazy(() => import('./pages/purchaseEnquiries/PurchaseEnquiryList'));
const PurchaseEnquiryForm = lazy(() => import('./pages/purchaseEnquiries/PurchaseEnquiryForm'));
const PurchaseEnquiryDetail = lazy(() => import('./pages/purchaseEnquiries/PurchaseEnquiryDetail'));
const PurchaseOrderList = lazy(() => import('./pages/purchaseOrders/PurchaseOrderList'));
const PurchaseOrderForm = lazy(() => import('./pages/purchaseOrders/PurchaseOrderForm'));
const PurchaseOrderDetail = lazy(() => import('./pages/purchaseOrders/PurchaseOrderDetail'));
const GoodsReceiptList = lazy(() => import('./pages/goodsReceipts/GoodsReceiptList'));
const GoodsReceiptForm = lazy(() => import('./pages/goodsReceipts/GoodsReceiptForm'));
const GoodsReceiptDetail = lazy(() => import('./pages/goodsReceipts/GoodsReceiptDetail'));
const SupplierList = lazy(() => import('./pages/suppliers/SupplierList'));
const SupplierForm = lazy(() => import('./pages/suppliers/SupplierForm'));
const SupplierDetail = lazy(() => import('./pages/suppliers/SupplierDetail'));
const StoreList = lazy(() => import('./pages/store/StoreList'));
const InventoryStockList = lazy(() => import('./pages/inventory/InventoryStockList'));
const StockTransactionsList = lazy(() => import('./pages/inventory/StockTransactionsList'));
const QualityInspectionList = lazy(() => import('./pages/quality/QualityInspectionList'));
const DeliveryChallanList = lazy(() => import('./pages/dispatch/DeliveryChallanList'));
const InvoiceList = lazy(() => import('./pages/accounts/InvoiceList'));
const PaymentList = lazy(() => import('./pages/accounts/PaymentList'));
const DocumentCenter = lazy(() => import('./pages/docs/DocumentCenter'));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals'));

function App() {
  return (
    <ErrorBoundary title="NETFIL ERP System Error">
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader message="Loading NETFIL ERP..." />}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route
                    path="/dashboard"
                    element={
                      <ErrorBoundary level="module" title="Dashboard Error">
                        <Dashboard />
                      </ErrorBoundary>
                    }
                  />

                  {/* Protected Employee Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="EMPLOYEE_VIEW" />}>
                    <Route
                      path="/employees"
                      element={
                        <ErrorBoundary level="module" title="Employee Module Error">
                          <EmployeeList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected User Accounts Route */}
                  <Route element={<ProtectedRoute requiredPermission="USER_VIEW" />}>
                    <Route
                      path="/users"
                      element={
                        <ErrorBoundary level="module" title="User Management Error">
                          <UserList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Role Management Route */}
                  <Route element={<ProtectedRoute requiredPermission="ROLE_VIEW" />}>
                    <Route
                      path="/roles"
                      element={
                        <ErrorBoundary level="module" title="Role Management Error">
                          <RoleList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Admin Approvals Route */}
                  <Route element={<ProtectedRoute adminOnly={true} />}>
                    <Route
                      path="/admin/approvals"
                      element={
                        <ErrorBoundary level="module" title="Admin Approvals Error">
                          <AdminApprovals />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Department Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="DEPARTMENT_VIEW" />}>
                    <Route
                      path="/departments"
                      element={
                        <ErrorBoundary level="module" title="Department Module Error">
                          <DepartmentList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Party Master Route */}
                  <Route element={<ProtectedRoute requiredPermission={["PARTY_VIEW", "CLIENT_VIEW"]} />}>
                    <Route
                      path="/clients"
                      element={
                        <ErrorBoundary level="module" title="Client Management Error">
                          <ClientList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/parties"
                      element={
                        <ErrorBoundary level="module" title="Party Management Error">
                          <ClientList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Requirement / Enquiry & Enquiry MIS Route */}
                  <Route element={<ProtectedRoute requiredPermission="REQUIREMENT_VIEW" />}>
                    <Route
                      path="/requirements"
                      element={
                        <ErrorBoundary level="module" title="Enquiry Management Error">
                          <RequirementList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/enquiries"
                      element={
                        <ErrorBoundary level="module" title="Enquiry Management Error">
                          <RequirementList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/enquiry-mis"
                      element={
                        <ErrorBoundary level="module" title="Enquiry MIS Error">
                          <EnquiryMis />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Quotation Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="QUOTATION_VIEW" />}>
                    <Route
                      path="/quotations"
                      element={
                        <ErrorBoundary level="module" title="Quotation Management Error">
                          <QuotationList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Sales Order Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="SALES_ORDER_VIEW" />}>
                    <Route
                      path="/sales-orders"
                      element={
                        <ErrorBoundary level="module" title="Sales Order Management Error">
                          <SalesOrderList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Master BOM Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="BOM_VIEW" />}>
                    <Route
                      path="/master-boms"
                      element={
                        <ErrorBoundary level="module" title="Master BOM Error">
                          <MasterBOMList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Order BOM Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="ORDER_BOM_VIEW" />}>
                    <Route
                      path="/order-boms"
                      element={
                        <ErrorBoundary level="module" title="Order BOM Error">
                          <OrderBOMList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Work Order Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="WORK_ORDER_VIEW" />}>
                    <Route
                      path="/work-orders"
                      element={
                        <ErrorBoundary level="module" title="Work Order Error">
                          <WorkOrderList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Supplier Management Module Routes */}
                  <Route element={<ProtectedRoute requiredPermission="SUPPLIER_VIEW" />}>
                    <Route
                      path="/suppliers"
                      element={
                        <ErrorBoundary level="module" title="Supplier Module Error">
                          <SupplierList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/suppliers/:id"
                      element={
                        <ErrorBoundary level="module" title="Supplier Detail Error">
                          <SupplierDetail />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="SUPPLIER_CREATE" />}>
                    <Route
                      path="/suppliers/create"
                      element={
                        <ErrorBoundary level="module" title="Supplier Create Error">
                          <SupplierForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="SUPPLIER_EDIT" />}>
                    <Route
                      path="/suppliers/:id/edit"
                      element={
                        <ErrorBoundary level="module" title="Supplier Edit Error">
                          <SupplierForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Purchase Requisition Module Routes */}
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_REQUISITION_VIEW" />}>
                    <Route
                      path="/purchase-requisitions"
                      element={
                        <ErrorBoundary level="module" title="Purchase Requisition Error">
                          <PurchaseRequisitionList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/purchase-requisitions/:id"
                      element={
                        <ErrorBoundary level="module" title="Purchase Requisition Detail Error">
                          <PurchaseRequisitionDetail />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_REQUISITION_CREATE" />}>
                    <Route
                      path="/purchase-requisitions/create"
                      element={
                        <ErrorBoundary level="module" title="Purchase Requisition Create Error">
                          <PurchaseRequisitionForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_REQUISITION_EDIT" />}>
                    <Route
                      path="/purchase-requisitions/:id/edit"
                      element={
                        <ErrorBoundary level="module" title="Purchase Requisition Edit Error">
                          <PurchaseRequisitionForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Purchase Enquiry Module Routes */}
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_ENQUIRY_VIEW" />}>
                    <Route
                      path="/purchase-enquiries"
                      element={
                        <ErrorBoundary level="module" title="Purchase Enquiry Error">
                          <PurchaseEnquiryList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/purchase-enquiries/:id"
                      element={
                        <ErrorBoundary level="module" title="Purchase Enquiry Detail Error">
                          <PurchaseEnquiryDetail />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_ENQUIRY_CREATE" />}>
                    <Route
                      path="/purchase-enquiries/create"
                      element={
                        <ErrorBoundary level="module" title="Purchase Enquiry Create Error">
                          <PurchaseEnquiryForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_ENQUIRY_EDIT" />}>
                    <Route
                      path="/purchase-enquiries/:id/edit"
                      element={
                        <ErrorBoundary level="module" title="Purchase Enquiry Edit Error">
                          <PurchaseEnquiryForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Purchase Order Module Routes */}
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_ORDER_VIEW" />}>
                    <Route
                      path="/purchase-orders"
                      element={
                        <ErrorBoundary level="module" title="Purchase Order Error">
                          <PurchaseOrderList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/purchase-orders/:id"
                      element={
                        <ErrorBoundary level="module" title="Purchase Order Detail Error">
                          <PurchaseOrderDetail />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_ORDER_CREATE" />}>
                    <Route
                      path="/purchase-orders/create"
                      element={
                        <ErrorBoundary level="module" title="Purchase Order Create Error">
                          <PurchaseOrderForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="PURCHASE_ORDER_EDIT" />}>
                    <Route
                      path="/purchase-orders/:id/edit"
                      element={
                        <ErrorBoundary level="module" title="Purchase Order Edit Error">
                          <PurchaseOrderForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Goods Receipt Note (GRN) Module Routes */}
                  <Route element={<ProtectedRoute requiredPermission="GOODS_RECEIPT_VIEW" />}>
                    <Route
                      path="/goods-receipts"
                      element={
                        <ErrorBoundary level="module" title="Goods Receipt Error">
                          <GoodsReceiptList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/goods-receipts/:id"
                      element={
                        <ErrorBoundary level="module" title="Goods Receipt Detail Error">
                          <GoodsReceiptDetail />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="GOODS_RECEIPT_CREATE" />}>
                    <Route
                      path="/goods-receipts/create"
                      element={
                        <ErrorBoundary level="module" title="Goods Receipt Create Error">
                          <GoodsReceiptForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredPermission="GOODS_RECEIPT_EDIT" />}>
                    <Route
                      path="/goods-receipts/:id/edit"
                      element={
                        <ErrorBoundary level="module" title="Goods Receipt Edit Error">
                          <GoodsReceiptForm />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Quality Inspection Module Route */}
                  <Route element={<ProtectedRoute requiredPermission={["QUALITY_INSPECTION_VIEW", "GOODS_RECEIPT_VIEW"]} />}>
                    <Route
                      path="/quality-inspections"
                      element={
                        <ErrorBoundary level="module" title="Quality Inspection Error">
                          <QualityInspectionList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Store Management Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="STORE_VIEW" />}>
                    <Route
                      path="/stores"
                      element={
                        <ErrorBoundary level="module" title="Store Management Error">
                          <StoreList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Inventory Stock & Movement Routes */}
                  <Route element={<ProtectedRoute requiredPermission={["INVENTORY_STOCK_VIEW", "STORE_VIEW"]} />}>
                    <Route
                      path="/inventory"
                      element={
                        <ErrorBoundary level="module" title="Inventory Stock Error">
                          <InventoryStockList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/inventory/transactions"
                      element={
                        <ErrorBoundary level="module" title="Stock Transactions Error">
                          <StockTransactionsList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected UOM Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="UOM_VIEW" />}>
                    <Route
                      path="/uoms"
                      element={
                        <ErrorBoundary level="module" title="UOM Master Error">
                          <UOMList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Item Groups Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="ITEM_GROUP_VIEW" />}>
                    <Route
                      path="/item-groups"
                      element={
                        <ErrorBoundary level="module" title="Item Groups Error">
                          <ItemGroupList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Item Categories Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="ITEM_CATEGORY_VIEW" />}>
                    <Route
                      path="/item-categories"
                      element={
                        <ErrorBoundary level="module" title="Item Categories Error">
                          <ItemCategoryList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Specifications Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="SPECIFICATION_VIEW" />}>
                    <Route
                      path="/specifications"
                      element={
                        <ErrorBoundary level="module" title="Specifications Error">
                          <SpecificationList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Filter Grades & Drawing Master Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="FILTER_GRADE_VIEW" />}>
                    <Route
                      path="/filter-grades"
                      element={
                        <ErrorBoundary level="module" title="Filter Grade Master Error">
                          <FilterGradeList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/face-velocity-master"
                      element={
                        <ErrorBoundary level="module" title="Face Velocity Master Error">
                          <FaceVelocityMasterList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/face-velocities"
                      element={
                        <ErrorBoundary level="module" title="Face Velocity Master Error">
                          <FaceVelocityMasterList />
                        </ErrorBoundary>
                      }
                    />
                    <Route path="/flange-designs" element={<Navigate to="/drawing-master" replace />} />
                    <Route
                      path="/drawing-master"
                      element={
                        <ErrorBoundary level="module" title="Drawing Master Error">
                          <DrawingMasterList />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/drawings"
                      element={
                        <ErrorBoundary level="module" title="Drawing Master Error">
                          <DrawingMasterList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Items Module Route */}
                  <Route element={<ProtectedRoute requiredPermission="ITEM_VIEW" />}>
                    <Route
                      path="/items"
                      element={
                        <ErrorBoundary level="module" title="Item Master Error">
                          <ItemList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Terms Master Route */}
                  <Route element={<ProtectedRoute requiredPermission={["TERM_VIEW", "TERMS_VIEW", "QUOTATION_VIEW"]} />}>
                    <Route
                      path="/terms"
                      element={
                        <ErrorBoundary level="module" title="Terms Master Error">
                          <TermsMasterList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Dispatch & Delivery Challans Route */}
                  <Route element={<ProtectedRoute requiredPermission={["DELIVERY_CHALLAN_VIEW", "SALES_ORDER_VIEW", "WORK_ORDER_VIEW"]} />}>
                    <Route
                      path="/delivery-challans"
                      element={
                        <ErrorBoundary level="module" title="Delivery Challan Error">
                          <DeliveryChallanList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Invoicing & Accounts Routes */}
                  <Route element={<ProtectedRoute requiredPermission={["INVOICE_VIEW", "SALES_ORDER_VIEW", "PURCHASE_ORDER_VIEW"]} />}>
                    <Route
                      path="/invoices"
                      element={
                        <ErrorBoundary level="module" title="Invoices Error">
                          <InvoiceList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  <Route element={<ProtectedRoute requiredPermission={["PAYMENT_VIEW", "INVOICE_VIEW", "SALES_ORDER_VIEW"]} />}>
                    <Route
                      path="/payments"
                      element={
                        <ErrorBoundary level="module" title="Payments Error">
                          <PaymentList />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Protected Centralized Document Center Route */}
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/documents"
                      element={
                        <ErrorBoundary level="module" title="Document Center Error">
                          <DocumentCenter />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/document-center"
                      element={
                        <ErrorBoundary level="module" title="Document Center Error">
                          <DocumentCenter />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Default Redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
