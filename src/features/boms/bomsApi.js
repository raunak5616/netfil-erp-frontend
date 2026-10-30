import { apiSlice } from '../api/apiSlice';

/**
 * Bill of Materials (BOM) RTK Query API Slice.
 * Unifies Master BOMs, revisions, component items, and Order BOM routing & shop floor handoffs.
 */
export const bomsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- Master BOMs ---
    getMasterBOMs: builder.query({
      query: (params = {}) => ({
        url: '/boms',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.boms
          ? [
              ...result.boms.map(({ _id }) => ({ type: 'MasterBOMs', id: _id })),
              { type: 'MasterBOMs', id: 'LIST' },
            ]
          : [{ type: 'MasterBOMs', id: 'LIST' }],
    }),
    getMasterBOMById: builder.query({
      query: (id) => ({
        url: `/boms/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'MasterBOMs', id }],
    }),
    createMasterBOM: builder.mutation({
      query: (data) => ({
        url: '/boms',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'MasterBOMs', id: 'LIST' }],
    }),
    updateMasterBOM: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/boms/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MasterBOMs', id },
        { type: 'MasterBOMs', id: 'LIST' },
      ],
    }),
    releaseMasterBOM: builder.mutation({
      query: (id) => ({
        url: `/boms/${id}/release`,
        method: 'patch',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'MasterBOMs', id },
        { type: 'MasterBOMs', id: 'LIST' },
      ],
    }),
    copyMasterBOM: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/boms/${id}/copy`,
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'MasterBOMs', id: 'LIST' }],
    }),
    getMasterBOMRevisions: builder.query({
      query: (id) => ({
        url: `/boms/${id}/revisions`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'MasterBOMs', id: `REVISIONS_${id}` }],
    }),
    addMasterBOMItem: builder.mutation({
      query: ({ bomId, itemData }) => ({
        url: `/boms/${bomId}/items`,
        method: 'post',
        data: itemData,
      }),
      invalidatesTags: (result, error, { bomId }) => [{ type: 'MasterBOMs', id: bomId }],
    }),
    updateMasterBOMItem: builder.mutation({
      query: ({ bomId, itemId, itemData }) => ({
        url: `/boms/${bomId}/items/${itemId}`,
        method: 'put',
        data: itemData,
      }),
      invalidatesTags: (result, error, { bomId }) => [{ type: 'MasterBOMs', id: bomId }],
    }),
    deleteMasterBOMItem: builder.mutation({
      query: ({ bomId, itemId }) => ({
        url: `/boms/${bomId}/items/${itemId}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, { bomId }) => [{ type: 'MasterBOMs', id: bomId }],
    }),

    // --- Order BOMs ---
    getOrderBOMs: builder.query({
      query: (params = {}) => ({
        url: '/order-boms',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.orderBOMs
          ? [
              ...result.orderBOMs.map(({ _id }) => ({ type: 'OrderBOMs', id: _id })),
              { type: 'OrderBOMs', id: 'LIST' },
            ]
          : [{ type: 'OrderBOMs', id: 'LIST' }],
    }),
    getOrderBOMById: builder.query({
      query: (id) => ({
        url: `/order-boms/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'OrderBOMs', id }],
    }),
    createOrderBOM: builder.mutation({
      query: (data) => ({
        url: '/order-boms',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'OrderBOMs', id: 'LIST' }],
    }),
    sendToStore: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/order-boms/${id}/send-to-store`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'OrderBOMs', id },
        { type: 'OrderBOMs', id: 'LIST' },
      ],
    }),
    receiveByStore: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/order-boms/${id}/receive-by-store`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'OrderBOMs', id },
        { type: 'OrderBOMs', id: 'LIST' },
      ],
    }),
    sendToFactory: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/order-boms/${id}/send-to-factory`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'OrderBOMs', id },
        { type: 'OrderBOMs', id: 'LIST' },
      ],
    }),
    receiveByFactory: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/order-boms/${id}/receive-by-factory`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'OrderBOMs', id },
        { type: 'OrderBOMs', id: 'LIST' },
      ],
    }),
    cancelOrderBOM: builder.mutation({
      query: ({ id, data = {} }) => ({
        url: `/order-boms/${id}/cancel`,
        method: 'patch',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'OrderBOMs', id },
        { type: 'OrderBOMs', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  // Master BOM
  useGetMasterBOMsQuery,
  useGetMasterBOMByIdQuery,
  useCreateMasterBOMMutation,
  useUpdateMasterBOMMutation,
  useReleaseMasterBOMMutation,
  useCopyMasterBOMMutation,
  useGetMasterBOMRevisionsQuery,
  useAddMasterBOMItemMutation,
  useUpdateMasterBOMItemMutation,
  useDeleteMasterBOMItemMutation,
  // Order BOM
  useGetOrderBOMsQuery,
  useGetOrderBOMByIdQuery,
  useCreateOrderBOMMutation,
  useSendToStoreMutation,
  useReceiveByStoreMutation,
  useSendToFactoryMutation,
  useReceiveByFactoryMutation,
  useCancelOrderBOMMutation,
} = bomsApi;
