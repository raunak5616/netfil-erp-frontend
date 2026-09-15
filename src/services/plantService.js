import api from './api';

export const getPlants = async (params = {}) => {
  const response = await api.get('/plants', { params });
  return response.data;
};

export const getPlantById = async (plantId) => {
  const response = await api.get(`/plants/${plantId}`);
  return response.data;
};
