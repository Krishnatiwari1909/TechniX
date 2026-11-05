import React from 'react';
import { RouteMap } from '../map/RouteMap';
import { useApp } from '../../context/AppContext';
import { Navigation, ShieldCheck, TreePine, AlertTriangle, Sparkles } from 'lucide-react';

export const MapView: React.FC = () => {
  const { userProfile } = useApp();

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-100 text-emerald-700">
              <Navigation className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-700">
              Intelligent Routing Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Clean Air Navigation Corridors
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Toggle between the high-exposure arterial highway and the low-particulate vegetative canopy route in Bengaluru.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-700 self-start sm:self-auto shadow-2xs">
          <TreePine className="w-4 h-4 text-emerald-600" />
          <span>Biomass Leaf Absorption: <strong className="text-emerald-800 font-mono font-bold">68%</strong></span>
        </div>
      </div>

      {/* Main React-Leaflet RouteMap Component */}
      <RouteMap />

      {/* Corridor Air Quality Deep Dive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Vegetative Shielding</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Healthiest Route passes through the Cubbon green buffer, filtering fine and ultrafine particles naturally before reaching respiration height.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-700 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Arterial Diesel Vortex</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Fastest Route follows the main commercial arterial road where high diesel truck density causes deep alveolar particulate accumulation.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-teal-700 mb-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Demographic Savings</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            For your <span className="text-emerald-800 font-bold capitalize">{userProfile.persona}</span> profile ({userProfile.exposureMultiplier}x), switching to the Healthiest Route avoids 14µg of toxic dust per commute!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
