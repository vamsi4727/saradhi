import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

export default function QueryLogs() {
  const handleExport = () => {
    const url = `${adminApi.defaults.baseURL}/logs/export`;
    fetch(url, { credentials: 'include' })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'query-logs.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert('Export failed'));
  };
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    adminApi
      .get('/logs', { params: { page, limit } })
      .then(({ data }) => {
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const pages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Query Logs</h1>
        <div className="flex items-center gap-4">
          <span className="text-admin-muted text-sm">{total} queries total</span>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-admin-border/50 hover:bg-admin-border rounded text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-admin-muted">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-admin-muted">
            No query logs yet. Logs appear when users interact with Co-Pilot, onboarding, or recommendations.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-border">
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Time</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">User</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Feature</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Turn</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Tokens</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-admin-border/50 hover:bg-admin-border/20"
                    >
                      <td className="py-3 px-4 font-mono text-sm">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleTimeString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm">{log.user_masked ?? '—'}</td>
                      <td className="py-3 px-4 text-sm">{log.feature ?? '—'}</td>
                      <td className="py-3 px-4 text-sm">{log.turn ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-sm">{log.total_tokens ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {log.cost_inr != null ? `₹${log.cost_inr.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border">
                <span className="text-admin-muted text-sm">
                  Page {page} of {pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded bg-admin-border/50 disabled:opacity-50 text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="px-3 py-1 rounded bg-admin-border/50 disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
