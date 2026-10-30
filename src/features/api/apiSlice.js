import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/baseQuery';

/**
 * Central root RTK Query API Slice.
 * Feature modules inject their endpoints to maintain modularity, avoid circular dependencies,
 * and provide unified cache management across the entire ERP.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'Auth',
    'Employees',
    'Departments',
    'Users',
    'Roles',
    'Products',
    'ItemGroups',
    'ItemCategories',
    'Specifications',
    'FilterGrades',
    'FlangeDesigns',
    'UOMs',
    'Drawings',
    'HoleImages',
    'Requirements',
    'Quotations',
    'SalesOrders',
    'MasterBOMs',
    'OrderBOMs',
    'WorkOrders',
    'Clients',
    'Terms',
    'Suppliers',
    'PurchaseRequisitions',
    'PurchaseEnquiries',
    'PurchaseOrders',
    'GoodsReceipts',
    'Stores',
    'Dashboard',
  ],
  endpoints: () => ({}),
});

export default apiSlice;
