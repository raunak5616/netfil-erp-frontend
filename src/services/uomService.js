import api from './api';

export const getUOMs = async () => {
  const response = await api.get('/uoms');
  return response.data;
};

export const getUOMById = async (uomId) => {
  const response = await api.get(`/uoms/${uomId}`);
  return response.data;
};

export const createUOM = async (uomData) => {
  const response = await api.post('/uoms', uomData);
  return response.data;
};

export const updateUOM = async (uomId, uomData) => {
  const response = await api.put(`/uoms/${uomId}`, uomData);
  return response.data;
};

export const updateUOMStatus = async (uomId, status) => {
  const response = await api.patch(`/uoms/${uomId}/status`, { status });
  return response.data;
};
