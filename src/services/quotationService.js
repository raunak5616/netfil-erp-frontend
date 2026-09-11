import api from './api';

// Header API Endpoints
export const getQuotations = async (params = {}) => {
  const response = await api.get('/quotations', { params });
  return response.data;
};

export const getQuotationById = async (quotationId) => {
  const response = await api.get(`/quotations/${quotationId}`);
  return response.data;
};

export const createQuotation = async (quotationData) => {
  const response = await api.post('/quotations', quotationData);
  return response.data;
};

export const updateQuotation = async (quotationId, quotationData) => {
  const response = await api.put(`/quotations/${quotationId}`, quotationData);
  return response.data;
};

export const updateQuotationStatus = async (quotationId, status) => {
  const response = await api.patch(`/quotations/${quotationId}/status`, { status });
  return response.data;
};

export const releaseQuotation = async (quotationId) => {
  const response = await api.patch(`/quotations/${quotationId}/release`);
  return response.data;
};

// Quotation Item API Endpoints
export const getQuotationItems = async (quotationId) => {
  const response = await api.get(`/quotations/${quotationId}/items`);
  return response.data;
};

export const addQuotationItem = async (quotationId, itemData) => {
  const response = await api.post(`/quotations/${quotationId}/items`, itemData);
  return response.data;
};

export const updateQuotationItem = async (quotationId, itemId, itemData) => {
  const response = await api.put(`/quotations/${quotationId}/items/${itemId}`, itemData);
  return response.data;
};

export const deleteQuotationItem = async (quotationId, itemId) => {
  const response = await api.delete(`/quotations/${quotationId}/items/${itemId}`);
  return response.data;
};

// Quotation Term API Endpoints
export const getQuotationTerms = async (quotationId) => {
  const response = await api.get(`/quotations/${quotationId}/terms`);
  return response.data;
};

export const addQuotationTerm = async (quotationId, termData) => {
  const response = await api.post(`/quotations/${quotationId}/terms`, termData);
  return response.data;
};

export const updateQuotationTerm = async (quotationId, termId, termData) => {
  const response = await api.put(`/quotations/${quotationId}/terms/${termId}`, termData);
  return response.data;
};

export const deleteQuotationTerm = async (quotationId, termId) => {
  const response = await api.delete(`/quotations/${quotationId}/terms/${termId}`);
  return response.data;
};

// Quotation Amendment & Reference Endpoints
export const createQuotationAmendment = async (quotationId, amendmentData) => {
  const response = await api.post(`/quotations/${quotationId}/amendments`, amendmentData);
  return response.data;
};

export const getQuotationAmendments = async (quotationId) => {
  const response = await api.get(`/quotations/${quotationId}/amendments`);
  return response.data;
};

export const getQuotationReferences = async (quotationId) => {
  const response = await api.get(`/quotations/${quotationId}/references`);
  return response.data;
};

export const getQuotationMIS = async (params = {}) => {
  const response = await api.get('/quotations/mis', { params });
  return response.data;
};
