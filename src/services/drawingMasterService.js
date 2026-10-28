import api from './api';

export const getDrawings = async (params = {}) => {
  const response = await api.get('/drawings', { params });
  return response.data;
};

export const getDrawingById = async (id) => {
  const response = await api.get(`/drawings/${id}`);
  return response.data;
};

export const getDrawingsByFilterGrade = async (filterGradeId, params = {}) => {
  const response = await api.get(`/drawings/by-grade/${filterGradeId}`, { params });
  return response.data;
};

export const createDrawing = async (data) => {
  const isFormData = data instanceof FormData;
  const response = await api.post('/drawings', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  });
  return response.data;
};

export const updateDrawing = async (id, data) => {
  const isFormData = data instanceof FormData;
  const response = await api.put(`/drawings/${id}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  });
  return response.data;
};

export const updateDrawingStatus = async (id, status) => {
  const response = await api.patch(`/drawings/${id}/status`, { status });
  return response.data;
};

export const deleteDrawing = async (id) => {
  const response = await api.delete(`/drawings/${id}`);
  return response.data;
};

export const getHoleConfigurations = async (params = {}) => {
  const response = await api.get('/drawings/hole-configurations', { params });
  return response.data;
};

export const getHoleImages = async (params = {}) => {
  const response = await api.get('/drawings/hole-images', { params });
  return response.data;
};

export const saveHoleImage = async (data) => {
  const isFormData = data instanceof FormData;
  const response = await api.post('/drawings/hole-images', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  });
  return response.data;
};

export const deleteHoleImage = async (id) => {
  const response = await api.delete(`/drawings/hole-images/${id}`);
  return response.data;
};

export const generateDrawing = async (id, params = {}) => {
  const response = await api.get(`/drawings/${id}/generate`, {
    params,
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Produces a cache-busted image delivery URL based on the asset's last updated timestamp.
 * Avoids random query parameters on every render while ensuring instant refresh when an image is updated.
 */
export const getVersionedImageUrl = (url, updatedAt) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const v = updatedAt ? new Date(updatedAt).getTime() : '';
  if (!v || isNaN(v)) return url;
  return url.includes('?') ? `${url}&v=${v}` : `${url}?v=${v}`;
};

