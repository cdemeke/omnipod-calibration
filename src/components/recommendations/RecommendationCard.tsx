import { Recommendation } from '../../types';

interface Props {
  recommendation: Recommendation;
  onApply: () => void;
  onDismiss: () => void;
}

export function RecommendationCard({ recommendation, onApply, onDismiss }: Props) {
  const priorityStyles = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-amber-500 bg-amber-50',
    low: 'border-blue-500 bg-blue-50',
  };

  const priorityLabels = {
    high: { text: 'High Priority', color: 'text-red-700 bg-red-100' },
    medium: { text: 'Medium Priority', color: 'text-amber-700 bg-amber-100' },
    low: { text: 'Low Priority', color: 'text-blue-700 bg-blue-100' },
  };

  const typeLabels = {
    basal: 'Basal Rate',
    icr: 'Carb Ratio (ICR)',
    isf: 'Correction Factor (ISF)',
    target: 'Target Range',
  };

  const typeIcons = {
    basal: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    icr: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    isf: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    target: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

  const changeArrow = recommendation.changePercent > 0 ? '↑' : '↓';

  return (
    <div className={`card border-l-4 ${priorityStyles[recommendation.priority]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${
            recommendation.priority === 'high' ? 'bg-red-100 text-red-600' :
            recommendation.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {typeIcons[recommendation.type]}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
            <p className="text-sm text-gray-500">{typeLabels[recommendation.type]}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityLabels[recommendation.priority].color}`}>
          {priorityLabels[recommendation.priority].text}
        </span>
      </div>

      {/* Time Range */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Time Period:</span> {recommendation.timeRange.label}
        </p>
      </div>

      {/* Change Details */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current</p>
            <p className="text-2xl font-bold text-gray-700">{recommendation.currentValue}</p>
            <p className="text-xs text-gray-400">
              {recommendation.type === 'basal' ? 'U/hr' :
               recommendation.type === 'icr' ? `1:${recommendation.currentValue}` :
               'mg/dL per U'}
            </p>
          </div>

          <div className="flex flex-col items-center px-4">
            <span className={`text-2xl ${recommendation.changePercent > 0 ? 'text-amber-500' : 'text-green-500'}`}>
              →
            </span>
            <span className={`text-sm font-medium ${
              recommendation.changePercent > 0 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {changeArrow} {Math.abs(recommendation.changePercent)}%
            </span>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Suggested</p>
            <p className="text-2xl font-bold text-blue-600">{recommendation.suggestedValue}</p>
            <p className="text-xs text-gray-400">
              {recommendation.type === 'basal' ? 'U/hr' :
               recommendation.type === 'icr' ? `1:${recommendation.suggestedValue}` :
               'mg/dL per U'}
            </p>
          </div>
        </div>
      </div>

      {/* Rationale */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Why This Change?</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{recommendation.rationale}</p>
      </div>

      {/* Supporting Data */}
      {recommendation.supportingData && (
        <div className="mb-4 flex gap-4 text-sm">
          {recommendation.supportingData.averageGlucose && (
            <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
              Avg: {recommendation.supportingData.averageGlucose} mg/dL
            </span>
          )}
          {recommendation.supportingData.timeInRange !== undefined && (
            <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
              TIR: {recommendation.supportingData.timeInRange}%
            </span>
          )}
          {recommendation.supportingData.lowEvents !== undefined && (
            <span className="px-2 py-1 bg-red-100 rounded text-red-600">
              Low events: {recommendation.supportingData.lowEvents}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onDismiss}
          className="flex-1 btn btn-secondary"
        >
          Skip This One
        </button>
        <button
          onClick={onApply}
          className="flex-1 btn btn-primary"
        >
          Apply This Change
        </button>
      </div>
    </div>
  );
}
