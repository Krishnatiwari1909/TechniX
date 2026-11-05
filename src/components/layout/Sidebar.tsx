import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Map, 
  Bell, 
  User, 
  Activity, 
  Settings2,
  Wind
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, userProfile, setShowOnboarding, pm25Level } = useApp();

  const navItems = [
    { id: 'home', label: 'Main Dashboard', icon: Home, subtitle: 'Real-time & ML Forecast' },
    { id: 'map', label: 'Clean Routing', icon: Map, subtitle: 'Red vs Green Corridors' },
    { id: 'alerts', label: 'Early Warnings', icon: Bell, subtitle: 'Thermal Inversion Alerts', badge: '2' },
    { id: 'profile', label: 'My Biometrics', icon: User, subtitle: 'Persona & Multiplier' }
  ] as const;

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 glass-panel border-r border-white/10 p-5 z-30 justify-between select-none">
      {/* Top Section */}
      <div className="space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Wind className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black text-white tracking-tight">AtmosAi</h1>
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Early-Warning & Clean Routing
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Desktop Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-transparent text-cyan-300 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#22d3ee]'
                        : 'bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm block">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-[0_0_8px_#ef4444]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        
        {/* User Persona Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Profile
            </span>
            <span className="text-[10px] font-bold text-cyan-400 font-mono">
              {userProfile.exposureMultiplier}x Shield
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white capitalize block">
                {userProfile.persona} Mode
              </span>
              <span className="text-[10px] text-slate-400">
                {userProfile.commuteMode} • {userProfile.commuteTime} AM
              </span>
            </div>
          </div>
        </div>

        {/* Setup Wizard Trigger Button */}
        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white border border-white/10 transition-all font-semibold"
        >
          <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Relaunch Setup Wizard</span>
        </button>

        {/* Ambient telemetry live ticker */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Station #AGY-09
          </span>
          <span className={pm25Level > 75 ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'}>
            PM2.5: {pm25Level}µg
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

