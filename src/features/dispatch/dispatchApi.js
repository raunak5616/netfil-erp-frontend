import { apiSlice } from '../api/apiSlice';

export const dispatchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDeliveryChallans: builder.query({
      query: (params) => ({
        url: '/delivery-challans',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'DeliveryChallans', id: _id })),
              { type: 'DeliveryChallans', id: 'LIST' },
            ]
          : [{ type: 'DeliveryChallans', id: 'LIST' }],
    }),

    getDeliveryChallanById: builder.query({
      query: (id) => ({
        url: `/delivery-challans/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'DeliveryChallans', id }],
    }),

    createDeliveryChallan: builder.mutation({
      query: (body) => ({
        url: '/delivery-challans',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'DeliveryChallans', id: 'LIST' }, 'SalesOrders', 'WorkOrders'],
    }),

    updateDeliveryChallan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryChallans', id },
        { type: 'DeliveryChallans', id: 'LIST' },
      ],
    }),

    dispatchDeliveryChallan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}/dispatch`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryChallans', id },
        { type: 'DeliveryChallans', id: 'LIST' },
        'Inventory',
        'SalesOrders',
      ],
    }),

    deliverDeliveryChallan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}/deliver`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryChallans', id },
        { type: 'DeliveryChallans', id: 'LIST' },
      ],
    }),

    cancelDeliveryChallan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}/cancel`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryChallans', id },
        { type: 'DeliveryChallans', id: 'LIST' },
        'Inventory',
      ],
    }),
  }),
});

export const {
  useGetDeliveryChallansQuery,
  useGetDeliveryChallanByIdQuery,
  useCreateDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,
  useDispatchDeliveryChallanMutation,
  useDeliverDeliveryChallanMutation,
  useCancelDeliveryChallanMutation,
} = dispatchApi;
