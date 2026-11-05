import React from 'react';
import { AQIHeroCard } from '../dashboard/AQIHeroCard';
import { PredictedVsActualChart } from '../dashboard/PredictedVsActualChart';
import { TimeShiftSlider } from '../dashboard/TimeShiftSlider';
import { LungsSavedCard } from '../dashboard/LungsSavedCard';
import { RouteMap } from '../map/RouteMap';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Navigation } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { setActiveTab, userProfile } = useApp();

  return (
    <div className="space-y-6">
      
      {/* Welcome & Demographic Context Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
              Personalized Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs text-slate-400">AWS Bedrock LightGBM Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            Welcome back, {userProfile.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            AtmosAi is calculating micro-pollutant intake for your <strong className="text-cyan-300 capitalize">{userProfile.persona}</strong> profile ({userProfile.exposureMultiplier}x biological multiplier). Morning thermal inversion is currently dissipating.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0"
        >
          <Navigation className="w-4 h-4" />
          <span>Open Full Map Corridors</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero Air Quality Telemetry & Simulation Gauge */}
      <AQIHeroCard />

      {/* Responsive Multi-Column Layout on Desktop / Single-Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Predicted vs Actual Graph */}
        <div className="lg:col-span-7 flex flex-col">
          <PredictedVsActualChart />
        </div>

        {/* Right Column (5 cols): Time-Shift Departure Slider & Exposure Card */}
        <div className="lg:col-span-5 flex flex-col">
          <TimeShiftSlider />
        </div>

      </div>

      {/* Gamified Stat Card & Clean Routing Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gamified Lungs Saved (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <LungsSavedCard />
        </div>

        {/* Live Clean Routing Quick Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Active Routing Comparison
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Expand View →
              </button>
            </div>
            
            <RouteMap />
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardView;
