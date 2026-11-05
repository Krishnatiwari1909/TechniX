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
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 lg:w-72 bg-white border-r border-stone-200/80 p-5 z-30 justify-between select-none shadow-[4px_0_24px_-4px_rgba(0,0,0,0.03)] overflow-y-auto">
      {/* Top Section */}
      <div className="space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">AtmosAi</h1>
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
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
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50 border border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-stone-100 text-slate-500 group-hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-4 border-t border-stone-200/80">
        
        {/* User Persona Card */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Active Profile
            </span>
            <span className="text-[10px] font-bold text-emerald-700 font-mono">
              {userProfile.exposureMultiplier}x Shield
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 capitalize block">
                {userProfile.persona} Mode
              </span>
              <span className="text-[10px] text-slate-500">
                {userProfile.commuteMode} • {userProfile.commuteTime} AM
              </span>
            </div>
          </div>
        </div>

        {/* Setup Wizard Trigger Button */}
        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs text-slate-700 border border-stone-200 transition-all font-semibold cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-600" />
          <span>Relaunch Setup Wizard</span>
        </button>

        {/* Ambient telemetry live ticker */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Station #AGY-09
          </span>
          <span className={pm25Level > 75 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
            PM2.5: {pm25Level}µg
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

