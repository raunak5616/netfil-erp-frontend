import api from './api';

export const getWorkOrders = async (params = {}) => {
  const response = await api.get('/work-orders', { params });
  return response.data;
};

export const getWorkOrderById = async (workOrderId) => {
  const response = await api.get(`/work-orders/${workOrderId}`);
  return response.data;
};

export const createWorkOrder = async (data) => {
  const response = await api.post('/work-orders', data);
  return response.data;
};

export const updateWorkOrder = async (workOrderId, data) => {
  const response = await api.put(`/work-orders/${workOrderId}`, data);
  return response.data;
};

export const releaseWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/release`, data);
  return response.data;
};

export const startWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/start`, data);
  return response.data;
};

export const completeWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/complete`, data);
  return response.data;
};

export const cancelWorkOrder = async (workOrderId, data = {}) => {
  const response = await api.patch(`/work-orders/${workOrderId}/cancel`, data);
  return response.data;
};

// ===================================================
// WORK ORDER DOCUMENT ATTACHMENT ENDPOINTS
// ===================================================

export const getWorkOrderAttachments = async (workOrderId, params = {}) => {
  const response = await api.get(`/work-orders/${workOrderId}/attachments`, { params });
  return response.data;
};

export const getWorkOrderAttachmentById = async (workOrderId, attachmentId) => {
  const response = await api.get(`/work-orders/${workOrderId}/attachments/${attachmentId}`);
  return response.data;
};

export const uploadWorkOrderAttachment = async (workOrderId, formData) => {
  const response = await api.post(`/work-orders/${workOrderId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const replaceWorkOrderAttachment = async (workOrderId, attachmentId, formData) => {
  const response = await api.post(`/work-orders/${workOrderId}/attachments/${attachmentId}/replace`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateWorkOrderAttachmentMetadata = async (workOrderId, attachmentId, metadata) => {
  const response = await api.patch(`/work-orders/${workOrderId}/attachments/${attachmentId}`, metadata);
  return response.data;
};

export const deleteWorkOrderAttachment = async (workOrderId, attachmentId) => {
  const response = await api.delete(`/work-orders/${workOrderId}/attachments/${attachmentId}`);
  return response.data;
};

export const downloadWorkOrderAttachment = async (workOrderId, attachmentId, fileName, version = null) => {
  try {
    const params = { download: 'true' };
    if (version) params.version = version;

    const response = await api.get(`/work-orders/${workOrderId}/attachments/${attachmentId}/download`, {
      params,
      responseType: 'blob'
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'work_order_document';
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json.message) error.message = json.message;
      } catch (e) {
        // fallback
      }
    }
    throw error;
  }
};

export const previewWorkOrderAttachment = async (workOrderId, attachmentId, version = null) => {
  try {
    const params = { download: 'false' };
    if (version) params.version = version;

    const response = await api.get(`/work-orders/${workOrderId}/attachments/${attachmentId}/download`, {
      params,
      responseType: 'blob'
    });

    const contentType = response.headers['content-type'] || 'application/pdf';
    const blob = new Blob([response.data], { type: contentType });
    const blobUrl = window.URL.createObjectURL(blob);
    return { blobUrl, contentType };
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json.message) error.message = json.message;
      } catch (e) {
        // fallback
      }
    }
    throw error;
  }
};

