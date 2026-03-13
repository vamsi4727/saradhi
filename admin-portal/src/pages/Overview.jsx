import { useEffect, useState } from 'react';
import { FileText, Coins, Users } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.get('/logs?limit=1').then((r) => r.data),
      adminApi.get('/analytics/tokens').then((r) => r.data),
      adminApi.get('/users').then((r) => r.data),
    ])
      .then(([logs, tokens, users]) => {
        setStats({
          totalQueries: tokens.total_queries ?? 0,
          totalCost: tokens.total_cost_inr ?? 0,
          totalUsers: users.total ?? 0,
        });
      })
      .catch(() => setStats({ totalQueries: 0, totalCost: 0, totalUsers: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-admin-muted">Loading...</span>
      </div>
    );
  }

  const cards = [
    { label: 'Total Queries', value: stats?.totalQueries?.toLocaleString() ?? '0', Icon: FileText },
    { label: 'Total Cost (₹)', value: stats?.totalCost?.toFixed(2) ?? '0', Icon: Coins },
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '0', Icon: Users },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="bg-admin-surface border border-admin-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-6 h-6 text-admin-accent shrink-0" strokeWidth={1.75} />
              <span className="text-admin-muted text-sm">{label}</span>
            </div>
            <p className="text-2xl font-mono font-bold">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-admin-muted text-sm mt-6">
        Key stats at a glance. Use the sidebar to explore logs, analytics, and user management.
      </p>
    </div>
  );
}
