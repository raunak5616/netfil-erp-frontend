import api from './api';

// Header API Endpoints
export const getSalesOrders = async (params = {}) => {
  const response = await api.get('/sales-orders', { params });
  return response.data;
};

export const getSalesOrderById = async (salesOrderId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}`);
  return response.data;
};

export const createSalesOrder = async (salesOrderData) => {
  const response = await api.post('/sales-orders', salesOrderData);
  return response.data;
};

export const compareQuotationChanges = async (comparisonPayload) => {
  const response = await api.post('/sales-orders/compare-quotation', comparisonPayload);
  return response.data;
};

export const updateSalesOrder = async (salesOrderId, salesOrderData) => {
  const response = await api.put(`/sales-orders/${salesOrderId}`, salesOrderData);
  return response.data;
};

export const updateSalesOrderStatus = async (salesOrderId, status) => {
  const response = await api.patch(`/sales-orders/${salesOrderId}/status`, { status });
  return response.data;
};

export const getSalesOrderReferences = async (salesOrderId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/references`);
  return response.data;
};

// Item API Endpoints
export const getSalesOrderItems = async (salesOrderId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/items`);
  return response.data;
};

export const addSalesOrderItem = async (salesOrderId, itemData) => {
  const response = await api.post(`/sales-orders/${salesOrderId}/items`, itemData);
  return response.data;
};

export const updateSalesOrderItem = async (salesOrderId, itemId, itemData) => {
  const response = await api.put(`/sales-orders/${salesOrderId}/items/${itemId}`, itemData);
  return response.data;
};

export const deleteSalesOrderItem = async (salesOrderId, itemId) => {
  const response = await api.delete(`/sales-orders/${salesOrderId}/items/${itemId}`);
  return response.data;
};

// Drawing Endpoints
export const getSalesOrderDrawingsConfig = async (salesOrderId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/drawings/config`);
  return response.data;
};

export const updateSalesOrderItemDrawingConfig = async (salesOrderId, itemId, configData) => {
  const response = await api.put(`/sales-orders/${salesOrderId}/items/${itemId}/drawing-config`, configData);
  return response.data;
};

export const getSalesOrderItemDrawing = async (salesOrderId, itemId, download = false) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/items/${itemId}/drawing`, {
    params: download ? { download: 'true' } : {},
    responseType: 'blob'
  });
  return response.data;
};

export const getSalesOrderDrawings = async (salesOrderId, download = false) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/drawings`, {
    params: download ? { download: 'true' } : {},
    responseType: 'blob'
  });
  return response.data;
};

// ===================================================
// DOCUMENT ATTACHMENT ENDPOINTS
// ===================================================

export const getSalesOrderAttachments = async (salesOrderId, params = {}) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/attachments`, { params });
  return response.data;
};

export const getSalesOrderAttachmentById = async (salesOrderId, attachmentId) => {
  const response = await api.get(`/sales-orders/${salesOrderId}/attachments/${attachmentId}`);
  return response.data;
};

export const uploadSalesOrderAttachment = async (salesOrderId, formData) => {
  const response = await api.post(`/sales-orders/${salesOrderId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const replaceSalesOrderAttachment = async (salesOrderId, attachmentId, formData) => {
  const response = await api.post(`/sales-orders/${salesOrderId}/attachments/${attachmentId}/replace`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateSalesOrderAttachmentMetadata = async (salesOrderId, attachmentId, metadata) => {
  const response = await api.patch(`/sales-orders/${salesOrderId}/attachments/${attachmentId}`, metadata);
  return response.data;
};

export const deleteSalesOrderAttachment = async (salesOrderId, attachmentId) => {
  const response = await api.delete(`/sales-orders/${salesOrderId}/attachments/${attachmentId}`);
  return response.data;
};

export const downloadSalesOrderAttachment = async (salesOrderId, attachmentId, fileName, version = null) => {
  try {
    const params = { download: 'true' };
    if (version) params.version = version;

    const response = await api.get(`/sales-orders/${salesOrderId}/attachments/${attachmentId}/download`, {
      params,
      responseType: 'blob'
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'attachment_document';
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

export const previewSalesOrderAttachment = async (salesOrderId, attachmentId, version = null) => {
  try {
    const params = { download: 'false' };
    if (version) params.version = version;

    const response = await api.get(`/sales-orders/${salesOrderId}/attachments/${attachmentId}/download`, {
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
