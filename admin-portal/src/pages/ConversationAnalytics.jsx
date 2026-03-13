import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminApi } from '../services/adminApi';

export default function ConversationAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .get('/analytics/conversations')
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

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

  const maxFunnel = Math.max(...(data.onboarding_funnel || []).map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conversation Analytics</h1>

      {data.onboarding_funnel?.length > 0 && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Onboarding Funnel</h2>
          <div className="space-y-3">
            {data.onboarding_funnel.map((step) => (
              <div key={step.turn} className="flex items-center gap-4">
                <span className="w-24 text-sm">Turn {step.turn}</span>
                <div className="flex-1 h-6 bg-admin-bg rounded overflow-hidden">
                  <div
                    className="h-full bg-admin-accent rounded transition-all"
                    style={{ width: `${(step.count / maxFunnel) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono text-sm">
                  {step.count} ({step.pct?.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
          {data.avg_turns_onboarding > 0 && (
            <p className="mt-4 text-admin-muted text-sm">
              Avg turns to complete: {data.avg_turns_onboarding?.toFixed(1)}
            </p>
          )}
          {data.common_dropoff_turn && (
            <p className="text-amber-400 text-sm">
              Most common drop-off: After turn {data.common_dropoff_turn}
            </p>
          )}
        </div>
      )}

      {data.copilot_depth_distribution?.length > 0 && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Co-Pilot Session Depth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.copilot_depth_distribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4d" />
                <XAxis dataKey="bucket" stroke="#6b7c93" fontSize={12} />
                <YAxis stroke="#6b7c93" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #2d3a4d' }}
                  formatter={(value, name, props) => [
                    `${value} (${props.payload.pct?.toFixed(1)}%)`,
                    'Sessions',
                  ]}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(!data.onboarding_funnel?.length && !data.copilot_depth_distribution?.length) && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-12 text-center text-admin-muted">
          No conversation data yet. Data appears when users complete onboarding or use Co-Pilot.
        </div>
      )}
    </div>
  );
}
