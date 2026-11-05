import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wind, Activity, Settings2, User } from 'lucide-react';

interface NavbarProps {
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { userProfile, pm25Level, setShowOnboarding } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 max-w-7xl mx-auto">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="md:hidden w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
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
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3">
          
          {/* Live PM2.5 Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs md:text-sm shadow-xs">
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs md:text-sm font-semibold text-emerald-800">
            <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="capitalize">{userProfile.persona}</span>
            <span className="text-[10px] text-emerald-700 font-mono hidden xs:inline">({userProfile.exposureMultiplier}x)</span>
          </div>

          {/* Setup Wizard Trigger */}
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200 text-xs md:text-sm font-medium transition-all cursor-pointer"
            title="Setup Wizard"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Setup</span>
          </button>

          {/* Supabase Auth Trigger */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs md:text-sm font-semibold transition-all cursor-pointer"
              title="Supabase User Account"
            >
              <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="hidden sm:inline font-medium text-xs">Account</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

export default Navbar;

