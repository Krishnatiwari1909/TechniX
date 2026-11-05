import React from 'react';
import { RouteMap } from '../map/RouteMap';
import { useApp } from '../../context/AppContext';
import { Navigation, ShieldCheck, TreePine, AlertTriangle, Sparkles } from 'lucide-react';

export const MapView: React.FC = () => {
  const { userProfile } = useApp();

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Navigation className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
              Intelligent Routing Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Clean Air Navigation Corridors
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Toggle between the high-exposure arterial highway and the low-particulate vegetative canopy route in Bengaluru.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 self-start sm:self-auto">
          <TreePine className="w-4 h-4 text-emerald-400" />
          <span>Biomass Leaf Absorption: <strong className="text-emerald-400 font-mono">68%</strong></span>
        </div>
      </div>

      {/* Main React-Leaflet RouteMap Component */}
      <RouteMap />

      {/* Corridor Air Quality Deep Dive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Vegetative Shielding</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Healthiest Route passes through the Cubbon green buffer, filtering fine and ultrafine particles naturally before reaching respiration height.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Arterial Diesel Vortex</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Fastest Route follows the main commercial arterial road where high diesel truck density causes deep alveolar particulate accumulation.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Demographic Savings</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            For your <span className="text-cyan-300 font-semibold capitalize">{userProfile.persona}</span> profile ({userProfile.exposureMultiplier}x), switching to the Healthiest Route avoids 14µg of toxic dust per commute!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
