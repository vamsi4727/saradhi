import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../services/adminApi';
import { format } from 'date-fns';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const limit = 20;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit };
    if (planFilter) params.plan = planFilter;
    if (search) params.search = search;
    adminApi
      .get('/users', { params })
      .then(({ data }) => {
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setUsers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, planFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers, search]);

  const fetchDetail = (id) => {
    setSelectedUser(null);
    setDetailLoading(true);
    adminApi
      .get(`/users/${id}`)
      .then(({ data }) => setSelectedUser(data))
      .catch(() => setSelectedUser(null))
      .finally(() => setDetailLoading(false));
  };

  const runAction = async (userId, action) => {
    setActionLoading(action);
    try {
      await adminApi.post(`/users/${userId}/${action}`);
      fetchDetail(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <span className="text-admin-muted text-sm">
            {total} users
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm"
          >
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm"
          />
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-admin-muted">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-admin-muted">No users found</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-border">
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">User</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Plan</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Joined</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Queries (all)</th>
                    <th className="text-left py-3 px-4 text-admin-muted text-sm font-medium">Cost (all)</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => fetchDetail(u.id)}
                      className="border-b border-admin-border/50 hover:bg-admin-border/20 cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-sm">{u.email_masked}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${u.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-admin-border/50'}`}>
                          {u.plan?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {u.created_at ? format(new Date(u.created_at), 'd MMM') : '—'}
                      </td>
                      <td className="py-3 px-4">{u.queries_total ?? 0}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        ₹{(u.cost_total ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border">
                  <span className="text-admin-muted text-sm">Page {page} of {pages}</span>
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

      {selectedUser && (
        <div className="w-96 shrink-0 bg-admin-surface border border-admin-border rounded-xl p-6 max-h-[calc(100vh-12rem)] overflow-auto">
          {detailLoading ? (
            <div className="text-admin-muted">Loading...</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono font-bold">User Detail</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-admin-muted hover:text-gray-200 text-sm"
                >
                  Close
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-admin-muted">Email</p>
                  <p className="font-mono break-all">{selectedUser.user?.email}</p>
                </div>
                <div>
                  <p className="text-admin-muted">Plan</p>
                  <p className="uppercase">{selectedUser.user?.plan}</p>
                </div>
                <div>
                  <p className="text-admin-muted">Joined</p>
                  <p>{selectedUser.user?.created_at ? format(new Date(selectedUser.user.created_at), 'd MMM yyyy') : '—'}</p>
                </div>
                {selectedUser.risk_profile && (
                  <div>
                    <p className="text-admin-muted">Risk Profile</p>
                    <p>Goal: {selectedUser.risk_profile.goal} · {selectedUser.risk_profile.risk_tolerance}</p>
                    {selectedUser.risk_profile.completed && (
                      <span className="text-green-400 text-xs">Onboarding complete</span>
                    )}
                  </div>
                )}
                {selectedUser.usage && (
                  <div>
                    <p className="text-admin-muted">Usage this month</p>
                    <p>Queries: {selectedUser.usage.total_queries} · Tokens: {selectedUser.usage.total_tokens?.toLocaleString()} · ₹{selectedUser.usage.total_cost?.toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedUser.user?.plan !== 'pro' && (
                  <button
                    onClick={() => runAction(selectedUser.user.id, 'upgrade')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'upgrade' ? '...' : 'Upgrade to Pro'}
                  </button>
                )}
                <button
                  onClick={() => runAction(selectedUser.user.id, 'reset-limit')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-admin-border/50 hover:bg-admin-border rounded text-sm disabled:opacity-50"
                >
                  {actionLoading === 'reset-limit' ? '...' : 'Reset Daily Limit'}
                </button>
                {selectedUser.user?.is_suspended ? (
                  <button
                    onClick={() => runAction(selectedUser.user.id, 'unsuspend')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'unsuspend' ? '...' : 'Unsuspend'}
                  </button>
                ) : (
                  <button
                    onClick={() => runAction(selectedUser.user.id, 'suspend')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'suspend' ? '...' : 'Suspend'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
