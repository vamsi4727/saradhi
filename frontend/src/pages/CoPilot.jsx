import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { copilotService } from '../services/copilotService';
import ChatBubble from '../components/onboarding/ChatBubble';
import ChatInput from '../components/onboarding/ChatInput';

export default function CoPilot() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ used: 0, limit: 5 });
  const [quickPrompts, setQuickPrompts] = useState([]);

  useEffect(() => {
    copilotService.getUsage().then(setUsage).catch(() => {});
    copilotService.getQuickQuestions().then(setQuickPrompts).catch(() => {});
  }, []);

  const handleSend = async (message) => {
    if (!message.trim() || loading) return;

    setMessages((m) => [...m, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const { data } = await api.post('/api/copilot/query', {
        message,
        session_id: sessionId,
      });

      setSessionId(data.session_id);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      setUsage((u) => ({ ...u, used: u.used + 1 }));
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages((m) => [...m, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-semibold text-gray-900 text-lg">Co-Pilot</h2>
      <p className="font-sans text-sm text-gray-500">
        {usage.used} / {usage.limit} queries today
      </p>

      {messages.length === 0 && (
        <div className="space-y-3">
          <p className="font-sans text-sm text-gray-600">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickPrompt(q)}
                className="text-left px-3 py-2 bg-white border border-border rounded-xl text-sm hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
      </div>

      {usage.used < usage.limit && (
        <ChatInput onSend={handleSend} disabled={loading} placeholder="Ask about stocks, MFs, market..." />
      )}

      {usage.used >= usage.limit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-sans text-sm text-amber-800">
            Daily limit reached. Upgrade to Pro for unlimited queries.
          </p>
          <a
            href="/subscription"
            className="inline-block mt-2 text-saffron-600 font-medium hover:underline"
          >
            Upgrade to Pro →
          </a>
        </div>
      )}
    </div>
  );
}
