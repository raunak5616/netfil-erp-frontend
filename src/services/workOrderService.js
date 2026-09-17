import api from './api';

export const getWorkOrders = async (params = {}) => {
  const response = await api.get('/work-orders', { params });
  return response.data;
};

export const getWorkOrderById = async (workOrderId) => {
  const response = await api.get(`/work-orders/${workOrderId}`);
  return response.data;
};

export const createWorkOrder = async (data) => {
  const response = await api.post('/work-orders', data);
  return response.data;
};

export const updateWorkOrder = async (workOrderId, data) => {
  const response = await api.put(`/work-orders/${workOrderId}`, data);
  return response.data;
};

export const releaseWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/release`, data);
  return response.data;
};

export const startWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/start`, data);
  return response.data;
};

export const completeWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/complete`, data);
  return response.data;
};

export const cancelWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/cancel`, data);
  return response.data;
};
