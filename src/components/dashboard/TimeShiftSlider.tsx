import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, ArrowDownRight, Sparkles } from 'lucide-react';

const TIME_STEPS = [
  { label: '06:00 AM', pm25: 56, rating: 'Moderate' },
  { label: '06:15 AM', pm25: 64, rating: 'Moderate' },
  { label: '06:30 AM', pm25: 72, rating: 'Moderate' },
  { label: '06:45 AM', pm25: 80, rating: 'Unhealthy Sensitive' },
  { label: '07:00 AM', pm25: 88, rating: 'Unhealthy Sensitive' },
  { label: '07:15 AM', pm25: 98, rating: 'Unhealthy' },
  { label: '07:30 AM', pm25: 118, rating: 'Unhealthy' },
  { label: '07:45 AM', pm25: 135, rating: 'Very Unhealthy' },
  { label: '08:00 AM', pm25: 148, rating: 'Peak Surge' },
  { label: '08:15 AM', pm25: 162, rating: 'Peak Surge' },
  { label: '08:30 AM', pm25: 170, rating: 'Severe Peak' },
  { label: '08:45 AM', pm25: 165, rating: 'Severe Peak' },
  { label: '09:00 AM', pm25: 154, rating: 'Peak Surge' },
  { label: '09:15 AM', pm25: 140, rating: 'Unhealthy' },
  { label: '09:30 AM', pm25: 125, rating: 'Unhealthy' },
  { label: '09:45 AM', pm25: 110, rating: 'Unhealthy Sensitive' },
  { label: '10:00 AM', pm25: 92, rating: 'Unhealthy Sensitive' },
  { label: '10:15 AM', pm25: 78, rating: 'Moderate' },
  { label: '10:30 AM', pm25: 62, rating: 'Clean Corridor' }
];

export const TimeShiftSlider: React.FC = () => {
  const { departureTimeIndex, setDepartureTimeIndex, userProfile, setPm25Level } = useApp();

  const currentStep = TIME_STEPS[departureTimeIndex] || TIME_STEPS[8];
  const maxStepPM25 = 170;

  const exposureMetrics = useMemo(() => {
    const rawPM = currentStep.pm25;
    const multiplier = userProfile.exposureMultiplier || 1.8;
    const inhaledMicrograms = Math.round((rawPM * 0.45 * multiplier) * 10) / 10;
    
    const peakInhaled = Math.round((maxStepPM25 * 0.45 * multiplier) * 10) / 10;
    const reductionPercent = Math.max(0, Math.round(((peakInhaled - inhaledMicrograms) / peakInhaled) * 100));

    let badgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    if (rawPM > 140) {
      badgeColor = 'text-red-400 bg-red-950/60 border-red-500/30';
    } else if (rawPM > 85) {
      badgeColor = 'text-amber-400 bg-amber-950/60 border-amber-500/30';
    }

    return {
      rawPM,
      inhaledMicrograms,
      reductionPercent,
      badgeColor
    };
  }, [currentStep, userProfile.exposureMultiplier]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setDepartureTimeIndex(val);
    setPm25Level(TIME_STEPS[val].pm25);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between space-y-5">
      {/* EXPECTED EXPOSURE METRIC CARD */}
      <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 overflow-hidden shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                Expected Exposure Metric
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${exposureMetrics.badgeColor}`}>
                {currentStep.rating}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {exposureMetrics.inhaledMicrograms}
                <span className="text-lg font-bold text-slate-400 ml-1">µg</span>
              </span>
              <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                <ArrowDownRight className="w-4 h-4" />
                <span>{exposureMetrics.reductionPercent}% vs Peak</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mt-1">
              Estimated alveolar deposit for your <strong className="text-slate-200 capitalize">{userProfile.persona}</strong> profile ({userProfile.exposureMultiplier}x factor).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 sm:text-right shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Ambient PM2.5</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {exposureMetrics.rawPM} <span className="text-xs text-slate-400">µg/m³</span>
            </span>
          </div>
        </div>

        {/* Dynamic AI Recommendation banner */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span className="text-slate-300">
            {departureTimeIndex >= 8 && departureTimeIndex <= 13 ? (
              <span className="text-amber-300">
                <strong>Severe Inversion Warning:</strong> Leaving between 08:00 - 09:15 AM increases diesel soot intake. Shift to <strong>07:15 AM</strong> (-44% dose) or <strong>10:15 AM</strong> (-52% dose).
              </span>
            ) : (
              <span className="text-emerald-300">
                <strong>Clean Air Window:</strong> Outstanding departure choice! Air dispersion is active and particulate intake is down by <strong>{exposureMetrics.reductionPercent}%</strong>.
              </span>
            )}
          </span>
        </div>
      </div>

      {/* THE THICK, TOUCH-FRIENDLY TIME-SHIFT SLIDER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Departure Time: <span className="text-cyan-300 font-mono text-base">{currentStep.label}</span></span>
          </label>
          <span className="text-xs text-slate-400 font-medium">
            Drag to compare exposure
          </span>
        </div>

        <div className="relative py-2">
          <input
            type="range"
            min={0}
            max={TIME_STEPS.length - 1}
            step={1}
            value={departureTimeIndex}
            onChange={handleSliderChange}
            className="touch-slider"
            aria-label="Departure Time Slider"
          />
        </div>

        {/* Time Ticks */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
          <span>06:00 AM (Low)</span>
          <span className="text-amber-400/80">08:30 AM (Peak Smog)</span>
          <span>10:30 AM (Dispersal)</span>
        </div>

        {/* Quick Shift Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Quick Shifts:</span>
          <button
            type="button"
            onClick={() => {
              setDepartureTimeIndex(4);
              setPm25Level(TIME_STEPS[4].pm25);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10 font-medium transition-all"
          >
            Early (07:00 AM)
          </button>
          <button
            type="button"
            onClick={() => {
              setDepartureTimeIndex(10);
              setPm25Level(TIME_STEPS[10].pm25);
            }}
            className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-[11px] text-red-300 border border-red-500/20 font-medium transition-all"
          >
            Peak Hour (08:30 AM)
          </button>
          <button
            type="button"
            onClick={() => {
              setDepartureTimeIndex(18);
              setPm25Level(TIME_STEPS[18].pm25);
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-[11px] text-emerald-300 border border-emerald-500/20 font-medium transition-all"
          >
            Cleanest (10:30 AM)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeShiftSlider;

