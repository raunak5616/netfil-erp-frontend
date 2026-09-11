import api from './api';

export const getRequirements = async (params = {}) => {
  const response = await api.get('/requirements', { params });
  return response.data;
};

export const getRequirementById = async (requirementId) => {
  const response = await api.get(`/requirements/${requirementId}`);
  return response.data;
};

export const createRequirement = async (requirementData) => {
  const response = await api.post('/requirements', requirementData);
  return response.data;
};

export const updateRequirement = async (requirementId, requirementData) => {
  const response = await api.put(`/requirements/${requirementId}`, requirementData);
  return response.data;
};

export const updateRequirementStatus = async (requirementId, status) => {
  const response = await api.patch(`/requirements/${requirementId}/status`, { status });
  return response.data;
};
