import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  Coins,
  MessageSquare,
  Users,
  Activity,
  Shield,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Overview', Icon: LayoutDashboard },
  { to: '/prompts', label: 'Prompt Studio', Icon: PenSquare },
  { to: '/logs', label: 'Query Logs', Icon: FileText },
  { to: '/analytics/tokens', label: 'Token Analytics', Icon: Coins },
  { to: '/analytics/conversations', label: 'Conversation Analytics', Icon: MessageSquare },
  { to: '/users', label: 'User Management', Icon: Users },
  { to: '/health', label: 'System Health', Icon: Activity },
];

export default function AdminSidebar() {
  return (
    <aside className="w-56 bg-admin-surface border-r border-admin-border flex flex-col">
      <div className="p-4 border-b border-admin-border flex items-center gap-2">
        <Shield className="w-5 h-5 text-admin-accent shrink-0" />
        <h1 className="font-mono font-bold text-lg">Saaradhi Admin</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-admin-accent/20 text-admin-accent'
                  : 'text-admin-muted hover:bg-admin-border/50 hover:text-gray-200'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
