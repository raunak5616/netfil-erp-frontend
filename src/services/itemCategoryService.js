import api from './api';

export const getItemCategories = async () => {
  const response = await api.get('/item-categories');
  return response.data;
};

export const getCategorySpecifications = async (categoryId) => {
  const response = await api.get(`/item-categories/${categoryId}/specifications`);
  return response.data;
};
