import api from './api';

export const getItemGroups = async () => {
  const response = await api.get('/item-groups');
  return response.data;
};
