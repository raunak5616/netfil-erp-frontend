import api from './api';

export const getGoodsReceipts = async (params = {}) => {
  const response = await api.get('/goods-receipts', { params });
  return response.data;
};

export const getGoodsReceiptById = async (id) => {
  const response = await api.get(`/goods-receipts/${id}`);
  return response.data;
};

export const createGoodsReceipt = async (data) => {
  const response = await api.post('/goods-receipts', data);
  return response.data;
};

export const updateGoodsReceipt = async (id, data) => {
  const response = await api.put(`/goods-receipts/${id}`, data);
  return response.data;
};

export const updateGoodsReceiptStatus = async (id, action, remarks = '') => {
  const response = await api.patch(`/goods-receipts/${id}/status`, { action, remarks });
  return response.data;
};

export const deleteGoodsReceipt = async (id) => {
  const response = await api.delete(`/goods-receipts/${id}`);
  return response.data;
};
