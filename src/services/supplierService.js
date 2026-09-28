import api from './api';

export const getSuppliers = async (params = {}) => {
  const response = await api.get('/suppliers', { params });
  return response.data;
};

export const getSupplierById = async (id) => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data;
};

export const createSupplier = async (supplierData) => {
  const response = await api.post('/suppliers', supplierData);
  return response.data;
};

export const updateSupplier = async (id, supplierData) => {
  const response = await api.put(`/suppliers/${id}`, supplierData);
  return response.data;
};

export const updateSupplierStatus = async (id, status) => {
  const response = await api.patch(`/suppliers/${id}/status`, { status });
  return response.data;
};

export const deleteSupplier = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};

export const getSupplierPurchaseHistory = async (id, params = {}) => {
  const response = await api.get(`/suppliers/${id}/purchase-history`, { params });
  return response.data;
};

export const getSupplierItemPriceHistory = async (id, params = {}) => {
  const response = await api.get(`/suppliers/${id}/item-price-history`, { params });
  return response.data;
};

export const getSupplierPurchaseSummary = async (id) => {
  const response = await api.get(`/suppliers/${id}/purchase-summary`);
  return response.data;
};
