import api from './api';

export const getSpecifications = async () => {
  const response = await api.get('/specifications');
  return response.data;
};

export const getSpecificationById = async (specificationId) => {
  const response = await api.get(`/specifications/${specificationId}`);
  return response.data;
};

export const createSpecification = async (specData) => {
  const response = await api.post('/specifications', specData);
  return response.data;
};

export const updateSpecification = async (specificationId, specData) => {
  const response = await api.put(`/specifications/${specificationId}`, specData);
  return response.data;
};

export const updateSpecificationStatus = async (specificationId, status) => {
  const response = await api.patch(`/specifications/${specificationId}/status`, { status });
  return response.data;
};
