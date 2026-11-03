import { AdminService } from '@/lib/AdminService';
import { apiClient } from '@/lib/apiClient';

export const categoryService = {
  list: () => AdminService.list('categories'),
  get: (id) => apiClient(`categories/${id}`),
};
