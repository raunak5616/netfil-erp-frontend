import api from './api';

export const getStores = async (params = {}) => {
  const response = await api.get('/stores', { params });
  return response.data;
};

export const getStoreById = async (storeId) => {
  const response = await api.get(`/stores/${storeId}`);
  return response.data;
};
