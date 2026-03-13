import { create } from 'zustand';
import { adminApi } from '../services/adminApi.js';

export const useAdminAuthStore = create((set) => ({
  authenticated: null,
  loading: true,

  checkAuth: async () => {
    set({ loading: true });
    try {
      await adminApi.get('/auth/check');
      set({ authenticated: true, loading: false });
      return true;
    } catch {
      set({ authenticated: false, loading: false });
      return false;
    }
  },

  login: async (password) => {
    const { data } = await adminApi.post('/auth/login', { password });
    set({ authenticated: true });
    return data;
  },

  logout: async () => {
    await adminApi.post('/auth/logout');
    set({ authenticated: false });
  },
}));
