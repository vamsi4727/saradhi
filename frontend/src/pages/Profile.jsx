import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/api/user/profile').then(({ data }) => {
      setProfile(data);
    });
  }, []);

  if (!profile) return <div className="font-sans text-gray-500">Loading...</div>;

  const { user, risk_profile } = profile;

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-semibold text-gray-900 text-lg">Profile</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-sans font-medium text-gray-900 mb-3">Account</h3>
        <p className="font-sans text-sm text-gray-600">{user?.email}</p>
        <p className="font-mono text-xs text-brand-500 mt-1">{user?.plan}</p>
      </div>

      {risk_profile && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-sans font-medium text-gray-900 mb-3">Risk Profile</h3>
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
          </dl>
        </div>
      )}
    </div>
  );
}
