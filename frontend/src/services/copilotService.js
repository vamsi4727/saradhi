import { api } from './api';

export const copilotService = {
  query: async (message, sessionId) => {
    const { data } = await api.post('/api/copilot/query', { message, session_id: sessionId });
    return data;
  },

  getUsage: async () => {
    const { data } = await api.get('/api/copilot/usage');
    return data;
  },
};
