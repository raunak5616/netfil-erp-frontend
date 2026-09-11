import api from './api';

// Header API Endpoints
export const getSalesOrders = async (params = {}) => {
  const response = await api.get('/sales-orders', { params });
  return response.data;
};

export const getSalesOrderById = async (salesOrderId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}`);
  return response.data;
};

export const createSalesOrder = async (salesOrderData) => {
  const response = await api.post('/sales-orders', salesOrderData);
  return response.data;
};

export const updateSalesOrder = async (salesOrderId, salesOrderData) => {
  const response = await api.put(`/sales-orders/${salesOrderId}`, salesOrderData);
  return response.data;
};

export const updateSalesOrderStatus = async (salesOrderId, status) => {
  const response = await api.patch(`/sales-orders/${salesOrderId}/status`, { status });
  return response.data;
};

export const getSalesOrderReferences = async (salesOrderId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/references`);
  return response.data;
};

// Item API Endpoints
export const getSalesOrderItems = async (salesOrderId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/items`);
  return response.data;
};

export const addSalesOrderItem = async (salesOrderId, itemData) => {
  const response = await api.post(`/sales-orders/${salesOrderId}/items`, itemData);
  return response.data;
};

export const updateSalesOrderItem = async (salesOrderId, itemId, itemData) => {
  const response = await api.put(`/sales-orders/${salesOrderId}/items/${itemId}`, itemData);
  return response.data;
};

export const deleteSalesOrderItem = async (salesOrderId, itemId) => {
  const response = await api.delete(`/sales-orders/${salesOrderId}/items/${itemId}`);
  return response.data;
};
