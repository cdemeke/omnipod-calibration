import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BasalSegment } from '../../types';

export function BasalEditor() {
  const { state, updatePumpSettings } = useApp();
  const [segments, setSegments] = useState<BasalSegment[]>(state.pumpSettings.basalSegments);

  const updateSegment = (id: string, field: keyof BasalSegment, value: string | number) => {
    const updated = segments.map((seg) =>
      seg.id === id ? { ...seg, [field]: value } : seg
    );
    setSegments(updated);
  };

  const addSegment = () => {
    const lastSegment = segments[segments.length - 1];
    const newSegment: BasalSegment = {
      id: Date.now().toString(),
      startTime: lastSegment?.endTime || '00:00',
      endTime: '00:00',
      rate: lastSegment?.rate || 0.5,
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
      basalSegments: segments,
    });
  };

  const totalDailyBasal = segments.reduce((total, seg) => {
    const [startH, startM] = seg.startTime.split(':').map(Number);
    const [endH, endM] = seg.endTime.split(':').map(Number);
    let hours = endH - startH + (endM - startM) / 60;
    if (hours <= 0) hours += 24; // Handle overnight
    return total + seg.rate * hours;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Basal Rate Schedule</h3>
        <p className="text-sm text-gray-500 mt-1">
          Set your background insulin delivery rates for different times of day.
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
                <label className="label">Rate (U/hr)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={segment.rate}
                  onChange={(e) => updateSegment(segment.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="input"
                />
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
        <div className="text-sm text-gray-600">
          Total Daily Basal: <span className="font-semibold">{totalDailyBasal.toFixed(2)} U</span>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={saveChanges} className="btn btn-primary">
          Save Basal Rates
        </button>
      </div>
    </div>
  );
}
