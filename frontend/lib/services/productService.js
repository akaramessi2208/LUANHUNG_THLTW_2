import { AdminService } from '@/lib/AdminService';
import { apiClient } from '@/lib/apiClient';

export const productService = {
  list: (options) => AdminService.list('products', options),
  get: (id) => apiClient(`products/${id}`),
  create: (product) => AdminService.save('products', null, product),
  update: (id, product) => AdminService.save('products', id, product),
  delete: (id) => AdminService.delete('products', id),
};
