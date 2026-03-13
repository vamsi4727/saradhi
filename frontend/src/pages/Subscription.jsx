export default function Subscription() {
  return (
    <div className="space-y-6">
      <h2 className="font-sans font-semibold text-gray-900 text-lg">Upgrade to Pro</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="font-mono text-2xl font-semibold text-gray-900 mb-2">₹299<span className="font-sans text-base font-normal text-gray-500">/month</span></p>
        <ul className="font-sans text-sm text-gray-600 space-y-2">
          <li>✓ Unlimited Co-Pilot queries</li>
          <li>✓ 5 recommendations, refreshed every 6h</li>
          <li>✓ Full portfolio tracking + AI insights</li>
          <li>✓ Risk alerts</li>
          <li>✓ Ad-free experience</li>
        </ul>
        <button className="w-full mt-6 bg-saffron-500 hover:bg-saffron-600 text-white font-sans font-semibold py-3.5 rounded-xl transition-colors duration-150">
          Subscribe with Razorpay
        </button>
        <p className="font-sans text-xs text-gray-400 mt-4 text-center">
          Coming soon — Phase 2
        </p>
      </div>
    </div>
  );
}
