import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AmbientBackground } from './components/3d/AmbientBackground';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/views/DashboardView';
import { MapView } from './components/views/MapView';
import { AlertsView } from './components/views/AlertsView';
import { ProfileView } from './components/views/ProfileView';
import { AskAtmosFAB } from './components/chat/AskAtmosFAB';
import { SetupWizard } from './components/onboarding/SetupWizard';

const MainLayout: React.FC = () => {
  const { pm25Level, activeTab, showOnboarding, setShowOnboarding } = useApp();

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A1128] text-slate-100 flex flex-col md:flex-row antialiased overflow-x-hidden">
      {/* 1. 3D Ambient Background at z-index 0 */}
      <AmbientBackground pm25Level={pm25Level} />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <Navbar />

        <main
          className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
          style={{
            paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          {activeTab === 'home' && <DashboardView />}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        {/* 5. "Ask Atmos" Chatbot FAB */}
        <AskAtmosFAB />

        {/* Mobile Sticky Bottom Navigation */}
        <BottomNav />
      </div>

      {/* 2. The Setup Wizard (Onboarding) */}
      {showOnboarding && (
        <SetupWizard
          onComplete={() => setShowOnboarding(false)}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
