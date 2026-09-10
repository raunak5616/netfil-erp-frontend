import api from './api';

export const getClients = async (params = {}) => {
  const response = await api.get('/clients', { params });
  return response.data;
};

export const getClientById = async (clientId) => {
  const response = await api.get(`/clients/${clientId}`);
  return response.data;
};

export const createClient = async (clientData) => {
  const response = await api.post('/clients', clientData);
  return response.data;
};

export const updateClient = async (clientId, clientData) => {
  const response = await api.put(`/clients/${clientId}`, clientData);
  return response.data;
};

export const updateClientStatus = async (clientId, status) => {
  const response = await api.patch(`/clients/${clientId}/status`, { status });
  return response.data;
};
