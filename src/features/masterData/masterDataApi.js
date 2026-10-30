import { apiSlice } from '../api/apiSlice';

/**
 * Shared Reference / Master Data RTK Query API Slice.
 * Handles deduplication, caching, and mutations for:
 * Clients, UOMs, Item Groups, Item Categories, Filter Grades, Flange Designs, Terms, Roles, and Specifications.
 */
export const masterDataApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- Clients / Parties ---
    getClients: builder.query({
      query: (params = {}) => ({
        url: '/clients',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.clients
          ? [
              ...result.clients.map(({ _id }) => ({ type: 'Clients', id: _id })),
              { type: 'Clients', id: 'LIST' },
            ]
          : [{ type: 'Clients', id: 'LIST' }],
    }),
    getClientById: builder.query({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Clients', id }],
    }),
    createClient: builder.mutation({
      query: (clientData) => ({
        url: '/clients',
        method: 'post',
        data: clientData,
      }),
      invalidatesTags: [{ type: 'Clients', id: 'LIST' }],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...clientData }) => ({
        url: `/clients/${id}`,
        method: 'put',
        data: clientData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Clients', id },
        { type: 'Clients', id: 'LIST' },
      ],
    }),
    updateClientStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/clients/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Clients', id },
        { type: 'Clients', id: 'LIST' },
      ],
    }),
    approveOrRejectClient: builder.mutation({
      query: ({ id, action, rejectionReason }) => ({
        url: `/clients/${id}/approval`,
        method: 'patch',
        data: { action, rejectionReason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Clients', id },
        { type: 'Clients', id: 'LIST' },
      ],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Clients', id },
        { type: 'Clients', id: 'LIST' },
      ],
    }),

    // --- UOMs ---
    getUOMs: builder.query({
      query: (params = {}) => ({
        url: '/uoms',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.uoms
          ? [
              ...result.uoms.map(({ _id }) => ({ type: 'UOMs', id: _id })),
              { type: 'UOMs', id: 'LIST' },
            ]
          : [{ type: 'UOMs', id: 'LIST' }],
    }),
    getUOMById: builder.query({
      query: (id) => ({
        url: `/uoms/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'UOMs', id }],
    }),
    createUOM: builder.mutation({
      query: (uomData) => ({
        url: '/uoms',
        method: 'post',
        data: uomData,
      }),
      invalidatesTags: [{ type: 'UOMs', id: 'LIST' }],
    }),
    updateUOM: builder.mutation({
      query: ({ id, ...uomData }) => ({
        url: `/uoms/${id}`,
        method: 'put',
        data: uomData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UOMs', id },
        { type: 'UOMs', id: 'LIST' },
      ],
    }),
    updateUOMStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/uoms/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UOMs', id },
        { type: 'UOMs', id: 'LIST' },
      ],
    }),

    // --- Item Groups ---
    getItemGroups: builder.query({
      query: (params = {}) => ({
        url: '/item-groups',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.groups || result?.itemGroups
          ? [
              ...(result.groups || result.itemGroups).map(({ _id }) => ({
                type: 'ItemGroups',
                id: _id,
              })),
              { type: 'ItemGroups', id: 'LIST' },
            ]
          : [{ type: 'ItemGroups', id: 'LIST' }],
    }),
    getItemGroupById: builder.query({
      query: (id) => ({
        url: `/item-groups/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'ItemGroups', id }],
    }),
    createItemGroup: builder.mutation({
      query: (data) => ({
        url: '/item-groups',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'ItemGroups', id: 'LIST' }],
    }),
    updateItemGroup: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/item-groups/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemGroups', id },
        { type: 'ItemGroups', id: 'LIST' },
      ],
    }),
    updateItemGroupStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/item-groups/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemGroups', id },
        { type: 'ItemGroups', id: 'LIST' },
      ],
    }),
    deleteItemGroup: builder.mutation({
      query: (id) => ({
        url: `/item-groups/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ItemGroups', id },
        { type: 'ItemGroups', id: 'LIST' },
      ],
    }),

    // --- Item Categories ---
    getItemCategories: builder.query({
      query: (params = {}) => ({
        url: '/item-categories',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.categories || result?.itemCategories
          ? [
              ...(result.categories || result.itemCategories).map(({ _id }) => ({
                type: 'ItemCategories',
                id: _id,
              })),
              { type: 'ItemCategories', id: 'LIST' },
            ]
          : [{ type: 'ItemCategories', id: 'LIST' }],
    }),
    getItemCategoryById: builder.query({
      query: (id) => ({
        url: `/item-categories/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'ItemCategories', id }],
    }),
    createItemCategory: builder.mutation({
      query: (data) => ({
        url: '/item-categories',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'ItemCategories', id: 'LIST' }],
    }),
    updateItemCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/item-categories/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemCategories', id },
        { type: 'ItemCategories', id: 'LIST' },
      ],
    }),
    updateItemCategoryStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/item-categories/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemCategories', id },
        { type: 'ItemCategories', id: 'LIST' },
      ],
    }),
    deleteItemCategory: builder.mutation({
      query: (id) => ({
        url: `/item-categories/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ItemCategories', id },
        { type: 'ItemCategories', id: 'LIST' },
      ],
    }),
    getCategorySpecifications: builder.query({
      query: (categoryId) => ({
        url: `/item-categories/${categoryId}/specifications`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'ItemCategories', id: `SPECS_${id}` }],
    }),
    assignCategorySpecification: builder.mutation({
      query: ({ categoryId, ...data }) => ({
        url: `/item-categories/${categoryId}/specifications`,
        method: 'post',
        data,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: 'ItemCategories', id: `SPECS_${categoryId}` },
      ],
    }),
    updateCategorySpecification: builder.mutation({
      query: ({ categoryId, specificationId, ...data }) => ({
        url: `/item-categories/${categoryId}/specifications/${specificationId}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: 'ItemCategories', id: `SPECS_${categoryId}` },
      ],
    }),
    removeCategorySpecification: builder.mutation({
      query: ({ categoryId, specificationId }) => ({
        url: `/item-categories/${categoryId}/specifications/${specificationId}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: 'ItemCategories', id: `SPECS_${categoryId}` },
      ],
    }),

    // --- Filter Grades ---
    getFilterGrades: builder.query({
      query: (params = {}) => ({
        url: '/filter-grades',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.filterGrades
          ? [
              ...result.filterGrades.map(({ _id }) => ({ type: 'FilterGrades', id: _id })),
              { type: 'FilterGrades', id: 'LIST' },
            ]
          : [{ type: 'FilterGrades', id: 'LIST' }],
    }),
    getFilterGradeById: builder.query({
      query: (id) => ({
        url: `/filter-grades/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'FilterGrades', id }],
    }),
    createFilterGrade: builder.mutation({
      query: (data) => ({
        url: '/filter-grades',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'FilterGrades', id: 'LIST' }],
    }),
    updateFilterGrade: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/filter-grades/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FilterGrades', id },
        { type: 'FilterGrades', id: 'LIST' },
      ],
    }),
    updateFilterGradeStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/filter-grades/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FilterGrades', id },
        { type: 'FilterGrades', id: 'LIST' },
      ],
    }),
    deleteFilterGrade: builder.mutation({
      query: (id) => ({
        url: `/filter-grades/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'FilterGrades', id },
        { type: 'FilterGrades', id: 'LIST' },
      ],
    }),

    // --- Flange Designs ---
    getFlangeDesigns: builder.query({
      query: (params = {}) => ({
        url: '/flange-designs',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.flangeDesigns
          ? [
              ...result.flangeDesigns.map(({ _id }) => ({ type: 'FlangeDesigns', id: _id })),
              { type: 'FlangeDesigns', id: 'LIST' },
            ]
          : [{ type: 'FlangeDesigns', id: 'LIST' }],
    }),
    getFlangeDesignById: builder.query({
      query: (id) => ({
        url: `/flange-designs/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'FlangeDesigns', id }],
    }),
    createFlangeDesign: builder.mutation({
      query: (data) => ({
        url: '/flange-designs',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'FlangeDesigns', id: 'LIST' }],
    }),
    updateFlangeDesign: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/flange-designs/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FlangeDesigns', id },
        { type: 'FlangeDesigns', id: 'LIST' },
      ],
    }),
    deleteFlangeDesign: builder.mutation({
      query: (id) => ({
        url: `/flange-designs/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'FlangeDesigns', id },
        { type: 'FlangeDesigns', id: 'LIST' },
      ],
    }),

    // --- Terms ---
    getTerms: builder.query({
      query: (params = {}) => ({
        url: '/terms',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.terms
          ? [
              ...result.terms.map(({ _id }) => ({ type: 'Terms', id: _id })),
              { type: 'Terms', id: 'LIST' },
            ]
          : [{ type: 'Terms', id: 'LIST' }],
    }),
    getTermById: builder.query({
      query: (id) => ({
        url: `/terms/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Terms', id }],
    }),
    createTerm: builder.mutation({
      query: (termData) => ({
        url: '/terms',
        method: 'post',
        data: termData,
      }),
      invalidatesTags: [{ type: 'Terms', id: 'LIST' }],
    }),
    updateTerm: builder.mutation({
      query: ({ id, ...termData }) => ({
        url: `/terms/${id}`,
        method: 'put',
        data: termData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Terms', id },
        { type: 'Terms', id: 'LIST' },
      ],
    }),
    updateTermStatus: builder.mutation({
      query: ({ id, statusOrIsActive }) => {
        const payload =
          typeof statusOrIsActive === 'boolean'
            ? { isActive: statusOrIsActive }
            : typeof statusOrIsActive === 'string'
            ? { status: statusOrIsActive }
            : statusOrIsActive;
        return {
          url: `/terms/${id}/status`,
          method: 'patch',
          data: payload,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Terms', id },
        { type: 'Terms', id: 'LIST' },
      ],
    }),
    deleteTerm: builder.mutation({
      query: (id) => ({
        url: `/terms/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Terms', id },
        { type: 'Terms', id: 'LIST' },
      ],
    }),

    // --- Specifications ---
    getSpecifications: builder.query({
      query: (params = {}) => ({
        url: '/specifications',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.specifications
          ? [
              ...result.specifications.map(({ _id }) => ({ type: 'Specifications', id: _id })),
              { type: 'Specifications', id: 'LIST' },
            ]
          : [{ type: 'Specifications', id: 'LIST' }],
    }),
    getSpecificationById: builder.query({
      query: (id) => ({
        url: `/specifications/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Specifications', id }],
    }),
    createSpecification: builder.mutation({
      query: (data) => ({
        url: '/specifications',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'Specifications', id: 'LIST' }],
    }),
    updateSpecification: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/specifications/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Specifications', id },
        { type: 'Specifications', id: 'LIST' },
      ],
    }),
    updateSpecificationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/specifications/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Specifications', id },
        { type: 'Specifications', id: 'LIST' },
      ],
    }),
    deleteSpecification: builder.mutation({
      query: (id) => ({
        url: `/specifications/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Specifications', id },
        { type: 'Specifications', id: 'LIST' },
      ],
    }),

    // --- Roles ---
    getRoles: builder.query({
      query: (params = {}) => ({
        url: '/roles',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Roles', id: 'LIST' }],
    }),

    // --- Plants ---
    getPlants: builder.query({
      query: (params = {}) => ({
        url: '/plants',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Plants', id: 'LIST' }],
    }),
    getPlantById: builder.query({
      query: (id) => ({
        url: `/plants/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Plants', id }],
    }),
  }),
});

export const {
  // Clients
  useGetClientsQuery,
  useLazyGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useUpdateClientStatusMutation,
  useApproveOrRejectClientMutation,
  useDeleteClientMutation,
  // UOMs
  useGetUOMsQuery,
  useGetUOMByIdQuery,
  useCreateUOMMutation,
  useUpdateUOMMutation,
  useUpdateUOMStatusMutation,
  // Item Groups
  useGetItemGroupsQuery,
  useGetItemGroupByIdQuery,
  useCreateItemGroupMutation,
  useUpdateItemGroupMutation,
  useUpdateItemGroupStatusMutation,
  useDeleteItemGroupMutation,
  // Item Categories
  useGetItemCategoriesQuery,
  useGetItemCategoryByIdQuery,
  useCreateItemCategoryMutation,
  useUpdateItemCategoryMutation,
  useUpdateItemCategoryStatusMutation,
  useDeleteItemCategoryMutation,
  useGetCategorySpecificationsQuery,
  useAssignCategorySpecificationMutation,
  useUpdateCategorySpecificationMutation,
  useRemoveCategorySpecificationMutation,
  // Filter Grades
  useGetFilterGradesQuery,
  useGetFilterGradeByIdQuery,
  useCreateFilterGradeMutation,
  useUpdateFilterGradeMutation,
  useUpdateFilterGradeStatusMutation,
  useDeleteFilterGradeMutation,
  // Flange Designs
  useGetFlangeDesignsQuery,
  useGetFlangeDesignByIdQuery,
  useCreateFlangeDesignMutation,
  useUpdateFlangeDesignMutation,
  useDeleteFlangeDesignMutation,
  // Terms
  useGetTermsQuery,
  useGetTermByIdQuery,
  useCreateTermMutation,
  useUpdateTermMutation,
  useUpdateTermStatusMutation,
  useDeleteTermMutation,
  // Specifications
  useGetSpecificationsQuery,
  useGetSpecificationByIdQuery,
  useCreateSpecificationMutation,
  useUpdateSpecificationMutation,
  useUpdateSpecificationStatusMutation,
  useDeleteSpecificationMutation,
  // Roles
  useGetRolesQuery,
  // Plants
  useGetPlantsQuery,
  useGetPlantByIdQuery,
} = masterDataApi;

