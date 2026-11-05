import React, { useState, useEffect } from 'react';
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
import { Auth } from './components/auth/Auth';
import { ProfileSetup } from './components/auth/ProfileSetup';
import { supabase, isSupabaseConfigured } from './lib/supabase';

interface MainLayoutProps {
  onOpenAuth: () => void;
  onOpenSetup: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onOpenAuth, onOpenSetup }) => {
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
    <div className="relative min-h-screen bg-[#F9F8F6] text-slate-800 flex flex-col md:flex-row antialiased overflow-x-hidden">
      {/* 1. 3D Ambient Background at z-index 0 */}
      <AmbientBackground pm25Level={pm25Level} />

      {/* Desktop Sidebar */}
      <Sidebar onOpenAuth={onOpenAuth} />

      {/* Main Content Area (offset by fixed sidebar on desktop) */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 md:ml-64 lg:ml-72">
        <Navbar onOpenAuth={onOpenAuth} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 xl:px-12 py-4 sm:py-6 pb-24 md:pb-6">
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
  const [authScreen, setAuthScreen] = useState<'auth' | 'setup' | 'app'>(() => {
    // If user has visited before or skipped, default to 'app'
    const hasVisited = localStorage.getItem('atmosai_visited');
    return hasVisited ? 'app' : 'auth';
  });

  // Check Supabase session on startup
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          localStorage.setItem('atmosai_visited', 'true');
          setAuthScreen('app');
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          localStorage.setItem('atmosai_visited', 'true');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('atmosai_visited', 'true');
    setAuthScreen('app');
  };

  const handleSignUpSuccess = () => {
    localStorage.setItem('atmosai_visited', 'true');
    setAuthScreen('setup');
  };

  const handleSetupComplete = () => {
    setAuthScreen('app');
  };

  const handleGuestContinue = () => {
    localStorage.setItem('atmosai_visited', 'true');
    setAuthScreen('app');
  };

  if (authScreen === 'auth') {
    return (
      <Auth
        onLoginSuccess={handleLoginSuccess}
        onSignUpSuccess={handleSignUpSuccess}
        onContinueAsGuest={handleGuestContinue}
      />
    );
  }

  if (authScreen === 'setup') {
    return (
      <AppProvider>
        <ProfileSetup onComplete={handleSetupComplete} />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <MainLayout
        onOpenAuth={() => setAuthScreen('auth')}
        onOpenSetup={() => setAuthScreen('setup')}
      />
    </AppProvider>
  );
};

export default App;
