import api from './api';

export const getItemCategories = async () => {
  const response = await api.get('/item-categories');
  return response.data;
};

export const getItemCategoryById = async (categoryId) => {
  const response = await api.get(`/item-categories/${categoryId}`);
  return response.data;
};

export const createItemCategory = async (categoryData) => {
  const response = await api.post('/item-categories', categoryData);
  return response.data;
};

export const updateItemCategory = async (categoryId, categoryData) => {
  const response = await api.put(`/item-categories/${categoryId}`, categoryData);
  return response.data;
};

export const updateItemCategoryStatus = async (categoryId, status) => {
  const response = await api.patch(`/item-categories/${categoryId}/status`, { status });
  return response.data;
};

export const getCategorySpecifications = async (categoryId) => {
  const response = await api.get(`/item-categories/${categoryId}/specifications`);
  return response.data;
};

