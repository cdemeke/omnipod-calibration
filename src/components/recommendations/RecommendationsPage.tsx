import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateRecommendation, applyRecommendation } from '../../services/recommender';
import { RecommendationCard } from './RecommendationCard';
import { AppliedRecommendationsList } from './AppliedRecommendationsList';

export function RecommendationsPage() {
  const { state, dispatch, applyRecommendation: applyRec, setActiveTab } = useApp();
  const { cgmData, pumpSettings, userGoals, currentRecommendation, appliedRecommendations } = state;

  const [showConfirm, setShowConfirm] = useState(false);

  // Generate recommendation when CGM data changes
  useEffect(() => {
    if (cgmData && !currentRecommendation) {
      const rec = generateRecommendation(cgmData, pumpSettings, userGoals);
      dispatch({ type: 'SET_RECOMMENDATION', payload: rec });
    }
  }, [cgmData, pumpSettings, userGoals, currentRecommendation, dispatch]);

  const handleApply = () => {
    if (!currentRecommendation) return;

    const newSettings = applyRecommendation(currentRecommendation, pumpSettings);
    applyRec(currentRecommendation, newSettings);
    setShowConfirm(false);

    // Generate next recommendation
    setTimeout(() => {
      const nextRec = generateRecommendation(cgmData!, newSettings, userGoals);
      dispatch({ type: 'SET_RECOMMENDATION', payload: nextRec });
    }, 100);
  };

  const handleDismiss = () => {
    if (!currentRecommendation) return;

    dispatch({ type: 'DISMISS_RECOMMENDATION', payload: currentRecommendation.id });

    // Generate next recommendation (skipping similar ones)
    // For now, just clear it - in a full implementation, you'd track dismissed types
    dispatch({ type: 'SET_RECOMMENDATION', payload: null });
  };

  const handleRefresh = () => {
    if (!cgmData) return;
    const rec = generateRecommendation(cgmData, pumpSettings, userGoals);
    dispatch({ type: 'SET_RECOMMENDATION', payload: rec });
  };

  if (!cgmData) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data to Analyze</h3>
        <p className="text-gray-500 mb-4">Upload a CGM report to get personalized recommendations.</p>
        <button onClick={() => setActiveTab('upload')} className="btn btn-primary">
          Upload Report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
          <p className="text-sm text-gray-500 mt-1">
            One focused suggestion at a time for gradual improvement.
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary text-sm">
          Refresh Analysis
        </button>
      </div>

      {/* Safety Reminder */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-800">
            <strong>Safety First:</strong> These recommendations are conservative (max 5-10% changes).
            Wait 3-5 days between adjustments to see the full effect. Always consult your healthcare
            provider for significant changes or if you're unsure.
          </div>
        </div>
      </div>

      {/* Current Recommendation */}
      {currentRecommendation ? (
        <RecommendationCard
          recommendation={currentRecommendation}
          onApply={() => setShowConfirm(true)}
          onDismiss={handleDismiss}
        />
      ) : (
        <div className="card text-center py-8">
          <svg className="w-12 h-12 mx-auto text-green-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Right Now</h3>
          <p className="text-gray-500">
            Your current settings look good based on the uploaded data, or you've addressed all
            high-priority items. Upload a new report after a few days to reassess.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && currentRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Setting Change</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to apply this change to your settings?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm">
                <span className="text-gray-500">Change:</span>{' '}
                <span className="font-medium">
                  {currentRecommendation.type === 'basal' ? 'Basal Rate' :
                   currentRecommendation.type === 'icr' ? 'Carb Ratio' : 'Correction Factor'}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Time:</span>{' '}
                <span className="font-medium">{currentRecommendation.timeRange.label}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">From:</span>{' '}
                <span className="font-medium">{currentRecommendation.currentValue}</span>
                {' → '}
                <span className="text-blue-600 font-semibold">{currentRecommendation.suggestedValue}</span>
              </p>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              This will update your stored settings. You'll still need to manually enter
              these changes into your actual Omnipod device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex-1 btn btn-primary"
              >
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {currentRecommendation && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">After Applying This Change:</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Update your Omnipod with the new setting</li>
            <li>Wait 3-5 days to see the full effect</li>
            <li>Upload a new Clarity report to reassess</li>
            <li>Get your next recommendation</li>
          </ol>
        </div>
      )}

      {/* Applied Recommendations History */}
      {appliedRecommendations.length > 0 && (
        <AppliedRecommendationsList recommendations={appliedRecommendations} />
      )}
    </div>
  );
}
