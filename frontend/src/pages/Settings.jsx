import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-semibold text-gray-900 text-lg">Settings</h2>
      <button
        onClick={handleLogout}
        className="w-full py-3 border border-bear text-bear rounded-xl font-sans font-medium hover:bg-red-50 transition-colors"
      >
        Log out
      </button>
    </div>
  );
}
