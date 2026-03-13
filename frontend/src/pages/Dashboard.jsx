import { useState, useEffect } from 'react';
import { recommendationService } from '../services/recommendationService';
import RecommendationCard from '../components/dashboard/RecommendationCard';

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationService.getRecommendations().then(({ recommendations: recs, hasProfile: hp, status: st, message: msg }) => {
      setRecommendations(recs);
      setHasProfile(hp);
      setStatus(st || 'ready');
      setMessage(msg || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="font-sans text-gray-500">Loading recommendations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-semibold text-gray-900 text-lg">For You</h2>
      <p className="font-sans text-sm text-gray-600">
        Personalized recommendations based on your profile
      </p>

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          {hasProfile ? (
            <>
              <p className="font-sans text-gray-700 font-medium mb-2">
                {status === 'generating' ? 'Recommendation is getting ready' : 'Profile saved successfully!'}
              </p>
              <p className="font-sans text-gray-500 mb-4">
                {status === 'generating'
                  ? (message || 'Recommendation is getting ready, please visit in some time.')
                  : 'We\'re preparing your personalized recommendations. This may take a moment. Refresh in a few seconds.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-brand-500 font-medium hover:underline"
              >
                Refresh recommendations →
              </button>
            </>
          ) : (
            <>
              <p className="font-sans text-gray-500 mb-4">
                Complete your onboarding to get personalized recommendations.
              </p>
              <a
                href="/onboarding"
                className="text-brand-500 font-medium hover:underline"
              >
                Complete onboarding →
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
