import { apiRequest } from './client';

export async function login(username, password) {
  return apiRequest('/auth/login', { method: 'POST', body: { username, password }, auth: false });
}

export async function me() {
  return apiRequest('/auth/me');
}
