import api from './api';

export const getEmployees = async (params = {}) => {
  const response = await api.get('/employees', { params });
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/employees/${id}`, employeeData);
  return response.data;
};

export const getDepartments = async () => {
  const response = await api.get('/departments');
  return response.data;
};

export const downloadEmployeeDocument = async (id, fileName) => {
  try {
    const response = await api.get(`/employees/${id}/document?download=true`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'employee_document.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json.message) error.message = json.message;
      } catch (e) {
        // use default error message
      }
    }
    throw error;
  }
};

export const viewEmployeeDocument = async (id) => {
  try {
    const response = await api.get(`/employees/${id}/document`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json.message) error.message = json.message;
      } catch (e) {
        // use default error message
      }
    }
    throw error;
  }
};
