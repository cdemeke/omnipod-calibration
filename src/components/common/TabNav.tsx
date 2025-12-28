import { useApp } from '../../context/AppContext';

type Tab = 'settings' | 'upload' | 'analysis' | 'recommendations';

interface TabConfig {
  id: Tab;
  label: string;
  description: string;
}

const tabs: TabConfig[] = [
  { id: 'settings', label: 'Settings', description: 'Current pump settings' },
  { id: 'upload', label: 'Upload', description: 'Upload CGM report' },
  { id: 'analysis', label: 'Analysis', description: 'View patterns' },
  { id: 'recommendations', label: 'Recommendations', description: 'Suggested changes' },
];

export function TabNav() {
  const { state, setActiveTab } = useApp();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative py-4 px-1 text-sm font-medium transition-colors
                ${
                  state.activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
              {state.activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
              {/* Show indicator for recommendations if there's a pending recommendation */}
              {tab.id === 'recommendations' && state.currentRecommendation && (
                <span className="absolute -top-1 -right-2 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
