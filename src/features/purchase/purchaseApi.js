import { apiSlice } from '../api/apiSlice';

/**
 * Purchase & Procurement RTK Query API Slice.
 * Unifies Purchase Requisitions, Purchase Enquiries, Purchase Orders, and Goods Receipts (GRN).
 */
export const purchaseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- Purchase Requisitions ---
    getPurchaseRequisitions: builder.query({
      query: (params = {}) => ({
        url: '/purchase-requisitions',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.requisitions || result?.purchaseRequisitions
          ? [
              ...(result.requisitions || result.purchaseRequisitions).map(({ _id }) => ({
                type: 'PurchaseRequisitions',
                id: _id,
              })),
              { type: 'PurchaseRequisitions', id: 'LIST' },
            ]
          : [{ type: 'PurchaseRequisitions', id: 'LIST' }],
    }),
    getPurchaseRequisitionById: builder.query({
      query: (id) => ({
        url: `/purchase-requisitions/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'PurchaseRequisitions', id }],
    }),
    createPurchaseRequisition: builder.mutation({
      query: (data) => ({
        url: '/purchase-requisitions',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'PurchaseRequisitions', id: 'LIST' }],
    }),
    updatePurchaseRequisition: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-requisitions/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseRequisitions', id },
        { type: 'PurchaseRequisitions', id: 'LIST' },
      ],
    }),
    updatePurchaseRequisitionStatus: builder.mutation({
      query: ({ id, action, remarks = '' }) => ({
        url: `/purchase-requisitions/${id}/status`,
        method: 'patch',
        data: { action, remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseRequisitions', id },
        { type: 'PurchaseRequisitions', id: 'LIST' },
      ],
    }),
    deletePurchaseRequisition: builder.mutation({
      query: (id) => ({
        url: `/purchase-requisitions/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'PurchaseRequisitions', id },
        { type: 'PurchaseRequisitions', id: 'LIST' },
      ],
    }),

    // --- Purchase Enquiries ---
    getPurchaseEnquiries: builder.query({
      query: (params = {}) => ({
        url: '/purchase-enquiries',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.enquiries || result?.purchaseEnquiries
          ? [
              ...(result.enquiries || result.purchaseEnquiries).map(({ _id }) => ({
                type: 'PurchaseEnquiries',
                id: _id,
              })),
              { type: 'PurchaseEnquiries', id: 'LIST' },
            ]
          : [{ type: 'PurchaseEnquiries', id: 'LIST' }],
    }),
    getPurchaseEnquiryById: builder.query({
      query: (id) => ({
        url: `/purchase-enquiries/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'PurchaseEnquiries', id }],
    }),
    createPurchaseEnquiry: builder.mutation({
      query: (data) => ({
        url: '/purchase-enquiries',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'PurchaseEnquiries', id: 'LIST' }],
    }),
    updatePurchaseEnquiry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-enquiries/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseEnquiries', id },
        { type: 'PurchaseEnquiries', id: 'LIST' },
      ],
    }),
    updatePurchaseEnquiryStatus: builder.mutation({
      query: ({ id, action, remarks = '' }) => ({
        url: `/purchase-enquiries/${id}/status`,
        method: 'patch',
        data: { action, remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseEnquiries', id },
        { type: 'PurchaseEnquiries', id: 'LIST' },
      ],
    }),
    deletePurchaseEnquiry: builder.mutation({
      query: (id) => ({
        url: `/purchase-enquiries/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'PurchaseEnquiries', id },
        { type: 'PurchaseEnquiries', id: 'LIST' },
      ],
    }),

    // --- Purchase Orders ---
    getPurchaseOrders: builder.query({
      query: (params = {}) => ({
        url: '/purchase-orders',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.purchaseOrders
          ? [
              ...result.purchaseOrders.map(({ _id }) => ({ type: 'PurchaseOrders', id: _id })),
              { type: 'PurchaseOrders', id: 'LIST' },
            ]
          : [{ type: 'PurchaseOrders', id: 'LIST' }],
    }),
    getPurchaseOrderById: builder.query({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'PurchaseOrders', id }],
    }),
    createPurchaseOrder: builder.mutation({
      query: (data) => ({
        url: '/purchase-orders',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'PurchaseOrders', id: 'LIST' }],
    }),
    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-orders/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseOrders', id },
        { type: 'PurchaseOrders', id: 'LIST' },
      ],
    }),
    updatePurchaseOrderStatus: builder.mutation({
      query: ({ id, action, remarks = '' }) => ({
        url: `/purchase-orders/${id}/status`,
        method: 'patch',
        data: { action, remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseOrders', id },
        { type: 'PurchaseOrders', id: 'LIST' },
      ],
    }),
    deletePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'PurchaseOrders', id },
        { type: 'PurchaseOrders', id: 'LIST' },
      ],
    }),
    createPurchaseOrderAmendment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}/amendments`,
        method: 'post',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseOrders', id },
        { type: 'PurchaseOrders', id: 'LIST' },
      ],
    }),
    getPurchaseOrderAmendments: builder.query({
      query: (id) => ({
        url: `/purchase-orders/${id}/amendments`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'PurchaseOrders', id: `AMENDMENTS_${id}` }],
    }),

    // --- Goods Receipts (GRN) ---
    getGoodsReceipts: builder.query({
      query: (params = {}) => ({
        url: '/goods-receipts',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.goodsReceipts
          ? [
              ...result.goodsReceipts.map(({ _id }) => ({ type: 'GoodsReceipts', id: _id })),
              { type: 'GoodsReceipts', id: 'LIST' },
            ]
          : [{ type: 'GoodsReceipts', id: 'LIST' }],
    }),
    getGoodsReceiptById: builder.query({
      query: (id) => ({
        url: `/goods-receipts/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'GoodsReceipts', id }],
    }),
    createGoodsReceipt: builder.mutation({
      query: (data) => ({
        url: '/goods-receipts',
        method: 'post',
        data,
      }),
      invalidatesTags: [
        { type: 'GoodsReceipts', id: 'LIST' },
        { type: 'PurchaseOrders', id: 'LIST' },
      ],
    }),
    updateGoodsReceipt: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/goods-receipts/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'GoodsReceipts', id },
        { type: 'GoodsReceipts', id: 'LIST' },
      ],
    }),
    updateGoodsReceiptStatus: builder.mutation({
      query: ({ id, action, remarks = '' }) => ({
        url: `/goods-receipts/${id}/status`,
        method: 'patch',
        data: { action, remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'GoodsReceipts', id },
        { type: 'GoodsReceipts', id: 'LIST' },
      ],
    }),
    deleteGoodsReceipt: builder.mutation({
      query: (id) => ({
        url: `/goods-receipts/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'GoodsReceipts', id },
        { type: 'GoodsReceipts', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  // Requisitions
  useGetPurchaseRequisitionsQuery,
  useLazyGetPurchaseRequisitionsQuery,
  useGetPurchaseRequisitionByIdQuery,
  useLazyGetPurchaseRequisitionByIdQuery,
  useCreatePurchaseRequisitionMutation,
  useUpdatePurchaseRequisitionMutation,
  useUpdatePurchaseRequisitionStatusMutation,
  useDeletePurchaseRequisitionMutation,
  // Enquiries
  useGetPurchaseEnquiriesQuery,
  useLazyGetPurchaseEnquiriesQuery,
  useGetPurchaseEnquiryByIdQuery,
  useLazyGetPurchaseEnquiryByIdQuery,
  useCreatePurchaseEnquiryMutation,
  useUpdatePurchaseEnquiryMutation,
  useUpdatePurchaseEnquiryStatusMutation,
  useDeletePurchaseEnquiryMutation,
  // Orders
  useGetPurchaseOrdersQuery,
  useLazyGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useLazyGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useDeletePurchaseOrderMutation,
  useCreatePurchaseOrderAmendmentMutation,
  useGetPurchaseOrderAmendmentsQuery,
  // Goods Receipts
  useGetGoodsReceiptsQuery,
  useLazyGetGoodsReceiptsQuery,
  useGetGoodsReceiptByIdQuery,
  useLazyGetGoodsReceiptByIdQuery,
  useCreateGoodsReceiptMutation,
  useUpdateGoodsReceiptMutation,
  useUpdateGoodsReceiptStatusMutation,
  useDeleteGoodsReceiptMutation,
} = purchaseApi;
