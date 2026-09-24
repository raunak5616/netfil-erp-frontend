import api from './api';

export const getPurchaseRequisitions = async (params = {}) => {
  const response = await api.get('/purchase-requisitions', { params });
  return response.data;
};

export const getPurchaseRequisitionById = async (id) => {
  const response = await api.get(`/purchase-requisitions/${id}`);
  return response.data;
};

export const createPurchaseRequisition = async (data) => {
  const response = await api.post('/purchase-requisitions', data);
  return response.data;
};

export const updatePurchaseRequisition = async (id, data) => {
  const response = await api.put(`/purchase-requisitions/${id}`, data);
  return response.data;
};

export const updatePurchaseRequisitionStatus = async (id, action, remarks = '') => {
  const response = await api.patch(`/purchase-requisitions/${id}/status`, { action, remarks });
  return response.data;
};

export const deletePurchaseRequisition = async (id) => {
  const response = await api.delete(`/purchase-requisitions/${id}`);
  return response.data;
};
