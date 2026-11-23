import { apiSlice } from '../api/apiSlice';

/**
 * Quality Inspection & Assurance RTK Query API Slice.
 * Handles incoming (IQC), in-process, and finished goods quality verification.
 */
export const qualityApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQualityInspections: builder.query({
      query: (params = {}) => ({
        url: '/quality-inspections',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.qualityInspections
          ? [
              ...result.qualityInspections.map(({ _id }) => ({ type: 'QualityInspections', id: _id })),
              { type: 'QualityInspections', id: 'LIST' },
            ]
          : [{ type: 'QualityInspections', id: 'LIST' }],
    }),

    getQualityInspectionById: builder.query({
      query: (id) => ({
        url: `/quality-inspections/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'QualityInspections', id }],
    }),

    createQualityInspection: builder.mutation({
      query: (data) => ({
        url: '/quality-inspections',
        method: 'post',
        data,
      }),
      invalidatesTags: [{ type: 'QualityInspections', id: 'LIST' }],
    }),

    updateQualityInspection: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quality-inspections/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'QualityInspections', id },
        { type: 'QualityInspections', id: 'LIST' },
      ],
    }),

    updateQualityInspectionStatus: builder.mutation({
      query: ({ id, action, remarks, rejectionReason }) => ({
        url: `/quality-inspections/${id}/status`,
        method: 'patch',
        data: { action, remarks, rejectionReason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'QualityInspections', id },
        { type: 'QualityInspections', id: 'LIST' },
      ],
    }),

    deleteQualityInspection: builder.mutation({
      query: (id) => ({
        url: `/quality-inspections/${id}`,
        method: 'delete',
      }),
      invalidatesTags: [{ type: 'QualityInspections', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetQualityInspectionsQuery,
  useGetQualityInspectionByIdQuery,
  useCreateQualityInspectionMutation,
  useUpdateQualityInspectionMutation,
  useUpdateQualityInspectionStatusMutation,
  useDeleteQualityInspectionMutation,
} = qualityApi;
