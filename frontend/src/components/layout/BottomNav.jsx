import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, User, Crown } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'For You', Icon: LayoutDashboard },
  { to: '/copilot', label: 'Co-Pilot', Icon: MessageCircle },
  { to: '/profile', label: 'Profile', Icon: User },
  { to: '/subscription', label: 'Pro', Icon: Crown },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around max-w-md mx-auto z-10">
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors duration-150 ${
              isActive ? 'text-brand-500 font-medium' : 'text-gray-500'
            }`
          }
        >
          <Icon className="w-6 h-6 mb-0.5" strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
