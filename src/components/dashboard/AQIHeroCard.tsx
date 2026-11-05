import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wind, Droplets, Thermometer, RefreshCw } from 'lucide-react';

export const AQIHeroCard: React.FC = () => {
  const { pm25Level, setPm25Level, userProfile } = useApp();

  const aqiScore = Math.round(pm25Level * 1.35);

  let category = 'Good';
  let categoryColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';

  if (pm25Level > 150) {
    category = 'Hazardous Spike';
    categoryColor = 'text-red-400 bg-red-950/80 border-red-500/50';
  } else if (pm25Level > 75) {
    category = 'Unhealthy for Sensitive Groups';
    categoryColor = 'text-rose-400 bg-rose-950/60 border-rose-500/40';
  } else if (pm25Level > 35) {
    category = 'Moderate Air';
    categoryColor = 'text-amber-400 bg-amber-950/60 border-amber-500/40';
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
              Live Environmental Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Bengaluru Urban Corridor • Station #AGY-09
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryColor} shadow-sm self-start sm:self-auto`}>
          {category}
        </div>
      </div>

      {/* Main Metric Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-2">
        <div className="flex items-baseline gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current PM2.5</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {pm25Level}
              </span>
              <span className="text-sm font-bold text-slate-400">µg/m³</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Air Quality Index (AQI)</span>
            <span className="font-mono font-bold text-white text-sm">{aqiScore}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pm25Level > 75 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
              }`}
              style={{ width: `${Math.min((pm25Level / 220) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1.5">
            Personal Impact: <strong className="text-cyan-300 font-semibold">{userProfile.exposureMultiplier}x</strong> exposure multiplier
          </span>
        </div>
      </div>

      {/* Weather Telemetry Row */}
      <div className="grid grid-cols-3 gap-2 my-2 py-3 border-y border-white/5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Temperature</span>
            <span className="font-semibold font-mono">24.5 °C</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Humidity</span>
            <span className="font-semibold font-mono">68% RH</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Wind Speed</span>
            <span className="font-semibold font-mono">2.8 m/s WSW</span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Background Simulator Controls */}
      <div className="mt-3 pt-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
            Simulate PM2.5 Level (watch 3D particles react):
          </span>
          <span className="font-mono text-cyan-300 font-bold">{pm25Level} µg/m³</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setPm25Level(22)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              pm25Level <= 35
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Clean (22)
          </button>
          <button
            type="button"
            onClick={() => setPm25Level(58)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              pm25Level > 35 && pm25Level <= 75
                ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Moderate (58)
          </button>
          <button
            type="button"
            onClick={() => setPm25Level(128)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              pm25Level > 75 && pm25Level <= 160
                ? 'bg-rose-950/80 border-rose-400 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Unhealthy (128)
          </button>
          <button
            type="button"
            onClick={() => setPm25Level(210)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              pm25Level > 160
                ? 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Hazard (210)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AQIHeroCard;

