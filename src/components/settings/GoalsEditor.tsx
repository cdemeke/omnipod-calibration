import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export function GoalsEditor() {
  const { state, updatePumpSettings, updateUserGoals } = useApp();

  const [targetLow, setTargetLow] = useState(state.pumpSettings.targetLow);
  const [targetHigh, setTargetHigh] = useState(state.pumpSettings.targetHigh);
  const [targetTIR, setTargetTIR] = useState(state.userGoals.targetTIR);
  const [maxLowPercentage, setMaxLowPercentage] = useState(state.userGoals.maxLowPercentage);
  const [maxVeryLowPercentage, setMaxVeryLowPercentage] = useState(state.userGoals.maxVeryLowPercentage);
  const [rangeLow, setRangeLow] = useState(state.userGoals.targetRangeLow);
  const [rangeHigh, setRangeHigh] = useState(state.userGoals.targetRangeHigh);

  const saveChanges = () => {
    updatePumpSettings({
      ...state.pumpSettings,
      targetLow,
      targetHigh,
    });
    updateUserGoals({
      ...state.userGoals,
      targetTIR,
      maxLowPercentage,
      maxVeryLowPercentage,
      targetRangeLow: rangeLow,
      targetRangeHigh: rangeHigh,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Blood Sugar Goals</h3>
        <p className="text-sm text-gray-500 mt-1">
          Set your target ranges and time-in-range goals. These goals guide the recommendations.
        </p>
      </div>

      {/* Pump Target Range */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Pump Target Range</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Target Low (mg/dL)</label>
            <input
              type="number"
              min="70"
              max="120"
              value={targetLow}
              onChange={(e) => setTargetLow(parseInt(e.target.value) || 80)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Target High (mg/dL)</label>
            <input
              type="number"
              min="100"
              max="180"
              value={targetHigh}
              onChange={(e) => setTargetHigh(parseInt(e.target.value) || 120)}
              className="input"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          The target range your pump uses for bolus calculations
        </p>
      </div>

      {/* Time in Range Goals */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Time in Range Goals</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">In-Range Low (mg/dL)</label>
            <input
              type="number"
              min="60"
              max="100"
              value={rangeLow}
              onChange={(e) => setRangeLow(parseInt(e.target.value) || 70)}
              className="input"
            />
          </div>
          <div>
            <label className="label">In-Range High (mg/dL)</label>
            <input
              type="number"
              min="140"
              max="250"
              value={rangeHigh}
              onChange={(e) => setRangeHigh(parseInt(e.target.value) || 180)}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label">Target Time in Range (%)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="90"
              value={targetTIR}
              onChange={(e) => setTargetTIR(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-semibold text-green-700 w-16 text-right">
              {targetTIR}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 70% or higher for most people
          </p>
        </div>
      </div>

      {/* Safety Limits */}
      <div className="p-4 bg-red-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Safety Limits (Lows)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Max Time Low (Below 70) %</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={maxLowPercentage}
              onChange={(e) => setMaxLowPercentage(parseFloat(e.target.value) || 4)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Target: &lt;4%</p>
          </div>
          <div>
            <label className="label">Max Time Very Low (Below 54) %</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={maxVeryLowPercentage}
              onChange={(e) => setMaxVeryLowPercentage(parseFloat(e.target.value) || 1)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Target: &lt;1%</p>
          </div>
        </div>
        <p className="text-xs text-red-600 mt-3">
          Reducing lows is always prioritized over reducing highs in recommendations
        </p>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={saveChanges} className="btn btn-primary">
          Save Goals
        </button>
      </div>
    </div>
  );
}
