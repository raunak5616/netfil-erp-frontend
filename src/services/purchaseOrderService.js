import api from './api';

export const getPurchaseOrders = async (params = {}) => {
  const response = await api.get('/purchase-orders', { params });
  return response.data;
};

export const getPurchaseOrderById = async (id) => {
  const response = await api.get(`/purchase-orders/${id}`);
  return response.data;
};

export const createPurchaseOrder = async (data) => {
  const response = await api.post('/purchase-orders', data);
  return response.data;
};

export const updatePurchaseOrder = async (id, data) => {
  const response = await api.put(`/purchase-orders/${id}`, data);
  return response.data;
};

export const updatePurchaseOrderStatus = async (id, action, remarks = '') => {
  const response = await api.patch(`/purchase-orders/${id}/status`, { action, remarks });
  return response.data;
};

export const deletePurchaseOrder = async (id) => {
  const response = await api.delete(`/purchase-orders/${id}`);
  return response.data;
};

// Amendment API methods
export const createPurchaseOrderAmendment = async (id, data) => {
  const response = await api.post(`/purchase-orders/${id}/amendments`, data);
  return response.data;
};

export const getPurchaseOrderAmendments = async (id) => {
  const response = await api.get(`/purchase-orders/${id}/amendments`);
  return response.data;
};

export const getPurchaseOrderAmendmentById = async (id, amendmentId) => {
  const response = await api.get(`/purchase-orders/${id}/amendments/${amendmentId}`);
  return response.data;
};

// P-CAT Document API methods
export const getPurchaseOrderPCatDocuments = async (id) => {
  const response = await api.get(`/purchase-orders/${id}/pcat-documents`);
  return response.data;
};

export const uploadPurchaseOrderPCatDocuments = async (id, formData) => {
  const response = await api.post(`/purchase-orders/${id}/pcat-documents`, formData);
  return response.data;
};

export const deletePurchaseOrderPCatDocument = async (id, documentId) => {
  const response = await api.delete(`/purchase-orders/${id}/pcat-documents/${documentId}`);
  return response.data;
};
