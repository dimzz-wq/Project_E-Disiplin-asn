import { api, API_URL } from './api.js';

export const documentsService = {
  upload: (formData) => api.upload('/documents/upload', formData),
  download: (id) => `${API_URL}/documents/${id}?download=1`,
  getById: (id) => api.get(`/documents/${id}`),
};

export default documentsService;
