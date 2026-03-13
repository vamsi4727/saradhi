export default function ProfileSummaryCard({ profile }) {
  const { goal, goal_amount, time_horizon_years, risk_tolerance, monthly_investment } = profile;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="font-sans font-semibold text-gray-900 mb-3">Your Profile Summary</h3>
      <dl className="space-y-2 font-sans text-sm">
        {goal && (
          <div>
            <dt className="text-gray-500">Goal</dt>
            <dd className="font-medium text-gray-900">{goal}</dd>
          </div>
        )}
        {goal_amount && (
          <div>
            <dt className="text-gray-500">Target Amount</dt>
            <dd className="font-mono font-medium text-gray-900">₹{goal_amount.toLocaleString('en-IN')}</dd>
          </div>
        )}
        {time_horizon_years && (
          <div>
            <dt className="text-gray-500">Time Horizon</dt>
            <dd className="font-medium text-gray-900">{time_horizon_years} years</dd>
          </div>
        )}
        {risk_tolerance && (
          <div>
            <dt className="text-gray-500">Risk Tolerance</dt>
            <dd className="font-medium text-gray-900 capitalize">{risk_tolerance}</dd>
          </div>
        )}
        {monthly_investment && (
          <div>
            <dt className="text-gray-500">Monthly Investment</dt>
            <dd className="font-mono font-medium text-gray-900">₹{monthly_investment.toLocaleString('en-IN')}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
