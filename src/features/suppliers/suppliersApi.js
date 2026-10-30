import { apiSlice } from '../api/apiSlice';

/**
 * Suppliers & Vendor Management RTK Query API Slice.
 * Handles vendor directory, approvals, price history, and purchase summaries.
 */
export const suppliersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query({
      query: (params = {}) => ({
        url: '/suppliers',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.suppliers
          ? [
              ...result.suppliers.map(({ _id }) => ({ type: 'Suppliers', id: _id })),
              { type: 'Suppliers', id: 'LIST' },
            ]
          : [{ type: 'Suppliers', id: 'LIST' }],
    }),
    getSupplierById: builder.query({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Suppliers', id }],
    }),
    createSupplier: builder.mutation({
      query: (supplierData) => ({
        url: '/suppliers',
        method: 'post',
        data: supplierData,
      }),
      invalidatesTags: [{ type: 'Suppliers', id: 'LIST' }],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...supplierData }) => ({
        url: `/suppliers/${id}`,
        method: 'put',
        data: supplierData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Suppliers', id },
        { type: 'Suppliers', id: 'LIST' },
      ],
    }),
    updateSupplierStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/suppliers/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Suppliers', id },
        { type: 'Suppliers', id: 'LIST' },
      ],
    }),
    approveOrRejectSupplier: builder.mutation({
      query: ({ id, action, rejectionReason }) => ({
        url: `/suppliers/${id}/approval`,
        method: 'patch',
        data: { action, rejectionReason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Suppliers', id },
        { type: 'Suppliers', id: 'LIST' },
      ],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Suppliers', id },
        { type: 'Suppliers', id: 'LIST' },
      ],
    }),
    getSupplierPurchaseHistory: builder.query({
      query: ({ id, params }) => ({
        url: `/suppliers/${id}/purchase-history`,
        method: 'get',
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'Suppliers', id: `PURCHASE_HISTORY_${id}` }],
    }),
    getSupplierItemPriceHistory: builder.query({
      query: ({ id, params }) => ({
        url: `/suppliers/${id}/item-price-history`,
        method: 'get',
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'Suppliers', id: `PRICE_HISTORY_${id}` }],
    }),
    getSupplierPurchaseSummary: builder.query({
      query: (id) => ({
        url: `/suppliers/${id}/purchase-summary`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Suppliers', id: `SUMMARY_${id}` }],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useUpdateSupplierStatusMutation,
  useApproveOrRejectSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierPurchaseHistoryQuery,
  useGetSupplierItemPriceHistoryQuery,
  useGetSupplierPurchaseSummaryQuery,
} = suppliersApi;
