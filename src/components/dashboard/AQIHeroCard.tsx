import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wind, Droplets, Thermometer, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis } from 'recharts';

export const AQIHeroCard: React.FC = () => {
  const { 
    pm25Level, 
    setPm25Level, 
    userProfile, 
    windSpeed, 
    windDirection, 
    telemetryHistory,
    userLocation
  } = useApp();

  const aqiScore = Math.round(pm25Level * 1.35);

  let category = 'Good';
  let categoryColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';

  if (pm25Level > 150) {
    category = 'Hazardous Spike';
    categoryColor = 'text-rose-800 bg-rose-50 border-rose-200';
  } else if (pm25Level > 75) {
    category = 'Unhealthy for Sensitive Groups';
    categoryColor = 'text-amber-900 bg-amber-50 border-amber-300';
  } else if (pm25Level > 35) {
    category = 'Moderate Air';
    categoryColor = 'text-amber-800 bg-amber-50 border-amber-200';
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-emerald-700">
              Live Environmental Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {userLocation?.locality ? `${userLocation.locality} • Live GPS Sensor` : 'Bengaluru Urban Corridor • Station #AGY-09'}
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
            <span className="text-[10px] uppercase font-bold text-slate-500">Current PM2.5</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 font-mono tracking-tight">
                {pm25Level}
              </span>
              <span className="text-sm font-bold text-slate-500">µg/m³</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
            <span className="font-medium">Air Quality Index (AQI)</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{aqiScore}</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pm25Level > 75 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
              }`}
              style={{ width: `${Math.min((pm25Level / 220) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-2">
            Personal Impact: <strong className="text-emerald-700 font-semibold">{userProfile.exposureMultiplier}x</strong> exposure multiplier
          </span>
        </div>
      </div>

      {/* Rolling Telemetry Sparkline (Capped at 10 Data Points) */}
      <div className="my-2 p-3 rounded-xl bg-stone-50 border border-stone-200/60">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Rolling Sensor Telemetry (10-Point Window)
          </span>
          <span className="font-mono text-emerald-800 text-[10px] font-bold">
            Live: <strong className="text-slate-900">{pm25Level} µg/m³</strong>
          </span>
        </div>
        <div className="h-14 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <YAxis domain={['dataMin - 4', 'dataMax + 4']} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-stone-200 px-2 py-1 rounded text-[10px] text-slate-800 font-mono shadow-md">
                        {payload[0].value} µg/m³
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="pm25"
                stroke="#059669"
                strokeWidth={2.2}
                dot={{ r: 2.5, fill: '#059669', strokeWidth: 0 }}
                activeDot={{ r: 4.5, fill: '#047857', stroke: '#fff', strokeWidth: 1.5 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weather Telemetry Row */}
      <div className="grid grid-cols-3 gap-2 my-2 py-3 border-y border-stone-200/80 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block">Temperature</span>
            <span className="font-semibold font-mono text-slate-800">24.5 °C</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block">Humidity</span>
            <span className="font-semibold font-mono text-slate-800">68% RH</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-teal-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block">Wind Vector</span>
            <span className="font-semibold font-mono text-slate-800">{windSpeed} km/h • {windDirection}°</span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Background Simulator Controls */}
      <div className="mt-3 pt-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-medium flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
            Simulate PM2.5 Level (watch 3D particles react):
          </span>
          <span className="font-mono text-emerald-800 font-bold">{pm25Level} µg/m³</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setPm25Level(22)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              pm25Level <= 35
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-stone-100 border-stone-200 text-slate-600 hover:bg-stone-200'
            }`}
          >
            Clean (22)
          </button>
          <button
            type="button"
            onClick={() => setPm25Level(58)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              pm25Level > 35 && pm25Level <= 75
                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                : 'bg-stone-100 border-stone-200 text-slate-600 hover:bg-stone-200'
            }`}
          >
            Moderate (58)
          </button>
          <button
            type="button"
            onClick={() => setPm25Level(128)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              pm25Level > 75 && pm25Level <= 160
                ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                : 'bg-stone-100 border-stone-200 text-slate-600 hover:bg-stone-200'
            }`}
          >
            Unhealthy (128)
          </button>
          <button
            type="button"
            onClick={() => setPm25Level(210)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              pm25Level > 160
                ? 'bg-red-700 border-red-700 text-white shadow-sm'
                : 'bg-stone-100 border-stone-200 text-slate-600 hover:bg-stone-200'
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
