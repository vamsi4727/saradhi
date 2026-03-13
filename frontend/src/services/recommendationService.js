import { api } from './api';

export const recommendationService = {
  getRecommendations: async () => {
    const { data } = await api.get('/api/recommendations');
    return {
      recommendations: data.recommendations || [],
      hasProfile: !!data.has_profile,
      status: data.status || 'ready',
      message: data.message,
    };
  },

  getRecommendation: async (id) => {
    const { data } = await api.get(`/api/recommendations/${id}`);
    return data;
  },
};
