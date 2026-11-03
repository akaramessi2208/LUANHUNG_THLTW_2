import { apiClient } from '@/lib/apiClient';

export const AdminService = {
  list(resource, { mode = 'list', page = 1, perPage = 10, q = '', status = '', from = '', to = '' } = {}) {
    const endpoint = mode === 'trash' ? `${resource}/trash` : resource;
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (q) query.set('q', q);
    if (status) query.set('status', status);
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return apiClient(`${endpoint}?${query.toString()}`);
  },

  save(resource, id, payload) {
    if (resource === 'orders') {
      return apiClient(`orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }
    if (id) {
      const method = ['users', 'contacts', 'reviews'].includes(resource) ? 'PATCH' : 'PUT';
      return apiClient(`${resource}/${id}`, { method, body: JSON.stringify(payload) });
    }
    return apiClient(resource, { method: 'POST', body: JSON.stringify(payload) });
  },

  updatePaymentStatus(orderId, paymentStatus) {
    return apiClient(`orders/${orderId}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
  },

  createPaymentLink(orderId) {
    return apiClient(`orders/${orderId}/payment-link`, { method: 'POST' });
  },

  delete(resource, id) {
    return apiClient(`${resource}/${id}`, { method: 'DELETE' });
  },

  restore(resource, id) {
    return apiClient(`${resource}/${id}/restore`, { method: 'POST' });
  },

  permanentlyDelete(resource, id) {
    return apiClient(`${resource}/force-delete/${id}`, { method: 'DELETE' });
  },

  async uploadImage(file) {
    const data = new FormData();
    data.append('file', file);
    return apiClient('uploads', { method: 'POST', body: data });
  },
};
