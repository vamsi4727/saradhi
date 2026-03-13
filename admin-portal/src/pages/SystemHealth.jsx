import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { Activity, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    adminApi
      .get('/health')
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-admin-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Health</h1>
        <div className="flex items-center gap-2 text-admin-muted text-sm">
          <Activity className="w-4 h-4 animate-pulse" />
          Auto-refresh 60s
        </div>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Service</th>
              <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Status</th>
              <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Latency</th>
            </tr>
          </thead>
          <tbody>
            {(data?.services || []).map((svc) => (
              <tr key={svc.name} className="border-b border-admin-border/50">
                <td className="py-3 px-4 font-mono text-sm">{svc.name}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 ${
                    svc.status === 'online' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {svc.status === 'online' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {svc.status === 'online' ? 'Online' : 'Error'}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-sm">
                  {svc.latency_p50_ms != null ? `${svc.latency_p50_ms}ms` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.services || data.services.length === 0) && (
          <div className="p-8 text-center text-admin-muted">
            No service data available
          </div>
        )}
      </div>

      {data?.recent_errors?.length > 0 && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Recent Errors</h2>
          <div className="space-y-2">
            {data.recent_errors.map((err) => (
              <div
                key={err.log_id}
                className="flex items-start gap-3 py-2 border-b border-admin-border/50 last:border-0"
              >
                <span className="font-mono text-xs text-admin-muted shrink-0">
                  {err.time ? format(new Date(err.time), 'HH:mm') : '—'}
                </span>
                <span className="text-sm">{err.service}</span>
                <span className="text-admin-muted text-sm truncate flex-1">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && !data.recent_errors?.length && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-8 text-center text-admin-muted">
          No recent errors
        </div>
      )}
    </div>
  );
}
