import { api, withQuery } from './api.js';

export const employeesService = {
  getAll:   (params) => api.get(withQuery('/employees', params)),
  getById:  (id)    => api.get(`/employees/${id}`),
  create:   (data)  => api.post('/employees', data),
  update:   (id, data) => api.put(`/employees/${id}`, data),
  delete:   (id)    => api.delete(`/employees/${id}`),
};

export default employeesService;
