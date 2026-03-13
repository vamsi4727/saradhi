import Sparkline from './Sparkline';

export default function RecommendationCard({ recommendation }) {
  const {
    name,
    symbol,
    asset_type,
    price,
    change_pct,
    rationale,
    sparkline_data,
  } = recommendation;

  const sparkline = Array.isArray(sparkline_data) ? sparkline_data : sparkline_data?.data || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-medium text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {asset_type?.replace('_', ' ') || 'stock'}
          </span>
          <h3 className="font-sans font-semibold text-gray-900 mt-1.5 text-base">{name}</h3>
          <p className="font-mono text-xs text-gray-400 mt-0.5">{symbol}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-gray-900 text-base">
            ₹{price != null ? Number(price).toLocaleString('en-IN') : '—'}
          </p>
          <p
            className={`font-mono text-sm font-medium mt-0.5 ${
              change_pct >= 0 ? 'text-bull' : 'text-bear'
            }`}
          >
            {change_pct >= 0 ? '▲' : '▼'} {Math.abs(change_pct ?? 0).toFixed(2)}%
          </p>
        </div>
      </div>

      {sparkline.length > 0 && (
        <Sparkline data={sparkline} positive={change_pct >= 0} />
      )}

      {rationale && (
        <p className="font-sans text-sm text-gray-600 mt-3 leading-relaxed">
          🤖 {rationale}
        </p>
      )}

      <button className="w-full mt-4 bg-saffron-500 hover:bg-saffron-600 text-white font-sans font-semibold py-3.5 rounded-xl transition-colors duration-150">
        Invest Now →
      </button>
    </div>
  );
}
