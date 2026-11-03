import { AdminService } from '@/lib/AdminService';
import { apiClient } from '@/lib/apiClient';

export const userService = {
  list: (options) => AdminService.list('users', options),
  get: (id) => apiClient(`users/${id}`),
  update: (id, user) => AdminService.save('users', id, user),
  createAdmin: (user) => apiClient('users/admin', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
};
