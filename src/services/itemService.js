import api from './api';

export const getItems = async () => {
  const response = await api.get('/items');
  return response.data;
};

export const getItemById = async (itemId) => {
  const response = await api.get(`/items/${itemId}`);
  return response.data;
};

export const createItem = async (itemData) => {
  const response = await api.post('/items', itemData);
  return response.data;
};

export const updateItem = async (itemId, itemData) => {
  const response = await api.put(`/items/${itemId}`, itemData);
  return response.data;
};

export const updateItemStatus = async (itemId, status) => {
  const response = await api.patch(`/items/${itemId}/status`, { status });
  return response.data;
};

export const getItemSpecifications = async (itemId) => {
  const response = await api.get(`/items/${itemId}/specifications`);
  return response.data;
};

export const assignItemSpecification = async (itemId, specData) => {
  const response = await api.post(`/items/${itemId}/specifications`, specData);
  return response.data;
};

export const updateItemSpecification = async (itemId, specificationId, specData) => {
  const response = await api.put(`/items/${itemId}/specifications/${specificationId}`, specData);
  return response.data;
};

export const removeItemSpecification = async (itemId, specificationId) => {
  const response = await api.delete(`/items/${itemId}/specifications/${specificationId}`);
  return response.data;
};
