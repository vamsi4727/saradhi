import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { adminApi } from '../services/adminApi';

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'this_month', label: 'This month' },
  { value: '30d', label: 'Last 30 days' },
  { value: '7d', label: 'Last 7 days' },
];

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export default function TokenAnalytics() {
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .get('/analytics/tokens', { params: { period } })
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-admin-muted">Loading...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-admin-muted">
        Failed to load analytics
      </div>
    );
  }

  const dailyChart = (data.daily || []).map((d) => ({
    ...d,
    date: format(typeof d.date === 'string' ? parseISO(d.date) : new Date(d.date), 'MMM d'),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Token & Cost Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-admin-surface border border-admin-border rounded-xl p-4">
          <p className="text-admin-muted text-sm">Total Cost</p>
          <p className="text-2xl font-mono font-bold">₹{data.total_cost_inr?.toFixed(2) ?? '0'}</p>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-xl p-4">
          <p className="text-admin-muted text-sm">Avg per Query</p>
          <p className="text-2xl font-mono font-bold">₹{data.avg_cost_per_query?.toFixed(4) ?? '0'}</p>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-xl p-4">
          <p className="text-admin-muted text-sm">Total Queries</p>
          <p className="text-2xl font-mono font-bold">{data.total_queries?.toLocaleString() ?? '0'}</p>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-xl p-4">
          <p className="text-admin-muted text-sm">Total Tokens</p>
          <p className="text-2xl font-mono font-bold">
            {data.total_tokens ? (data.total_tokens / 1e6).toFixed(2) + 'M' : '0'}
          </p>
        </div>
      </div>

      {dailyChart.length > 0 && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Daily Cost</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4d" />
                <XAxis dataKey="date" stroke="#6b7c93" fontSize={12} />
                <YAxis stroke="#6b7c93" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #2d3a4d' }}
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Cost']}
                />
                <Bar dataKey="cost_inr" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {data.by_feature?.length > 0 && (
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">By Feature</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.by_feature}
                    dataKey="cost_inr"
                    nameKey="feature"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ feature, pct }) => `${feature} ${pct.toFixed(0)}%`}
                  >
                    {data.by_feature.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #2d3a4d' }}
                    formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Cost']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {data.by_plan?.length > 0 && (
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">By Plan</h2>
            <div className="space-y-3">
              {data.by_plan.map((p) => (
                <div key={p.plan} className="flex items-center gap-3">
                  <div
                    className="h-3 rounded-full bg-admin-border"
                    style={{ width: `${Math.min(p.pct, 100)}%`, minWidth: 4, backgroundColor: COLORS[0] }}
                  />
                  <span className="text-sm w-16">{p.plan}</span>
                  <span className="font-mono text-sm">₹{p.cost_inr?.toFixed(2)} ({p.pct?.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.projection && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Cost Projection</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-admin-muted">Spent so far</p>
              <p className="font-mono font-bold">₹{data.projection.current_spend?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-admin-muted">Projected monthly</p>
              <p className="font-mono font-bold">₹{data.projection.projected_monthly?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-admin-muted">Pro revenue (12×₹299)</p>
              <p className="font-mono font-bold">₹{data.projection.pro_revenue?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-admin-muted">Net position</p>
              <p className={`font-mono font-bold ${(data.projection.net ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{data.projection.net?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {data.top_users?.length > 0 && (
        <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
          <h2 className="text-lg font-medium p-4 border-b border-admin-border">Top Users This Period</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">User</th>
                <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Queries</th>
                <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Cost</th>
                <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Plan</th>
              </tr>
            </thead>
            <tbody>
              {data.top_users.map((u) => (
                <tr key={u.email_masked} className="border-b border-admin-border/50">
                  <td className="py-3 px-4 font-mono text-sm">{u.email_masked}</td>
                  <td className="py-3 px-4">{u.queries}</td>
                  <td className="py-3 px-4 font-mono">₹{u.cost_inr?.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm">{u.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
