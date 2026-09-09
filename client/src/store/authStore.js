import { create } from 'zustand';
import api from '../services/api';
import { joinUserRoom } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: () => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('agentflow_token');
        const userStr = localStorage.getItem('agentflow_user');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          set({ token, user, isAuthenticated: true, isLoading: false });
          joinUserRoom(user.id || user._id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse cached auth:', e);
      }
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({ token, user, isAuthenticated: true, isLoading: false, error: null });
      joinUserRoom(user.id || user._id);
      return { success: true };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  register: async (name, email, password, role = 'operator') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { token, user } = response.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({ token, user, isAuthenticated: true, isLoading: false, error: null });
      joinUserRoom(user.id || user._id);
      return { success: true };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
    }
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  fetchMe: async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (e) {
      // ignore
    }
  },
}));
