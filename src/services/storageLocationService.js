import api from './api';

export const getStorageLocations = async (params = {}) => {
  const response = await api.get('/storage-locations', { params });
  return response.data;
};

export const getStorageLocationById = async (locationId) => {
  const response = await api.get(`/storage-locations/${locationId}`);
  return response.data;
};
