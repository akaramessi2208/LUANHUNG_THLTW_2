import { apiClient } from '@/lib/apiClient';

export const ClientService = {
  request: apiClient,
  getCategories: () => apiClient('categories'),
  getBrands: () => apiClient('brands'),
  getPaymentMethods: () => apiClient('storefront/payment-methods'),
  getCartProducts: (ids) => apiClient(`storefront/cart/products?ids=${ids.join(',')}`),
  submitContact: (values) => apiClient('storefront/contact', {
    method: 'POST',
    body: JSON.stringify(values),
  }),
  submitReview: (slug, values) => apiClient(`storefront/products/${slug}/reviews`, {
    method: 'POST',
    body: JSON.stringify(values),
  }),
};
