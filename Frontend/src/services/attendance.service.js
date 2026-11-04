import { api, withQuery } from './api.js';

export const attendanceService = {
  getAll: (params) => api.get(withQuery('/attendance', params)),
  getSummary: () => api.get('/attendance/summary'),
  record: (data) => api.post('/attendance', data),
};

export default attendanceService;
