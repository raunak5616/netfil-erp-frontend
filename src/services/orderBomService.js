import api from './api';

export const getOrderBOMs = async (params = {}) => {
  const response = await api.get('/order-boms', { params });
  return response.data;
};

export const getOrderBOMById = async (orderBOMId) => {
  const response = await api.get(`/order-boms/${orderBOMId}`);
  return response.data;
};

export const createOrderBOM = async (orderBOMData) => {
  const response = await api.post('/order-boms', orderBOMData);
  return response.data;
};

export const sendToStore = async (orderBOMId, data = {}) => {
  const response = await api.patch(`/order-boms/${orderBOMId}/send-to-store`, data);
  return response.data;
};

export const receiveByStore = async (orderBOMId, data = {}) => {
  const response = await api.patch(`/order-boms/${orderBOMId}/receive-by-store`, data);
  return response.data;
};

export const sendToFactory = async (orderBOMId, data = {}) => {
  const response = await api.patch(`/order-boms/${orderBOMId}/send-to-factory`, data);
  return response.data;
};

export const receiveByFactory = async (orderBOMId, data = {}) => {
  const response = await api.patch(`/order-boms/${orderBOMId}/receive-by-factory`, data);
  return response.data;
};

export const cancelOrderBOM = async (orderBOMId, data = {}) => {
  const response = await api.patch(`/order-boms/${orderBOMId}/cancel`, data);
  return response.data;
};
