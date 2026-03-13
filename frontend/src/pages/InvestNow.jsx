import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowLeft } from 'lucide-react';

const BROKERS = [
  { name: 'Zerodha', url: 'https://zerodha.com', favicon: 'https://zerodha.com/favicon.ico' },
  { name: 'Groww', url: 'https://groww.in', favicon: 'https://groww.in/favicon.ico' },
  { name: 'Upstox', url: 'https://upstox.com', favicon: 'https://upstox.com/favicon.ico' },
];

function BrokerCard({ broker }) {
  const [imgError, setImgError] = useState(false);
  return (
    <a
      href={broker.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all w-28"
    >
      <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
        {!imgError ? (
          <img
            src={broker.favicon}
            alt=""
            className="w-8 h-8 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <Wallet className="w-8 h-8 text-slate-400" />
        )}
      </div>
      <span className="font-sans font-medium text-gray-900 text-sm">{broker.name}</span>
    </a>
  );
}

export default function InvestNow() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to recommendations
      </Link>

      <div className="text-center">
        <h1 className="font-sans font-semibold text-gray-900 text-xl">Invest Now</h1>
        <p className="font-sans text-gray-500 text-sm mt-1">
          Choose your preferred broker to get started
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {BROKERS.map((broker) => (
          <BrokerCard key={broker.name} broker={broker} />
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="font-sans text-amber-800 text-sm font-medium">
          Direct broker integration coming in Phase 2
        </p>
        <p className="font-sans text-amber-700 text-xs mt-1">
          For now, you can open an account with any broker above and start investing.
        </p>
      </div>
    </div>
  );
}