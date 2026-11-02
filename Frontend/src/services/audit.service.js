import { api, withQuery } from './api.js';

export const auditService = {
  getAll: (params) => api.get(withQuery('/audit-logs', params)),
};

export default auditService;
