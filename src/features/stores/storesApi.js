import { apiSlice } from '../api/apiSlice';

/**
 * Stores & Inventory Master RTK Query API Slice.
 * Handles store facilities, storage locations, plants, and bin locations.
 */
export const storesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query({
      query: (params = {}) => ({
        url: '/stores',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.stores
          ? [
              ...result.stores.map(({ _id }) => ({ type: 'Stores', id: _id })),
              { type: 'Stores', id: 'LIST' },
            ]
          : [{ type: 'Stores', id: 'LIST' }],
    }),
    getStoreById: builder.query({
      query: (id) => ({
        url: `/stores/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Stores', id }],
    }),
    createStore: builder.mutation({
      query: (data) => ({
        url: '/stores',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'Stores', id: 'LIST' }],
    }),
    updateStore: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/stores/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Stores', id },
        { type: 'Stores', id: 'LIST' },
      ],
    }),
    updateStoreStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/stores/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Stores', id },
        { type: 'Stores', id: 'LIST' },
      ],
    }),
    deleteStore: builder.mutation({
      query: (id) => ({
        url: `/stores/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Stores', id },
        { type: 'Stores', id: 'LIST' },
      ],
    }),
    getStorageLocations: builder.query({
      query: (params = {}) => ({
        url: '/storage-locations',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Stores', id: 'LOCATIONS_LIST' }],
    }),
    getPlants: builder.query({
      query: (params = {}) => ({
        url: '/plants',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Stores', id: 'PLANTS_LIST' }],
    }),
    getBins: builder.query({
      query: (params = {}) => ({
        url: '/bins',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Stores', id: 'BINS_LIST' }],
    }),
  }),
});

export const {
  useGetStoresQuery,
  useLazyGetStoresQuery,
  useGetStoreByIdQuery,
  useLazyGetStoreByIdQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useUpdateStoreStatusMutation,
  useDeleteStoreMutation,
  useGetStorageLocationsQuery,
  useLazyGetStorageLocationsQuery,
  useGetPlantsQuery,
  useLazyGetPlantsQuery,
  useGetBinsQuery,
  useLazyGetBinsQuery,
} = storesApi;
