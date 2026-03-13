import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const RISK_OPTIONS = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
];

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    goal: '',
    goal_amount: '',
    time_horizon_years: '',
    risk_tolerance: 'moderate',
    monthly_investment: '',
    existing_investments: '',
  });

  const fetchProfile = () => {
    setLoading(true);
    api
      .get('/api/user/profile')
      .then(({ data }) => {
        setProfile(data);
        if (data.risk_profile) {
          setForm({
            goal: data.risk_profile.goal || '',
            goal_amount: data.risk_profile.goal_amount?.toString() || '',
            time_horizon_years: data.risk_profile.time_horizon_years?.toString() || '',
            risk_tolerance: data.risk_profile.risk_tolerance || 'moderate',
            monthly_investment: data.risk_profile.monthly_investment?.toString() || '',
            existing_investments: data.risk_profile.existing_investments || '',
          });
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/user/profile', {
        goal: form.goal || null,
        goal_amount: form.goal_amount ? parseFloat(form.goal_amount) : null,
        time_horizon_years: form.time_horizon_years ? parseInt(form.time_horizon_years, 10) : null,
        risk_tolerance: form.risk_tolerance,
        monthly_investment: form.monthly_investment ? parseFloat(form.monthly_investment) : null,
        existing_investments: form.existing_investments || null,
      });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your profile? You can complete onboarding again to set it up.')) return;

    setDeleting(true);
    try {
      await api.delete('/api/user/profile');
      setProfile((p) => (p ? { ...p, risk_profile: null } : null));
      setEditing(false);
      navigate('/onboarding');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="font-sans text-gray-500">Loading...</div>;
  if (!profile) return <div className="font-sans text-gray-500">Failed to load profile.</div>;

  const { user, risk_profile } = profile;

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-semibold text-gray-900 text-lg">Profile</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-sans font-medium text-gray-900 mb-3">Account</h3>
        <p className="font-sans text-sm text-gray-600">{user?.email}</p>
        <p className="font-mono text-xs text-brand-500 mt-1">{user?.plan}</p>
      </div>

      {risk_profile ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-sans font-medium text-gray-900">Risk Profile</h3>
            {!editing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-brand-500 font-medium hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm text-brand-500 font-medium hover:underline disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Goal</label>
                <input
                  type="text"
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                  placeholder="e.g., Retirement planning"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  value={form.goal_amount}
                  onChange={(e) => setForm((f) => ({ ...f, goal_amount: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Time Horizon (years)</label>
                <input
                  type="number"
                  value={form.time_horizon_years}
                  onChange={(e) => setForm((f) => ({ ...f, time_horizon_years: e.target.value }))}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Risk Tolerance</label>
                <select
                  value={form.risk_tolerance}
                  onChange={(e) => setForm((f) => ({ ...f, risk_tolerance: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  {RISK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Monthly Investment (₹)</label>
                <input
                  type="number"
                  value={form.monthly_investment}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_investment: e.target.value }))}
                  placeholder="e.g., 10000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Existing Investments</label>
                <input
                  type="text"
                  value={form.existing_investments}
                  onChange={(e) => setForm((f) => ({ ...f, existing_investments: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          ) : (
            <dl className="space-y-2 font-sans text-sm">
              <div>
                <dt className="text-gray-500">Goal</dt>
                <dd className="font-medium text-gray-900">{risk_profile.goal}</dd>
              </div>
              {risk_profile.goal_amount && (
                <div>
                  <dt className="text-gray-500">Target</dt>
                  <dd className="font-mono font-medium">₹{risk_profile.goal_amount.toLocaleString('en-IN')}</dd>
                </div>
              )}
              {risk_profile.time_horizon_years && (
                <div>
                  <dt className="text-gray-500">Time Horizon</dt>
                  <dd className="font-medium">{risk_profile.time_horizon_years} years</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Risk Tolerance</dt>
                <dd className="font-medium capitalize">{risk_profile.risk_tolerance}</dd>
              </div>
              {risk_profile.monthly_investment && (
                <div>
                  <dt className="text-gray-500">Monthly Investment</dt>
                  <dd className="font-mono font-medium">₹{risk_profile.monthly_investment.toLocaleString('en-IN')}</dd>
                </div>
              )}
              {risk_profile.existing_investments && (
                <div>
                  <dt className="text-gray-500">Existing Investments</dt>
                  <dd className="font-medium text-gray-900">{risk_profile.existing_investments}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
          <p className="font-sans text-gray-500 mb-4">No risk profile yet.</p>
          <Link to="/onboarding" className="text-brand-500 font-medium hover:underline">
            Complete onboarding →
          </Link>
        </div>
      )}
    </div>
  );
}
