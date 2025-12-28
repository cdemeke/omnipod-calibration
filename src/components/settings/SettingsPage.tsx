import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BasalEditor } from './BasalEditor';
import { ICREditor } from './ICREditor';
import { ISFEditor } from './ISFEditor';
import { GoalsEditor } from './GoalsEditor';

type SettingsTab = 'basal' | 'icr' | 'isf' | 'goals';

export function SettingsPage() {
  const { state } = useApp();
  const [activeSection, setActiveSection] = useState<SettingsTab>('basal');

  const sections: { id: SettingsTab; label: string; description: string }[] = [
    { id: 'basal', label: 'Basal Rates', description: 'Background insulin delivery' },
    { id: 'icr', label: 'Carb Ratios', description: 'Insulin-to-carb ratios' },
    { id: 'isf', label: 'Correction Factor', description: 'Insulin sensitivity' },
    { id: 'goals', label: 'Goals', description: 'Target blood sugar goals' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Current Pump Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your current Omnipod settings. These will be used to generate personalized recommendations.
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`
              px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="card">
        {activeSection === 'basal' && <BasalEditor />}
        {activeSection === 'icr' && <ICREditor />}
        {activeSection === 'isf' && <ISFEditor />}
        {activeSection === 'goals' && <GoalsEditor />}
      </div>

      {/* Quick Summary */}
      <div className="card bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Basal Segments:</span>
            <span className="ml-2 font-medium">{state.pumpSettings.basalSegments.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Target Range:</span>
            <span className="ml-2 font-medium">
              {state.pumpSettings.targetLow}-{state.pumpSettings.targetHigh} mg/dL
            </span>
          </div>
          <div>
            <span className="text-gray-500">Active Insulin:</span>
            <span className="ml-2 font-medium">{state.pumpSettings.activeInsulinTime} hours</span>
          </div>
          <div>
            <span className="text-gray-500">TIR Goal:</span>
            <span className="ml-2 font-medium">{state.userGoals.targetTIR}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
