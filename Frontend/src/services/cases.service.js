import { api, withQuery } from './api.js';

export const casesService = {
  getAll:       (params)     => api.get(withQuery('/cases', params)),
  getById:      (id)         => api.get(`/cases/${id}`),
  create:       (data)       => api.post('/cases', data),
  updateStatus: (id, data)   => api.patch(`/cases/${id}/status`, data),
  addTimeline:  (id, data)   => api.post(`/cases/${id}/timeline`, data),
};

export default casesService;
