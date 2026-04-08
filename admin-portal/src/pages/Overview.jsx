import { useEffect, useState } from 'react';
import { FileText, Coins, Users } from 'lucide-react';
import { adminApi } from '../services/adminApi';

const thisMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.get('/analytics/tokens', { params: { period: 'all' } }).then((r) => r.data),
      adminApi.get('/analytics/tokens', { params: { period: 'this_month' } }).then((r) => r.data),
      adminApi.get('/users').then((r) => r.data),
    ])
      .then(([allTime, thisMonthData, users]) => {
        setStats({
          totalQueries: allTime.total_queries ?? 0,
          totalCost: allTime.total_cost_inr ?? 0,
          totalUsers: users.total ?? 0,
          monthQueries: thisMonthData.total_queries ?? 0,
          monthCost: thisMonthData.total_cost_inr ?? 0,
        });
      })
      .catch(() => setStats({ totalQueries: 0, totalCost: 0, totalUsers: 0, monthQueries: 0, monthCost: 0 }))
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
    { label: 'Total Queries', sub: 'All time', value: stats?.totalQueries?.toLocaleString() ?? '0', Icon: FileText },
    { label: 'Total Cost (₹)', sub: 'All time', value: Number(stats?.totalCost ?? 0).toFixed(2), Icon: Coins },
    { label: 'Total Users', sub: 'Registered', value: stats?.totalUsers?.toLocaleString() ?? '0', Icon: Users },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, sub, value, Icon }) => (
          <div
            key={label}
            className="bg-admin-surface border border-admin-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-1">
              <Icon className="w-6 h-6 text-admin-accent shrink-0" strokeWidth={1.75} />
              <span className="text-admin-muted text-sm">{label}</span>
            </div>
            <p className="text-2xl font-mono font-bold">{value}</p>
            <p className="text-admin-muted text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-admin-surface border border-admin-border rounded-xl p-5">
        <p className="text-admin-muted text-xs uppercase tracking-wider mb-3">{thisMonth}</p>
        <div className="flex gap-8">
          <div>
            <p className="text-lg font-mono font-bold">{stats?.monthQueries?.toLocaleString() ?? '0'}</p>
            <p className="text-admin-muted text-xs">Queries this month</p>
          </div>
          <div>
            <p className="text-lg font-mono font-bold">₹{Number(stats?.monthCost ?? 0).toFixed(2)}</p>
            <p className="text-admin-muted text-xs">Cost this month</p>
          </div>
        </div>
      </div>

      <p className="text-admin-muted text-sm mt-4">
        Key stats at a glance. Use the sidebar to explore logs, analytics, and user management.
      </p>
    </div>
  );
}
