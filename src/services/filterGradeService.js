import api from './api';

export const getFilterGrades = async (params = {}) => {
  const response = await api.get('/filter-grades', { params });
  return response.data;
};

export const getFilterGradeById = async (id) => {
  const response = await api.get(`/filter-grades/${id}`);
  return response.data;
};

export const createFilterGrade = async (data) => {
  const response = await api.post('/filter-grades', data);
  return response.data;
};

export const updateFilterGrade = async (id, data) => {
  const response = await api.put(`/filter-grades/${id}`, data);
  return response.data;
};

export const updateFilterGradeStatus = async (id, status) => {
  const response = await api.patch(`/filter-grades/${id}/status`, { status });
  return response.data;
};

export const deleteFilterGrade = async (id) => {
  const response = await api.delete(`/filter-grades/${id}`);
  return response.data;
};
