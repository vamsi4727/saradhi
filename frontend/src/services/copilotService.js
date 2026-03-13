import { api } from './api';

const FALLBACK_QUESTIONS = [
  "Summarize Tata Motors' latest earnings",
  'Compare HDFC Bank vs ICICI Bank for 5 years',
  'Best SIP options for ₹5,000/month?',
  'Is Nifty 50 overvalued right now?',
  'Explain P/E ratio in simple terms',
];

export const copilotService = {
  query: async (message, sessionId) => {
    const { data } = await api.post('/api/copilot/query', { message, session_id: sessionId });
    return data;
  },

  getUsage: async () => {
    const { data } = await api.get('/api/copilot/usage');
    return data;
  },

  getQuickQuestions: async () => {
    try {
      const { data } = await api.get('/api/copilot/quick-questions');
      return data.questions?.length ? data.questions : FALLBACK_QUESTIONS;
    } catch {
      return FALLBACK_QUESTIONS;
    }
  },
};
