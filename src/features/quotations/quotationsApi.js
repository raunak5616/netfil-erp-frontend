import { apiSlice } from '../api/apiSlice';

/**
 * Quotation Register & Reminders RTK Query API Slice.
 * Preserves server-side pagination, filters, sorting, and reminders summary caching.
 */
export const quotationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query({
      query: (params = {}) => ({
        url: '/quotations',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.quotations
          ? [
              ...result.quotations.map(({ _id }) => ({ type: 'Quotations', id: _id })),
              { type: 'Quotations', id: 'LIST' },
            ]
          : [{ type: 'Quotations', id: 'LIST' }],
    }),
    getQuotationById: builder.query({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Quotations', id }],
    }),
    getQuotationSuggestions: builder.query({
      query: ({ customerId, itemId }) => ({
        url: '/quotations/suggestions',
        method: 'get',
        params: { customerId, itemId },
      }),
      providesTags: (result, error, { customerId, itemId }) => [
        { type: 'Quotations', id: `SUGGESTION_${customerId}_${itemId}` },
      ],
    }),
    getQuotationRemindersSummary: builder.query({
      query: () => ({
        url: '/quotations/reminders/summary',
        method: 'get',
      }),
      providesTags: [{ type: 'Quotations', id: 'REMINDERS_SUMMARY' }],
    }),
    createQuotation: builder.mutation({
      query: (quotationData) => ({
        url: '/quotations',
        method: 'post',
        data: quotationData,
      }),
      invalidatesTags: [
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: 'REMINDERS_SUMMARY' },
      ],
    }),
    updateQuotation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quotations/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: 'REMINDERS_SUMMARY' },
      ],
    }),
    updateQuotationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/quotations/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: 'REMINDERS_SUMMARY' },
      ],
    }),
    releaseQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/release`,
        method: 'patch',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: 'REMINDERS_SUMMARY' },
      ],
    }),
    markQuotationLost: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quotations/${id}/mark-lost`,
        method: 'post',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: 'REMINDERS_SUMMARY' },
      ],
    }),
    addQuotationFollowUp: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quotations/${id}/follow-up`,
        method: 'post',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: 'REMINDERS_SUMMARY' },
      ],
    }),
    dismissQuotationReminder: builder.mutation({
      query: (reminderId) => ({
        url: `/quotations/reminders/${reminderId}/dismiss`,
        method: 'patch',
      }),
      invalidatesTags: [{ type: 'Quotations', id: 'REMINDERS_SUMMARY' }],
    }),
    syncQuotationReminders: builder.mutation({
      query: () => ({
        url: '/quotations/reminders/sync',
        method: 'post',
      }),
      invalidatesTags: [{ type: 'Quotations', id: 'REMINDERS_SUMMARY' }],
    }),
    getQuotationReferences: builder.query({
      query: (id) => ({
        url: `/quotations/${id}/references`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Quotations', id: `REF_${id}` }],
    }),
    getQuotationAmendments: builder.query({
      query: (id) => ({
        url: `/quotations/${id}/amendments`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Quotations', id: `AMEND_${id}` }],
    }),
    createQuotationAmendment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quotations/${id}/amendments`,
        method: 'post',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: `AMEND_${id}` },
        { type: 'Quotations', id: 'REMINDERS_SUMMARY' },
      ],
    }),
    addQuotationItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quotations/${id}/items`,
        method: 'post',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
    updateQuotationItem: builder.mutation({
      query: ({ id, itemId, data }) => ({
        url: `/quotations/${id}/items/${itemId}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
    deleteQuotationItem: builder.mutation({
      query: ({ id, itemId }) => ({
        url: `/quotations/${id}/items/${itemId}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useLazyGetQuotationsQuery,
  useGetQuotationByIdQuery,
  useLazyGetQuotationByIdQuery,
  useGetQuotationSuggestionsQuery,
  useGetQuotationRemindersSummaryQuery,
  useGetQuotationReferencesQuery,
  useGetQuotationAmendmentsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useUpdateQuotationStatusMutation,
  useReleaseQuotationMutation,
  useMarkQuotationLostMutation,
  useAddQuotationFollowUpMutation,
  useDismissQuotationReminderMutation,
  useSyncQuotationRemindersMutation,
  useCreateQuotationAmendmentMutation,
  useAddQuotationItemMutation,
  useUpdateQuotationItemMutation,
  useDeleteQuotationItemMutation,
} = quotationsApi;


