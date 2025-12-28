import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ICRSegment } from '../../types';

export function ICREditor() {
  const { state, updatePumpSettings } = useApp();
  const [segments, setSegments] = useState<ICRSegment[]>(state.pumpSettings.icrSegments);

  const updateSegment = (id: string, field: keyof ICRSegment, value: string | number) => {
    const updated = segments.map((seg) =>
      seg.id === id ? { ...seg, [field]: value } : seg
    );
    setSegments(updated);
  };

  const addSegment = () => {
    const lastSegment = segments[segments.length - 1];
    const newSegment: ICRSegment = {
      id: Date.now().toString(),
      startTime: lastSegment?.endTime || '00:00',
      endTime: '00:00',
      ratio: lastSegment?.ratio || 10,
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter((seg) => seg.id !== id));
    }
  };

  const saveChanges = () => {
    updatePumpSettings({
      ...state.pumpSettings,
      icrSegments: segments,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Insulin-to-Carb Ratios (ICR)</h3>
        <p className="text-sm text-gray-500 mt-1">
          Set how many grams of carbohydrates are covered by 1 unit of insulin.
          For example, 1:10 means 1 unit covers 10g of carbs.
        </p>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div>
                <label className="label">Start Time</label>
                <input
                  type="time"
                  value={segment.startTime}
                  onChange={(e) => updateSegment(segment.id, 'startTime', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">End Time</label>
                <input
                  type="time"
                  value={segment.endTime}
                  onChange={(e) => updateSegment(segment.id, 'endTime', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Ratio (1:X grams)</label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">1:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={segment.ratio}
                    onChange={(e) => updateSegment(segment.id, 'ratio', parseFloat(e.target.value) || 1)}
                    className="input"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => removeSegment(segment.id)}
              disabled={segments.length <= 1}
              className="text-red-500 hover:text-red-700 disabled:text-gray-300 p-2"
              title="Remove segment"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={addSegment} className="btn btn-secondary">
          + Add Segment
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tip: Common ICR Patterns</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>- Breakfast often needs a stronger ratio (lower number) due to morning insulin resistance</li>
          <li>- Lunch tends to be the most flexible time</li>
          <li>- Dinner may need adjustment based on activity level</li>
        </ul>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={saveChanges} className="btn btn-primary">
          Save Carb Ratios
        </button>
      </div>
    </div>
  );
}
