import { AdminService } from '@/lib/AdminService';
import { apiClient } from '@/lib/apiClient';

export const brandService = {
  list: () => AdminService.list('brands'),
  get: (id) => apiClient(`brands/${id}`),
};
