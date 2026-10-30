import { apiSlice } from '../api/apiSlice';

/**
 * Users & Account Management RTK Query API Slice.
 * Handles user list, user profile, password change, and status toggles.
 */
export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params = {}) => ({
        url: '/users',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.users
          ? [
              ...result.users.map(({ _id }) => ({ type: 'Users', id: _id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    }),
    getUserById: builder.query({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    getEligibleEmployees: builder.query({
      query: () => ({
        url: '/users/eligible-employees',
        method: 'get',
      }),
      providesTags: [{ type: 'Employees', id: 'ELIGIBLE_LIST' }],
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: '/users',
        method: 'post',
        data: userData,
      }),
      invalidatesTags: [
        { type: 'Users', id: 'LIST' },
        { type: 'Employees', id: 'ELIGIBLE_LIST' },
      ],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/users/${id}`,
        method: 'put',
        data: userData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    changeUserPassword: builder.mutation({
      query: ({ id, ...passwordData }) => ({
        url: `/users/${id}/password`,
        method: 'put',
        data: passwordData,
      }),
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/status`,
        method: 'patch',
        data: { isActive },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetEligibleEmployeesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserPasswordMutation,
  useUpdateUserStatusMutation,
} = usersApi;
