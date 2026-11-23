import { apiSlice } from '../api/apiSlice';

export const docsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentHubAssets: builder.query({
      query: (params) => ({
        url: '/document-hub/assets',
        method: 'GET',
        params,
      }),
      providesTags: ['DocumentHub'],
    }),
  }),
});

export const { useGetDocumentHubAssetsQuery } = docsApi;
