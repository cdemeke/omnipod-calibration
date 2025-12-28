import { Recommendation } from '../../types';

interface Props {
  recommendations: Recommendation[];
}

export function AppliedRecommendationsList({ recommendations }: Props) {
  const typeLabels = {
    basal: 'Basal',
    icr: 'ICR',
    isf: 'ISF',
    target: 'Target',
  };

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Applied Changes History</h3>
      <p className="text-sm text-gray-500 mb-4">
        Track the changes you've made over time to see your progress.
      </p>

      <div className="space-y-3">
        {recommendations.slice(0, 10).map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {typeLabels[rec.type]}: {rec.currentValue} → {rec.suggestedValue}
                </p>
                <p className="text-xs text-gray-500">
                  {rec.timeRange.label} • Applied {rec.appliedAt ? formatDate(rec.appliedAt) : 'recently'}
                </p>
              </div>
            </div>
            <span className={`text-sm font-medium ${
              rec.changePercent > 0 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {rec.changePercent > 0 ? '+' : ''}{rec.changePercent}%
            </span>
          </div>
        ))}
      </div>

      {recommendations.length > 10 && (
        <p className="text-sm text-gray-400 text-center mt-4">
          Showing 10 most recent of {recommendations.length} changes
        </p>
      )}
    </div>
  );
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
