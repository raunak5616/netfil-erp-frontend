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
