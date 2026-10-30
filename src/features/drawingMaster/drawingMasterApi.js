import { apiSlice } from '../api/apiSlice';

/**
 * Drawing Master & Hole Image Configurations RTK Query API Slice.
 * Caches engineering drawings, grade-specific drawings, and hole configurations
 * across Drawing Master, Items, Requirements, Quotations, and Sales Orders.
 */
export const drawingMasterApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDrawings: builder.query({
      query: (params = {}) => ({
        url: '/drawings',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.drawings
          ? [
              ...result.drawings.map(({ _id }) => ({ type: 'Drawings', id: _id })),
              { type: 'Drawings', id: 'LIST' },
            ]
          : [{ type: 'Drawings', id: 'LIST' }],
    }),
    getDrawingById: builder.query({
      query: (id) => ({
        url: `/drawings/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Drawings', id }],
    }),
    getDrawingsByFilterGrade: builder.query({
      query: (args) => {
        const gradeId = typeof args === 'object' && args !== null ? args.filterGradeId : args;
        const params = typeof args === 'object' && args !== null ? args.params : undefined;
        return {
          url: `/drawings/by-grade/${gradeId}`,
          method: 'get',
          params,
        };
      },
      providesTags: (result, error, args) => {
        const gradeId = typeof args === 'object' && args !== null ? args.filterGradeId : args;
        return [{ type: 'Drawings', id: `GRADE_${gradeId}` }, { type: 'Drawings', id: 'LIST' }];
      },
    }),
    createDrawing: builder.mutation({
      query: (data) => ({
        url: '/drawings',
        method: 'post',
        data,
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }),
      invalidatesTags: [{ type: 'Drawings', id: 'LIST' }],
    }),
    updateDrawing: builder.mutation({
      query: ({ id, data }) => ({
        url: `/drawings/${id}`,
        method: 'put',
        data,
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Drawings', id },
        { type: 'Drawings', id: 'LIST' },
      ],
    }),
    updateDrawingStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/drawings/${id}/status`,
        method: 'patch',
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Drawings', id },
        { type: 'Drawings', id: 'LIST' },
      ],
    }),
    deleteDrawing: builder.mutation({
      query: (id) => ({
        url: `/drawings/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Drawings', id },
        { type: 'Drawings', id: 'LIST' },
      ],
    }),
    getHoleConfigurations: builder.query({
      query: (params = {}) => ({
        url: '/drawings/hole-configurations',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'HoleImages', id: 'CONFIG_LIST' }],
    }),
    getHoleImages: builder.query({
      query: (params = {}) => ({
        url: '/drawings/hole-images',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.holeImages
          ? [
              ...result.holeImages.map(({ _id }) => ({ type: 'HoleImages', id: _id })),
              { type: 'HoleImages', id: 'LIST' },
            ]
          : [{ type: 'HoleImages', id: 'LIST' }],
    }),
    saveHoleImage: builder.mutation({
      query: (data) => ({
        url: '/drawings/hole-images',
        method: 'post',
        data,
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }),
      invalidatesTags: [{ type: 'HoleImages', id: 'LIST' }],
    }),
    deleteHoleImage: builder.mutation({
      query: (id) => ({
        url: `/drawings/hole-images/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'HoleImages', id },
        { type: 'HoleImages', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDrawingsQuery,
  useGetDrawingByIdQuery,
  useGetDrawingsByFilterGradeQuery,
  useCreateDrawingMutation,
  useUpdateDrawingMutation,
  useUpdateDrawingStatusMutation,
  useDeleteDrawingMutation,
  useGetHoleConfigurationsQuery,
  useGetHoleImagesQuery,
  useSaveHoleImageMutation,
  useDeleteHoleImageMutation,
} = drawingMasterApi;
