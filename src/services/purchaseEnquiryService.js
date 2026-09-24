import api from './api';

export const getPurchaseEnquiries = async (params = {}) => {
  const response = await api.get('/purchase-enquiries', { params });
  return response.data;
};

export const getPurchaseEnquiryById = async (id) => {
  const response = await api.get(`/purchase-enquiries/${id}`);
  return response.data;
};

export const createPurchaseEnquiry = async (data) => {
  const response = await api.post('/purchase-enquiries', data);
  return response.data;
};

export const updatePurchaseEnquiry = async (id, data) => {
  const response = await api.put(`/purchase-enquiries/${id}`, data);
  return response.data;
};

export const updatePurchaseEnquiryStatus = async (id, action, remarks = '') => {
  const response = await api.patch(`/purchase-enquiries/${id}/status`, { action, remarks });
  return response.data;
};

export const deletePurchaseEnquiry = async (id) => {
  const response = await api.delete(`/purchase-enquiries/${id}`);
  return response.data;
};
