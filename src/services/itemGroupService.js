import api from './api';

export const getItemGroups = async () => {
  const response = await api.get('/item-groups');
  return response.data;
};

export const getItemGroupById = async (groupId) => {
  const response = await api.get(`/item-groups/${groupId}`);
  return response.data;
};

export const createItemGroup = async (groupData) => {
  const response = await api.post('/item-groups', groupData);
  return response.data;
};

export const updateItemGroup = async (groupId, groupData) => {
  const response = await api.put(`/item-groups/${groupId}`, groupData);
  return response.data;
};

export const updateItemGroupStatus = async (groupId, status) => {
  const response = await api.patch(`/item-groups/${groupId}/status`, { status });
  return response.data;
};

