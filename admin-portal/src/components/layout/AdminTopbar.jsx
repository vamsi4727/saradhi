import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/adminAuthStore';

export default function AdminTopbar() {
  const logout = useAdminAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-admin-border flex items-center justify-between px-6 bg-admin-surface/50">
      <span className="text-admin-muted text-sm font-mono">
        saradhi-admin.katakam.in
      </span>
      <button
        onClick={handleLogout}
        className="text-admin-muted hover:text-gray-200 text-sm transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
