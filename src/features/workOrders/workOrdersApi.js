import { apiSlice } from '../api/apiSlice';

/**
 * Shop Floor Work Orders RTK Query API Slice.
 * Handles job cards, production execution, release, start, and completion.
 */
export const workOrdersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWorkOrders: builder.query({
      query: (params = {}) => ({
        url: '/work-orders',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.workOrders
          ? [
              ...result.workOrders.map(({ _id }) => ({ type: 'WorkOrders', id: _id })),
              { type: 'WorkOrders', id: 'LIST' },
            ]
          : [{ type: 'WorkOrders', id: 'LIST' }],
    }),
    getWorkOrderById: builder.query({
      query: (id) => ({
        url: `/work-orders/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'WorkOrders', id }],
    }),
    getWorkOrderSalesOrderPreview: builder.query({
      query: (salesOrderId) => ({
        url: `/work-orders/sales-order-preview/${salesOrderId}`,
        method: 'get',
      }),
      providesTags: (result, error, salesOrderId) => [{ type: 'WorkOrders', id: `PREVIEW_${salesOrderId}` }],
    }),
    createWorkOrder: builder.mutation({
      query: (data) => ({
        url: '/work-orders',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'WorkOrders', id: 'LIST' }],
    }),
    updateWorkOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/work-orders/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrders', id },
        { type: 'WorkOrders', id: 'LIST' },
      ],
    }),
    releaseWorkOrder: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/work-orders/${id}/release`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrders', id },
        { type: 'WorkOrders', id: 'LIST' },
      ],
    }),
    startWorkOrder: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/work-orders/${id}/start`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrders', id },
        { type: 'WorkOrders', id: 'LIST' },
      ],
    }),
    completeWorkOrder: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/work-orders/${id}/complete`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrders', id },
        { type: 'WorkOrders', id: 'LIST' },
      ],
    }),
    cancelWorkOrder: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/work-orders/${id}/cancel`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrders', id },
        { type: 'WorkOrders', id: 'LIST' },
      ],
    }),
    getWorkOrderAttachments: builder.query({
      query: ({ id, params = {} }) => ({
        url: `/work-orders/${id}/attachments`,
        method: 'get',
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'WorkOrders', id: `ATTACHMENTS_${id}` }],
    }),
    uploadWorkOrderAttachment: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/work-orders/${id}/attachments`,
        method: 'post',
        data: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WorkOrders', id: `ATTACHMENTS_${id}` }],
    }),
    replaceWorkOrderAttachment: builder.mutation({
      query: ({ id, attachmentId, formData }) => ({
        url: `/work-orders/${id}/attachments/${attachmentId}/replace`,
        method: 'post',
        data: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WorkOrders', id: `ATTACHMENTS_${id}` }],
    }),
    deleteWorkOrderAttachment: builder.mutation({
      query: ({ id, attachmentId }) => ({
        url: `/work-orders/${id}/attachments/${attachmentId}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WorkOrders', id: `ATTACHMENTS_${id}` }],
    }),
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useGetWorkOrderSalesOrderPreviewQuery,
  useCreateWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useReleaseWorkOrderMutation,
  useStartWorkOrderMutation,
  useCompleteWorkOrderMutation,
  useCancelWorkOrderMutation,
  useGetWorkOrderAttachmentsQuery,
  useUploadWorkOrderAttachmentMutation,
  useReplaceWorkOrderAttachmentMutation,
  useDeleteWorkOrderAttachmentMutation,
} = workOrdersApi;

