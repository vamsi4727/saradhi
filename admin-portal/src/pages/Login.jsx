import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAdminAuthStore } from '../store/adminAuthStore';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAdminAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-admin-surface border border-admin-border rounded-xl p-8 shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-admin-accent" strokeWidth={1.75} />
            <h1 className="text-2xl font-bold font-mono">
              Saaradhi Admin
            </h1>
          </div>
          <p className="text-admin-muted text-sm text-center mb-6">
            Enter password to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 bg-admin-bg border border-admin-border rounded-lg text-gray-100 placeholder-admin-muted focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-transparent"
            />
            {error && (
              <p className="text-admin-danger text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-admin-accent hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-admin-muted text-xs text-center mt-4">
          Session expires in 8 hours
        </p>
      </div>
    </div>
  );
}
