const authTokenKey = 'authToken';

export function getAuthToken() {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(authTokenKey);
}

export function setAuthToken(token) {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(authTokenKey, token);
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(authTokenKey);
}
