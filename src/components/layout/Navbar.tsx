import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wind, Activity, Settings2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { userProfile, pm25Level, setShowOnboarding } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 pt-safe pb-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="md:hidden w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                AtmosAi
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 font-mono hidden sm:inline px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                PWA Core
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Intelligent Air Quality & Demographic Protection
            </p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Live PM2.5 Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                pm25Level > 75 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-slate-500 hidden sm:inline">Telemetry:</span>
            <span className={`font-mono font-bold ${pm25Level > 75 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {pm25Level} µg/m³
            </span>
          </div>

          {/* Active Persona Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="capitalize">{userProfile.persona}</span>
            <span className="text-[10px] text-emerald-600 font-mono">({userProfile.exposureMultiplier}x)</span>
          </div>

          {/* Setup Wizard Trigger */}
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200 text-xs font-medium transition-all cursor-pointer"
            title="Setup Wizard"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Setup Wizard</span>
          </button>

        </div>

      </div>
    </header>
  );
};

export default Navbar;

