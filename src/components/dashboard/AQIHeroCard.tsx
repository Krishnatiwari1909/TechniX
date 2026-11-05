import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Wind, Droplets, Thermometer, RefreshCw, Cpu } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis } from 'recharts';

interface ForecastPoint {
  time: string;
  pm25: number;
}

export const AQIHeroCard: React.FC = () => {
  const { 
    pm25Level, 
    setPm25Level, 
    userProfile, 
    windSpeed, 
    windDirection, 
    userLocation
  } = useApp();

  // Phase 11: 3-Hour LightGBM Inversion Forecast data
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([
    { time: '02:30 AM', pm25: 52 },
    { time: '03:00 AM', pm25: 52 },
    { time: '03:30 AM', pm25: 53 },
    { time: '04:00 AM', pm25: 52 },
    { time: '04:30 AM', pm25: 52 },
    { time: '05:00 AM', pm25: 53 },
    { time: '05:30 AM', pm25: 53 },
  ]);

  useEffect(() => {
    let isCancelled = false;
    const fetchForecast = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/forecast');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data) && data.length > 0) {
            setForecastData(data);
          }
        }
      } catch (err) {
        console.warn('[AQIHeroCard] LightGBM forecast fetch error:', err);
      }
    };

    fetchForecast();
    const interval = setInterval(fetchForecast, 120000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

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

      {/* Phase 11 Task 2: 3-HOUR INVERSION FORECAST (LightGBM Regression) */}
      <div className="my-2 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            3-HOUR INVERSION FORECAST
          </span>
          <span className="font-mono text-emerald-800 text-[10px] font-bold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-700" />
            <span>Atmos Neural Regressor</span>
          </span>
        </div>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                tick={{ fontSize: 9, fill: '#94a3b8' }} 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }} 
              />
              <YAxis 
                domain={['dataMin - 6', 'dataMax + 6']} 
                stroke="#94a3b8" 
                tick={{ fontSize: 9, fill: '#94a3b8' }} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 font-mono shadow-md">
                        <span className="text-slate-400 block text-[9px]">{label}</span>
                        <strong className="text-emerald-700 font-bold">{payload[0].value} µg/m³</strong>
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
