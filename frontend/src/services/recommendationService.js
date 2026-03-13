import { api } from './api';

export const recommendationService = {
  getRecommendations: async () => {
    const { data } = await api.get('/api/recommendations');
    return data.recommendations || [];
  },

  getRecommendation: async (id) => {
    const { data } = await api.get(`/api/recommendations/${id}`);
    return data;
  },
};
