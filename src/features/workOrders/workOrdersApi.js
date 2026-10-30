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
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useCreateWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useReleaseWorkOrderMutation,
  useStartWorkOrderMutation,
  useCompleteWorkOrderMutation,
  useCancelWorkOrderMutation,
} = workOrdersApi;
