import { api, withQuery } from './api.js';

export const decisionsService = {
  getAll: (params) => api.get(withQuery('/decisions', params)),
  create: (data)   => api.post('/decisions', data),
};

export default decisionsService;
