import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wind, Activity, Settings2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { userProfile, pm25Level, setShowOnboarding } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 sm:px-6 pt-safe pb-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="md:hidden w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.5)]">
            <Wind className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                AtmosAi
              </span>
              <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono hidden sm:inline px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800">
                PWA Core
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Intelligent Air Quality & Demographic Protection
            </p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Live PM2.5 Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                pm25Level > 75 ? 'bg-red-400 animate-ping' : 'bg-cyan-400 animate-pulse'
              }`}
            />
            <span className="text-slate-400 hidden sm:inline">Telemetry:</span>
            <span className={`font-mono font-bold ${pm25Level > 75 ? 'text-red-400' : 'text-cyan-300'}`}>
              {pm25Level} µg/m³
            </span>
          </div>

          {/* Active Persona Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
            <Activity className="w-3.5 h-3.5" />
            <span className="capitalize">{userProfile.persona}</span>
            <span className="text-[10px] text-cyan-400/80 font-mono">({userProfile.exposureMultiplier}x)</span>
          </div>

          {/* Setup Wizard Trigger */}
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
            title="Setup Wizard"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Setup Wizard</span>
          </button>

        </div>

      </div>
    </header>
  );
};

export default Navbar;

