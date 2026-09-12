import api from './api';

// Header API Endpoints
export const getBOMs = async (params = {}) => {
  const response = await api.get('/boms', { params });
  return response.data;
};

export const getBOMById = async (bomId) => {
  const response = await api.get(`/boms/${bomId}`);
  return response.data;
};

export const createBOM = async (bomData) => {
  const response = await api.post('/boms', bomData);
  return response.data;
};

export const updateBOM = async (bomId, bomData) => {
  const response = await api.put(`/boms/${bomId}`, bomData);
  return response.data;
};

export const releaseBOM = async (bomId) => {
  const response = await api.patch(`/boms/${bomId}/release`);
  return response.data;
};

export const copyBOM = async (bomId, copyData = {}) => {
  const response = await api.post(`/boms/${bomId}/copy`, copyData);
  return response.data;
};

export const getBOMRevisions = async (bomId) => {
  const response = await api.get(`/boms/${bomId}/revisions`);
  return response.data;
};

// Component Item API Endpoints
export const addBOMItem = async (bomId, itemData) => {
  const response = await api.post(`/boms/${bomId}/items`, itemData);
  return response.data;
};

export const updateBOMItem = async (bomId, itemId, itemData) => {
  const response = await api.put(`/boms/${bomId}/items/${itemId}`, itemData);
  return response.data;
};

export const deleteBOMItem = async (bomId, itemId) => {
  const response = await api.delete(`/boms/${bomId}/items/${itemId}`);
  return response.data;
};
