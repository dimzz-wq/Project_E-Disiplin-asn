import { api, withQuery } from './api.js';

export const reportsService = {
  getAll:  (params) => api.get(withQuery('/reports', params)),
  getById: (id)     => api.get(`/reports/${id}`),
  create:  (data)   => api.post('/reports', data),
  update:  (id, data) => api.patch(`/reports/${id}`, data),
};

export default reportsService;
