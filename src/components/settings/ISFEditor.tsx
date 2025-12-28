import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ISFSegment } from '../../types';

export function ISFEditor() {
  const { state, updatePumpSettings } = useApp();
  const [segments, setSegments] = useState<ISFSegment[]>(state.pumpSettings.isfSegments);
  const [activeInsulinTime, setActiveInsulinTime] = useState(state.pumpSettings.activeInsulinTime);
  const [correctionTarget, setCorrectionTarget] = useState(state.pumpSettings.correctionTarget);

  const updateSegment = (id: string, field: keyof ISFSegment, value: string | number) => {
    const updated = segments.map((seg) =>
      seg.id === id ? { ...seg, [field]: value } : seg
    );
    setSegments(updated);
  };

  const addSegment = () => {
    const lastSegment = segments[segments.length - 1];
    const newSegment: ISFSegment = {
      id: Date.now().toString(),
      startTime: lastSegment?.endTime || '00:00',
      endTime: '00:00',
      factor: lastSegment?.factor || 50,
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
      isfSegments: segments,
      activeInsulinTime,
      correctionTarget,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Insulin Sensitivity Factor (ISF)</h3>
        <p className="text-sm text-gray-500 mt-1">
          Set how much 1 unit of insulin lowers your blood glucose in mg/dL.
          For example, ISF of 50 means 1 unit drops BG by 50 mg/dL.
        </p>
      </div>

      {/* Correction Settings */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
        <div>
          <label className="label">Correction Target (mg/dL)</label>
          <input
            type="number"
            min="70"
            max="150"
            value={correctionTarget}
            onChange={(e) => setCorrectionTarget(parseInt(e.target.value) || 100)}
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">Target BG for corrections</p>
        </div>
        <div>
          <label className="label">Active Insulin Time (hours)</label>
          <select
            value={activeInsulinTime}
            onChange={(e) => setActiveInsulinTime(parseFloat(e.target.value))}
            className="input"
          >
            <option value="2">2 hours</option>
            <option value="2.5">2.5 hours</option>
            <option value="3">3 hours</option>
            <option value="3.5">3.5 hours</option>
            <option value="4">4 hours</option>
            <option value="4.5">4.5 hours</option>
            <option value="5">5 hours</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Duration of insulin action (DIA)</p>
        </div>
      </div>

      {/* ISF Segments */}
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
                <label className="label">ISF (mg/dL per unit)</label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="500"
                  value={segment.factor}
                  onChange={(e) => updateSegment(segment.id, 'factor', parseInt(e.target.value) || 50)}
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
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={saveChanges} className="btn btn-primary">
          Save Correction Settings
        </button>
      </div>
    </div>
  );
}
