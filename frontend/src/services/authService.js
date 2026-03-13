import { api } from './api';

export const authService = {
  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    return data.user;
  },

  logout: async () => {
    await api.post('/api/auth/logout');
  },

  getGoogleLoginUrl: () => {
    const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    return `${base}/api/auth/google`;
  },
};
