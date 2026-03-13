import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <p className="font-sans text-xs text-amber-800 text-center flex items-center justify-center gap-1.5 flex-wrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
        <span>
          Saaradhi provides AI-generated research for{' '}
          <strong>educational purposes only</strong>. This is{' '}
          <strong>not SEBI-registered investment advice</strong>.{' '}
          <a href="/disclaimer" className="underline font-medium">
            Full disclaimer →
          </a>
        </span>
      </p>
    </div>
  );
}
