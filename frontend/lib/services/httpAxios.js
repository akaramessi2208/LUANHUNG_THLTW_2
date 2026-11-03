import { getAuthToken } from '@/lib/cookieHelper';

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function httpAxios(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`/api/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!(options.body instanceof FormData) && options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const errors = result?.errors ? Object.values(result.errors).flat().join(' ') : '';
    throw new ApiError(errors || result?.message || `Yêu cầu thất bại (${response.status}).`, response.status);
  }
  return result;
}

export default httpAxios;
