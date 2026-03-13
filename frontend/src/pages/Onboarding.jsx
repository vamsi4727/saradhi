import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ChatBubble from '../components/onboarding/ChatBubble';
import ChatInput from '../components/onboarding/ChatInput';
import ProfileSummaryCard from '../components/onboarding/ProfileSummaryCard';

export default function Onboarding() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [extractedProfile, setExtractedProfile] = useState(null);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Namaste! I'm Saaradhi, your financial co-pilot. To personalize your recommendations, I'll ask you a few quick questions:\n\n" +
            "1. Investment goal — What are you investing for? (e.g., retirement, child's education, buying a house)\n" +
            "2. Risk appetite — Conservative, moderate, or aggressive?\n" +
            "3. Time horizon — How many years can you stay invested?\n" +
            "4. Monthly budget — How much can you invest each month?\n\n" +
            "Let's start — what's your main investment goal?",
        },
      ]);
    }
  }, []);

  const handleSend = async (message) => {
    if (!message.trim() || loading) return;

    setMessages((m) => [...m, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const { data } = await api.post('/api/onboarding/chat', {
        message,
        session_id: sessionId,
        history: messages,
      });

      setSessionId(data.session_id);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);

      if (data.extracted_profile) {
        setExtractedProfile(data.extracted_profile);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!consented || !extractedProfile) return;

    try {
      await api.post('/api/user/profile', extractedProfile);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-semibold text-gray-900 text-lg">Let's get to know you</h2>

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
      </div>

      {extractedProfile && (
        <ProfileSummaryCard profile={extractedProfile} />
      )}

      {extractedProfile && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500"
          />
          <span className="font-sans text-xs text-gray-500 leading-relaxed">
            I understand that Saaradhi's recommendations are AI-generated research insights
            for educational purposes only. They are <strong>not SEBI-registered financial advice</strong>.
            I will not make investment decisions solely based on this platform.
          </span>
        </label>
      )}

      {extractedProfile && consented && (
        <button
          onClick={handleConfirm}
          className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-sans font-semibold py-3.5 rounded-xl transition-colors duration-150"
        >
          Save & Continue →
        </button>
      )}

      {!extractedProfile && (
        <ChatInput onSend={handleSend} disabled={loading} placeholder="Type your message..." />
      )}
    </div>
  );
}
