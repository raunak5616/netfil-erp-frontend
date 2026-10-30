import { apiSlice } from '../api/apiSlice';

/**
 * Roles & Granular Permissions RTK Query API Slice.
 * Handles role listing, creation, permission assignment, and role details.
 */
export const rolesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: (params = {}) => ({
        url: '/roles',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.roles
          ? [
              ...result.roles.map(({ _id }) => ({ type: 'Roles', id: _id })),
              { type: 'Roles', id: 'LIST' },
            ]
          : [{ type: 'Roles', id: 'LIST' }],
    }),
    getRoleById: builder.query({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'get',
      }),
      providesTags: (result, error, id) => [{ type: 'Roles', id }],
    }),
    getPermissions: builder.query({
      query: () => ({
        url: '/permissions',
        method: 'get',
      }),
      providesTags: [{ type: 'Roles', id: 'PERMISSIONS_LIST' }],
    }),
    createRole: builder.mutation({
      query: (roleData) => ({
        url: '/roles',
        method: 'post',
        data: roleData,
      }),
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...roleData }) => ({
        url: `/roles/${id}`,
        method: 'put',
        data: roleData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Roles', id },
        { type: 'Roles', id: 'LIST' },
      ],
    }),
    assignRolePermissions: builder.mutation({
      query: ({ id, permissionIds }) => ({
        url: `/roles/${id}/permissions`,
        method: 'put',
        data: { permissionIds },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Roles', id },
        { type: 'Roles', id: 'LIST' },
        { type: 'Auth', id: 'SESSION' },
      ],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignRolePermissionsMutation,
} = rolesApi;
