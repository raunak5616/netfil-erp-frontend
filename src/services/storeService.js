import api from './api';

export const getStores = async (params = {}) => {
  const response = await api.get('/stores', { params });
  return response.data;
};

export const getStoreById = async (storeId) => {
  const response = await api.get(`/stores/${storeId}`);
  return response.data;
};

export const createStore = async (storeData) => {
  const response = await api.post('/stores', storeData);
  return response.data;
};

export const updateStore = async (storeId, storeData) => {
  const response = await api.put(`/stores/${storeId}`, storeData);
  return response.data;
};

export const updateStoreStatus = async (storeId, status) => {
  const response = await api.patch(`/stores/${storeId}/status`, { status });
  return response.data;
};

export const deleteStore = async (storeId) => {
  const response = await api.delete(`/stores/${storeId}`);
  return response.data;
};
