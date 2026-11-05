import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { INITIAL_HOURLY_DATA } from '../../data/mockData';
import { TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const actual = payload.find(p => p.dataKey === 'actualPM25')?.value;
    const predicted = payload.find(p => p.dataKey === 'predictedPM25')?.value;

    return (
      <div className="glass-panel p-3.5 rounded-xl border border-white/20 shadow-2xl text-xs space-y-1.5 backdrop-blur-xl">
        <div className="font-semibold text-slate-300 border-b border-white/10 pb-1 flex items-center justify-between gap-4">
          <span>Time: {label}</span>
          <span className="text-[10px] text-cyan-400 font-mono">AWS Bedrock LightGBM</span>
        </div>
        {actual !== undefined && actual !== null ? (
          <div className="flex items-center justify-between gap-3 text-red-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              Actual PM2.5:
            </span>
            <span className="font-mono font-bold text-white">{actual} µg/m³</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            Future Forecast Horizon
          </div>
        )}
        <div className="flex items-center justify-between gap-3 text-cyan-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-dashed" />
            Predicted PM2.5:
          </span>
          <span className="font-mono font-bold text-white">{predicted} µg/m³</span>
        </div>
        {actual !== undefined && actual !== null && (
          <div className="text-[10px] text-emerald-400 pt-1 border-t border-white/10 flex items-center justify-between">
            <span>Model Variance:</span>
            <span className="font-mono">{Math.abs(actual - predicted)} µg/m³ (97.4% match)</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PredictedVsActualChart: React.FC = () => {
  const [data] = useState(INITIAL_HOURLY_DATA);

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              PM2.5: Predicted vs. Actual
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rolling 16-hour evaluation from IoT telemetry & LightGBM machine learning
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-red-500/30 text-red-300">
            <span className="w-3 h-0.5 bg-red-500 rounded-full" />
            <span className="font-medium">Actual PM2.5</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
            <span className="font-medium">Predicted (LightGBM)</span>
          </div>
        </div>
      </div>

      {/* Recharts Line Graph */}
      <div className="w-full h-64 sm:h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {/* Clean, no harsh grid lines */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255, 255, 255, 0.05)"
            />
            
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit=" µg"
              domain={[0, 190]}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Threshold Reference Line: WHO Unhealthy Guideline */}
            <ReferenceLine
              y={75}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: 'WHO Severe Surge: 75 µg',
                position: 'insideTopRight',
                fill: '#f59e0b',
                fontSize: 10,
                opacity: 0.7
              }}
            />

            {/* Solid Red Line: Actual PM2.5 */}
            <Line
              type="monotone"
              dataKey="actualPM25"
              name="Actual PM2.5"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#1e1b4b' }}
              activeDot={{ r: 7, fill: '#f87171', stroke: '#ffffff', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={true}
            />

            {/* Dashed Blue Line: Predicted PM2.5 */}
            <Line
              type="monotone"
              dataKey="predictedPM25"
              name="Predicted PM2.5"
              stroke="#38bdf8"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model Insight Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Model Accuracy: R² = 0.941 • Mean Absolute Error: 4.8 µg/m³</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span>Next predicted peak: 06:00 PM (154 µg/m³)</span>
        </div>
      </div>
    </div>
  );
};

export default PredictedVsActualChart;

