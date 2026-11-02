import { api, withQuery } from './api.js';

export const examinationsService = {
  getAll: (params) => api.get(withQuery('/examinations', params)),
  create: (data) => api.post('/examinations', data),
};

export default examinationsService;
