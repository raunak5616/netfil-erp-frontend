import { apiSlice } from '../api/apiSlice';

/**
 * Employees RTK Query API Slice.
 * Preserves server-side pagination, sorting, and filtering parameters.
 * Provides tag-based cache invalidation when creating or updating employees.
 */
export const employeesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params = {}) => ({
        url: '/employees',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.employees
          ? [
              ...result.employees.map(({ _id }) => ({ type: 'Employees', id: _id })),
              { type: 'Employees', id: 'LIST' },
            ]
          : [{ type: 'Employees', id: 'LIST' }],
    }),
    getEmployeeById: builder.query({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Employees', id }],
    }),
    createEmployee: builder.mutation({
      query: (employeeData) => ({
        url: '/employees',
        method: 'post',
        data: employeeData,
      }),
      invalidatesTags: [{ type: 'Employees', id: 'LIST' }],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, data }) => ({
        url: `/employees/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employees', id },
        { type: 'Employees', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
} = employeesApi;
