import { useAuthStore } from '../../store/authStore';
import { TrendingUp } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-serif font-semibold text-brand-700 text-lg">Saaradhi</span>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase">{user.plan}</span>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center font-mono text-sm font-medium text-brand-700">
                {user.name?.[0] || user.email?.[0] || '?'}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
