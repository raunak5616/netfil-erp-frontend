import api from './api';

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const changeUserPassword = async (id, passwordData) => {
  const response = await api.put(`/users/${id}/password`, passwordData);
  return response.data;
};

export const updateUserStatus = async (id, isActive) => {
  const response = await api.patch(`/users/${id}/status`, { isActive });
  return response.data;
};
