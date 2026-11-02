import { api, withQuery } from './api.js';

export const decisionsService = {
  getAll: (params) => api.get(withQuery('/decisions', params)),
};

export default decisionsService;
