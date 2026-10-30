import { apiSlice } from '../api/apiSlice';

/**
 * Client Requirements / Enquiries RTK Query API Slice.
 * Preserves server-side pagination, search, and filtering parameters.
 * Provides caching and invalidation across Commercial, Quotation, and MIS modules.
 */
export const requirementsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRequirements: builder.query({
      query: (params = {}) => ({
        url: '/requirements',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.requirements
          ? [
              ...result.requirements.map(({ _id }) => ({ type: 'Requirements', id: _id })),
              { type: 'Requirements', id: 'LIST' },
            ]
          : [{ type: 'Requirements', id: 'LIST' }],
    }),
    getRequirementById: builder.query({
      query: (id) => ({
        url: `/requirements/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Requirements', id }],
    }),
    createRequirement: builder.mutation({
      query: (data) => ({
        url: '/requirements',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'Requirements', id: 'LIST' }],
    }),
    updateRequirement: builder.mutation({
      query: ({ id, data, ...rest }) => ({
        url: `/requirements/${id}`,
        method: 'put',
        data: data !== undefined ? data : rest,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Requirements', id },
        { type: 'Requirements', id: 'LIST' },
      ],
    }),
    updateRequirementStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/requirements/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Requirements', id },
        { type: 'Requirements', id: 'LIST' },
      ],
    }),
    getUnifiedMis: builder.query({
      query: (params = {}) => ({
        url: '/requirements/mis',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Requirements', id: 'MIS' }],
    }),
    getCustomerMis: builder.query({
      query: (params = {}) => ({
        url: '/requirements/mis/customer',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Requirements', id: 'MIS_CUSTOMER' }],
    }),
    getItemMis: builder.query({
      query: (params = {}) => ({
        url: '/requirements/mis/item',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Requirements', id: 'MIS_ITEM' }],
    }),
    getItemCategoryMis: builder.query({
      query: (params = {}) => ({
        url: '/requirements/mis/item-category',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Requirements', id: 'MIS_CATEGORY' }],
    }),
    getStatusMis: builder.query({
      query: (params = {}) => ({
        url: '/requirements/mis/status',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Requirements', id: 'MIS_STATUS' }],
    }),
    getSalesPersonMis: builder.query({
      query: (params = {}) => ({
        url: '/requirements/mis/sales-person',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Requirements', id: 'MIS_SALESPERSON' }],
    }),
    getFollowUpMis: builder.query({
      query: (params = {}) => ({
        url: '/requirements/mis/follow-up',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Requirements', id: 'MIS_FOLLOWUP' }],
    }),
  }),
});

export const {
  useGetRequirementsQuery,
  useGetRequirementByIdQuery,
  useCreateRequirementMutation,
  useUpdateRequirementMutation,
  useUpdateRequirementStatusMutation,
  useGetUnifiedMisQuery,
  useLazyGetUnifiedMisQuery,
  useGetCustomerMisQuery,
  useLazyGetCustomerMisQuery,
  useGetItemMisQuery,
  useLazyGetItemMisQuery,
  useGetItemCategoryMisQuery,
  useLazyGetItemCategoryMisQuery,
  useGetStatusMisQuery,
  useLazyGetStatusMisQuery,
  useGetSalesPersonMisQuery,
  useLazyGetSalesPersonMisQuery,
  useGetFollowUpMisQuery,
  useLazyGetFollowUpMisQuery,
} = requirementsApi;
