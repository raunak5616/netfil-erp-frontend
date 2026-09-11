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

// Enquiry MIS API Endpoints
export const getUnifiedMis = async (params = {}) => {
  const response = await api.get('/requirements/mis', { params });
  return response.data;
};

export const getCustomerMis = async (params = {}) => {
  const response = await api.get('/requirements/mis/customer', { params });
  return response.data;
};

export const getItemMis = async (params = {}) => {
  const response = await api.get('/requirements/mis/item', { params });
  return response.data;
};

export const getItemCategoryMis = async (params = {}) => {
  const response = await api.get('/requirements/mis/item-category', { params });
  return response.data;
};

export const getStatusMis = async (params = {}) => {
  const response = await api.get('/requirements/mis/status', { params });
  return response.data;
};

export const getSalesPersonMis = async (params = {}) => {
  const response = await api.get('/requirements/mis/sales-person', { params });
  return response.data;
};

export const getFollowUpMis = async (params = {}) => {
  const response = await api.get('/requirements/mis/follow-up', { params });
  return response.data;
};

