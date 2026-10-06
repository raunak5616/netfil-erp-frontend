import api from './api';

export const getFlangeDesigns = async (params = {}) => {
  const response = await api.get('/flange-designs', { params });
  return response.data;
};

export const getFlangeDesignById = async (id) => {
  const response = await api.get(`/flange-designs/${id}`);
  return response.data;
};

export const createFlangeDesign = async (data) => {
  const response = await api.post('/flange-designs', data);
  return response.data;
};

export const updateFlangeDesign = async (id, data) => {
  const response = await api.put(`/flange-designs/${id}`, data);
  return response.data;
};

export const updateFlangeDesignStatus = async (id, status) => {
  const response = await api.patch(`/flange-designs/${id}/status`, { status });
  return response.data;
};

export const deleteFlangeDesign = async (id) => {
  const response = await api.delete(`/flange-designs/${id}`);
  return response.data;
};
