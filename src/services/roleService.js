import api from './api';

export const getRoles = async () => {
  const response = await api.get('/roles');
  return response.data;
};

export const getRoleById = async (id) => {
  const response = await api.get(`/roles/${id}`);
  return response.data;
};
