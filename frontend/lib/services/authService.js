import { apiClient } from '@/lib/apiClient';
import { clearAuthToken, setAuthToken } from '@/lib/cookieHelper';

export const authService = {
  async login(email, password, admin = false) {
    const result = await apiClient(admin ? 'login-admin' : 'login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.token) setAuthToken(result.token);
    return result;
  },

  async register(values) {
    const result = await apiClient('register', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    clearAuthToken();
    return result;
  },

  async logout() {
    await apiClient('logout', { method: 'POST' });
    clearAuthToken();
  },

  currentUser() {
    return apiClient('me');
  },
};
