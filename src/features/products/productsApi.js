import { apiSlice } from '../api/apiSlice';

/**
 * Products / Items RTK Query API Slice.
 * Preserves backend filtering, search, sorting, and server-side pagination parameters.
 * Provides caching and invalidation across catalog, quotations, requirements, and orders.
 */
export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query({
      query: (params = {}) => ({
        url: '/items',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ _id }) => ({ type: 'Products', id: _id })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),
    getItemById: builder.query({
      query: (itemId) => ({
        url: `/items/${itemId}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Products', id }],
    }),
    createItem: builder.mutation({
      query: (itemData) => ({
        url: '/items',
        method: 'post',
        data: itemData,
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    updateItem: builder.mutation({
      query: ({ id, ...itemData }) => ({
        url: `/items/${id}`,
        method: 'put',
        data: itemData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    updateItemStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/items/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `/items/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    uploadItemImage: builder.mutation({
      query: ({ id, formData }) => ({
        url: id ? `/items/${id}/image` : '/items/upload-image',
        method: id ? 'patch' : 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    removeItemImage: builder.mutation({
      query: (id) => ({
        url: `/items/${id}/image`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    getItemSpecifications: builder.query({
      query: (itemId) => ({
        url: `/items/${itemId}/specifications`,
        method: 'get',
      }),
      providesTags: (result, error, itemId) => [{ type: 'Products', id: `SPECS_${itemId}` }],
    }),
    assignItemSpecification: builder.mutation({
      query: ({ itemId, specData }) => ({
        url: `/items/${itemId}/specifications`,
        method: 'post',
        data: specData,
      }),
      invalidatesTags: (result, error, { itemId }) => [{ type: 'Products', id: `SPECS_${itemId}` }],
    }),
    updateItemSpecification: builder.mutation({
      query: ({ itemId, specificationId, specData }) => ({
        url: `/items/${itemId}/specifications/${specificationId}`,
        method: 'put',
        data: specData,
      }),
      invalidatesTags: (result, error, { itemId }) => [{ type: 'Products', id: `SPECS_${itemId}` }],
    }),
    removeItemSpecification: builder.mutation({
      query: ({ itemId, specificationId }) => ({
        url: `/items/${itemId}/specifications/${specificationId}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, { itemId }) => [{ type: 'Products', id: `SPECS_${itemId}` }],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useUpdateItemStatusMutation,
  useDeleteItemMutation,
  useUploadItemImageMutation,
  useRemoveItemImageMutation,
  useGetItemSpecificationsQuery,
  useAssignItemSpecificationMutation,
  useUpdateItemSpecificationMutation,
  useRemoveItemSpecificationMutation,
} = productsApi;

export const useGetProductsQuery = useGetItemsQuery;
export const useGetProductByIdQuery = useGetItemByIdQuery;
export const useCreateProductMutation = useCreateItemMutation;
export const useUpdateProductMutation = useUpdateItemMutation;
export const useDeleteProductMutation = useDeleteItemMutation;
