import { apiSlice } from '../api/apiSlice';

/**
 * Sales Orders RTK Query API Slice.
 * Preserves server-side pagination, sorting, status filters, delivery alerts summary,
 * attachments, and drawings configuration.
 */
export const salesOrdersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesOrders: builder.query({
      query: (params = {}) => ({
        url: '/sales-orders',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.salesOrders
          ? [
              ...result.salesOrders.map(({ _id }) => ({ type: 'SalesOrders', id: _id })),
              { type: 'SalesOrders', id: 'LIST' },
            ]
          : [{ type: 'SalesOrders', id: 'LIST' }],
    }),
    getSalesOrderById: builder.query({
      query: (id) => ({
        url: `/sales-orders/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'SalesOrders', id }],
    }),
    getSalesOrderDeliveryAlertsSummary: builder.query({
      query: (params = {}) => ({
        url: '/sales-orders/alerts/summary',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'SalesOrders', id: 'ALERTS_SUMMARY' }],
    }),
    dismissSalesOrderDeliveryAlert: builder.mutation({
      query: (salesOrderId) => ({
        url: `/sales-orders/alerts/${salesOrderId}/dismiss`,
        method: 'put',
      }),
      invalidatesTags: [{ type: 'SalesOrders', id: 'ALERTS_SUMMARY' }],
    }),
    createSalesOrder: builder.mutation({
      query: (data) => ({
        url: '/sales-orders',
        method: 'post',
        data,
      }),
      invalidatesTags: [
        { type: 'SalesOrders', id: 'LIST' },
        { type: 'SalesOrders', id: 'ALERTS_SUMMARY' },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
    compareQuotationChanges: builder.mutation({
      query: (data) => ({
        url: '/sales-orders/compare-quotation',
        method: 'post',
        data,
      }),
    }),
    updateSalesOrder: builder.mutation({
      query: ({ id, data }) => ({
        url: `/sales-orders/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrders', id },
        { type: 'SalesOrders', id: 'LIST' },
        { type: 'SalesOrders', id: 'ALERTS_SUMMARY' },
      ],
    }),
    updateSalesOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/sales-orders/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrders', id },
        { type: 'SalesOrders', id: 'LIST' },
        { type: 'SalesOrders', id: 'ALERTS_SUMMARY' },
      ],
    }),
    getSalesOrderReferences: builder.query({
      query: (id) => ({
        url: `/sales-orders/${id}/references`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'SalesOrders', id: `REF_${id}` }],
    }),
    getSalesOrderItems: builder.query({
      query: (id) => ({
        url: `/sales-orders/${id}/items`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'SalesOrders', id: `ITEMS_${id}` }],
    }),
    addSalesOrderItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `/sales-orders/${id}/items`,
        method: 'post',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrders', id },
        { type: 'SalesOrders', id: `ITEMS_${id}` },
        { type: 'SalesOrders', id: 'LIST' },
      ],
    }),
    updateSalesOrderItem: builder.mutation({
      query: ({ id, itemId, data }) => ({
        url: `/sales-orders/${id}/items/${itemId}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrders', id },
        { type: 'SalesOrders', id: `ITEMS_${id}` },
        { type: 'SalesOrders', id: 'LIST' },
      ],
    }),
    deleteSalesOrderItem: builder.mutation({
      query: ({ id, itemId }) => ({
        url: `/sales-orders/${id}/items/${itemId}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrders', id },
        { type: 'SalesOrders', id: `ITEMS_${id}` },
        { type: 'SalesOrders', id: 'LIST' },
      ],
    }),
    getSalesOrderDrawingsConfig: builder.query({
      query: (id) => ({
        url: `/sales-orders/${id}/drawings/config`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'SalesOrders', id: `DRAWING_CONFIG_${id}` }],
    }),
    updateSalesOrderItemDrawingConfig: builder.mutation({
      query: ({ id, itemId, data }) => ({
        url: `/sales-orders/${id}/items/${itemId}/drawing-config`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrders', id: `DRAWING_CONFIG_${id}` },
        { type: 'SalesOrders', id },
      ],
    }),
    getSalesOrderAttachments: builder.query({
      query: ({ id, params = {} }) => ({
        url: `/sales-orders/${id}/attachments`,
        method: 'get',
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'SalesOrders', id: `ATTACHMENTS_${id}` }],
    }),
    uploadSalesOrderAttachment: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/sales-orders/${id}/attachments`,
        method: 'post',
        data: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'SalesOrders', id: `ATTACHMENTS_${id}` }],
    }),
    replaceSalesOrderAttachment: builder.mutation({
      query: ({ id, attachmentId, formData }) => ({
        url: `/sales-orders/${id}/attachments/${attachmentId}/replace`,
        method: 'post',
        data: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'SalesOrders', id: `ATTACHMENTS_${id}` }],
    }),
    deleteSalesOrderAttachment: builder.mutation({
      query: ({ id, attachmentId }) => ({
        url: `/sales-orders/${id}/attachments/${attachmentId}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'SalesOrders', id: `ATTACHMENTS_${id}` }],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useGetSalesOrderDeliveryAlertsSummaryQuery,
  useDismissSalesOrderDeliveryAlertMutation,
  useCreateSalesOrderMutation,
  useCompareQuotationChangesMutation,
  useUpdateSalesOrderMutation,
  useUpdateSalesOrderStatusMutation,
  useGetSalesOrderReferencesQuery,
  useGetSalesOrderItemsQuery,
  useAddSalesOrderItemMutation,
  useUpdateSalesOrderItemMutation,
  useDeleteSalesOrderItemMutation,
  useGetSalesOrderDrawingsConfigQuery,
  useUpdateSalesOrderItemDrawingConfigMutation,
  useGetSalesOrderAttachmentsQuery,
  useUploadSalesOrderAttachmentMutation,
  useReplaceSalesOrderAttachmentMutation,
  useDeleteSalesOrderAttachmentMutation,
} = salesOrdersApi;
