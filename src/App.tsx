import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { TabNav } from './components/common/TabNav';
import { SettingsPage } from './components/settings/SettingsPage';
import { UploadPage } from './components/upload/UploadPage';
import { AnalysisPage } from './components/analysis/AnalysisPage';
import { RecommendationsPage } from './components/recommendations/RecommendationsPage';

function AppContent() {
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.activeTab === 'settings' && <SettingsPage />}
        {state.activeTab === 'upload' && <UploadPage />}
        {state.activeTab === 'analysis' && <AnalysisPage />}
        {state.activeTab === 'recommendations' && <RecommendationsPage />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
