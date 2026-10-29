import api from './api';

export const getTerms = async (params = {}) => {
  const response = await api.get('/terms', { params });
  return response.data;
};

export const getTermById = async (id) => {
  const response = await api.get(`/terms/${id}`);
  return response.data;
};

export const createTerm = async (data) => {
  const response = await api.post('/terms', data);
  return response.data;
};

export const updateTerm = async (id, data) => {
  const response = await api.put(`/terms/${id}`, data);
  return response.data;
};

export const updateTermStatus = async (id, statusOrIsActive) => {
  const payload = typeof statusOrIsActive === 'boolean' 
    ? { isActive: statusOrIsActive } 
    : typeof statusOrIsActive === 'string' 
    ? { status: statusOrIsActive } 
    : statusOrIsActive;
  const response = await api.patch(`/terms/${id}/status`, payload);
  return response.data;
};

export const deleteTerm = async (id) => {
  const response = await api.delete(`/terms/${id}`);
  return response.data;
};
