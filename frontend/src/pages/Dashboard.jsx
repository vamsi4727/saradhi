import { useState, useEffect } from 'react';
import { recommendationService } from '../services/recommendationService';
import RecommendationCard from '../components/dashboard/RecommendationCard';

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationService.getRecommendations().then((data) => {
      setRecommendations(data);
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
          <p className="font-sans text-gray-500 mb-4">
            Complete your onboarding to get personalized recommendations.
          </p>
          <a
            href="/onboarding"
            className="text-brand-500 font-medium hover:underline"
          >
            Complete onboarding →
          </a>
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
