import api from './api';

export const getFlangeDesigns = async (params = {}) => {
  const response = await api.get('/drawing-master', { params: { ...params, drawingType: 'FLANGE' } });
  const drawings = response.data?.drawings || [];
  const flangeDesigns = drawings.map(d => ({
    ...d,
    designCode: d.drawingCode || d.designCode,
    designName: d.drawingName || d.designName,
    referenceImage: d.fileUrl || d.referenceImage,
    referenceDrawing: d.fileUrl || d.referenceDrawing,
    constructionType: d.constructionType || 'FLANGE'
  }));
  return {
    ...response.data,
    flangeDesigns
  };
};

export const getFlangeDesignById = async (id) => {
  const response = await api.get(`/drawing-master/${id}`);
  const d = response.data?.drawing;
  return {
    ...response.data,
    flangeDesign: d ? {
      ...d,
      designCode: d.drawingCode || d.designCode,
      designName: d.drawingName || d.designName,
      referenceImage: d.fileUrl || d.referenceImage,
      referenceDrawing: d.fileUrl || d.referenceDrawing,
      constructionType: d.constructionType || 'FLANGE'
    } : null
  };
};

export const createFlangeDesign = async (data) => {
  const response = await api.post('/drawing-master', { ...data, drawingType: 'FLANGE' });
  return response.data;
};

export const updateFlangeDesign = async (id, data) => {
  const response = await api.put(`/drawing-master/${id}`, { ...data, drawingType: 'FLANGE' });
  return response.data;
};

export const updateFlangeDesignStatus = async (id, status) => {
  const response = await api.patch(`/drawing-master/${id}/status`, { status });
  return response.data;
};

export const deleteFlangeDesign = async (id) => {
  const response = await api.delete(`/drawing-master/${id}`);
  return response.data;
};
