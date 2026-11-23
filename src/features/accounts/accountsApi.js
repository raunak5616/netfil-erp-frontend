import { apiSlice } from '../api/apiSlice';

export const accountsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({
        url: '/invoices',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Invoices', id: _id })),
              { type: 'Invoices', id: 'LIST' },
            ]
          : [{ type: 'Invoices', id: 'LIST' }],
    }),

    getInvoiceById: builder.query({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Invoices', id }],
    }),

    createInvoice: builder.mutation({
      query: (body) => ({
        url: '/invoices',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Invoices', id: 'LIST' }, 'Payments'],
    }),

    updateInvoice: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/invoices/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Invoices', id },
        { type: 'Invoices', id: 'LIST' },
      ],
    }),

    postInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}/post`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Invoices', id },
        { type: 'Invoices', id: 'LIST' },
      ],
    }),

    cancelInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Invoices', id },
        { type: 'Invoices', id: 'LIST' },
      ],
    }),

    getPayments: builder.query({
      query: (params) => ({
        url: '/payments',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Payments', id: _id })),
              { type: 'Payments', id: 'LIST' },
            ]
          : [{ type: 'Payments', id: 'LIST' }],
    }),

    createPayment: builder.mutation({
      query: (body) => ({
        url: '/payments',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Payments', id: 'LIST' }, { type: 'Invoices', id: 'LIST' }],
    }),

    getOutstandingSummary: builder.query({
      query: () => ({
        url: '/payments/summary/outstanding',
        method: 'GET',
      }),
      providesTags: ['Invoices', 'Payments'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  usePostInvoiceMutation,
  useCancelInvoiceMutation,
  useGetPaymentsQuery,
  useCreatePaymentMutation,
  useGetOutstandingSummaryQuery,
} = accountsApi;
