import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser().then((u) => {
      if (u) navigate('/dashboard');
    });
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-sans text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-serif text-3xl font-semibold text-brand-900">Saaradhi</span>
        </div>
        <h1 className="font-serif text-4xl font-semibold text-brand-900 text-center mb-4">
          Your Financial Co-Pilot
        </h1>
        <p className="font-sans text-gray-600 text-center mb-8 leading-relaxed">
          AI-powered investment insights for Indian retail investors. Get personalized
          recommendations, ask questions in plain English, and invest with confidence.
        </p>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-sans font-semibold py-3.5 rounded-xl transition-colors duration-150"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
