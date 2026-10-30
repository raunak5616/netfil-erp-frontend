import { apiSlice } from '../api/apiSlice';

/**
 * Departments RTK Query API Slice.
 * Handles departments caching, deduplication across employees, purchase, and organization modules,
 * and automatic cache invalidation upon mutations.
 */
export const departmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: () => ({
        url: '/departments',
        method: 'get',
      }),
      providesTags: (result) =>
        result?.departments
          ? [
              ...result.departments.map(({ _id }) => ({ type: 'Departments', id: _id })),
              { type: 'Departments', id: 'LIST' },
            ]
          : [{ type: 'Departments', id: 'LIST' }],
    }),
    getDepartmentById: builder.query({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Departments', id }],
    }),
    createDepartment: builder.mutation({
      query: (departmentData) => ({
        url: '/departments',
        method: 'post',
        data: departmentData,
      }),
      invalidatesTags: [{ type: 'Departments', id: 'LIST' }],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...departmentData }) => ({
        url: `/departments/${id}`,
        method: 'put',
        data: departmentData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Departments', id },
        { type: 'Departments', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} = departmentsApi;
