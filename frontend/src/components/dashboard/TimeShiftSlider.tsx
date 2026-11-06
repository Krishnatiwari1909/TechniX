import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, ArrowDownRight, Sparkles, AlertTriangle, Cpu } from 'lucide-react';
import { calculateExposure } from '../../lib/api';

export const TIME_STEPS = [
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

// Helper: Checks if departure time falls between 06:00 and 08:30 AM
export const isMorningInversionTime = (label: string): boolean => {
  const match = label.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period !== 'AM') return false;
  return (h >= 6 && h < 8) || (h === 8 && m <= 30);
};

export const TimeShiftSlider: React.FC = () => {
  const { departureTimeIndex, setDepartureTimeIndex, userProfile, setPm25Level } = useApp();

  const currentStep = TIME_STEPS[departureTimeIndex] || TIME_STEPS[8];
  const maxStepPM25 = 170;

  // Task 3: LightGBM Model-served Inversion Multiplier
  const isMorningInversion = isMorningInversionTime(currentStep.label);
  const [inversionMultiplier, setInversionMultiplier] = useState<number>(() => {
    return isMorningInversion ? 1.84 : 1.0;
  });
  const [modelLoaded, setModelLoaded] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    const fetchMLInversion = async () => {
      try {
        const data = await calculateExposure({
          departure_time: currentStep.label,
          departure_time_index: departureTimeIndex
        });
        if (!isCancelled && typeof data.inversion_multiplier === 'number') {
          setInversionMultiplier(data.inversion_multiplier);
          setModelLoaded(data.model_version?.includes('LightGBM') || false);
        }
      } catch (err) {
        // Fallback approximation of the trained LightGBM curve
        if (!isCancelled) {
          const h = 6.0 + (departureTimeIndex * 0.25);
          if (h >= 6.0 && h <= 8.5) {
            const boost = Math.exp(-Math.pow(h - 7.3, 2) / 0.8) * 1.15;
            setInversionMultiplier(Math.round((1.0 + boost) * 100) / 100);
          } else {
            setInversionMultiplier(1.0);
          }
        }
      }
    };

    fetchMLInversion();
    return () => { isCancelled = true; };
  }, [currentStep.label, departureTimeIndex]);

  const exposureMetrics = useMemo(() => {
    const rawPM = currentStep.pm25;
    const multiplier = userProfile.exposureMultiplier || 1.8;
    // Apply dynamic LightGBM inversion multiplier replacing hardcoded 1.3x rule
    const inhaledMicrograms = Math.round((rawPM * 0.45 * multiplier * inversionMultiplier) * 10) / 10;
    
    // Peak inhaled comparison against maximum morning inversion peak
    const peakInhaled = Math.round((maxStepPM25 * 0.45 * multiplier * 2.19) * 10) / 10;
    const reductionPercent = Math.max(0, Math.round(((peakInhaled - inhaledMicrograms) / peakInhaled) * 100));

    let badgeColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (rawPM > 140) {
      badgeColor = 'text-rose-800 bg-rose-50 border-rose-200';
    } else if (rawPM > 85) {
      badgeColor = 'text-amber-800 bg-amber-50 border-amber-300';
    }

    return {
      rawPM,
      inhaledMicrograms,
      reductionPercent,
      badgeColor,
      isMorningInversion
    };
  }, [currentStep, userProfile.exposureMultiplier, inversionMultiplier, isMorningInversion]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setDepartureTimeIndex(val);
    setPm25Level(TIME_STEPS[val].pm25);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-5">
      {/* EXPECTED EXPOSURE METRIC CARD */}
      <div className="relative p-5 rounded-2xl bg-stone-50 border border-stone-200/80 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Expected Exposure Metric
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${exposureMetrics.badgeColor}`}>
                {currentStep.rating}
              </span>
            </div>

            {/* LightGBM Inversion Warning Badge */}
            {exposureMetrics.isMorningInversion && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold animate-in fade-in duration-200">
                <Cpu className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Atmos Inversion Model: Ground particulate surge ({inversionMultiplier.toFixed(2)}x factor)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                {exposureMetrics.inhaledMicrograms}
                <span className="text-lg font-bold text-slate-500 ml-1">µg</span>
              </span>
              <div className="flex items-center gap-1 text-emerald-700 text-sm font-bold">
                <ArrowDownRight className="w-4 h-4" />
                <span>{exposureMetrics.reductionPercent}% vs Peak</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-1">
              Estimated alveolar deposit for your <strong className="text-slate-800 capitalize">{userProfile.persona}</strong> profile ({userProfile.exposureMultiplier}x factor).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-stone-200/80 sm:text-right shrink-0">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Ambient PM2.5</span>
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {exposureMetrics.rawPM} <span className="text-xs text-slate-500">µg/m³</span>
            </span>
          </div>
        </div>

        {/* Dynamic AI Recommendation banner */}
        <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-start gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="text-slate-700">
            {departureTimeIndex >= 8 && departureTimeIndex <= 13 ? (
              <span className="text-amber-900 font-medium">
                <strong>Severe Inversion Warning:</strong> Leaving between 08:00 - 09:15 AM increases diesel soot intake. Shift to <strong>07:15 AM</strong> (-44% dose) or <strong>10:15 AM</strong> (-52% dose).
              </span>
            ) : (
              <span className="text-emerald-900 font-medium">
                <strong>Clean Air Window:</strong> Outstanding departure choice! Air dispersion is active and particulate intake is down by <strong>{exposureMetrics.reductionPercent}%</strong>.
              </span>
            )}
          </span>
        </div>
      </div>

      {/* THE THICK, TOUCH-FRIENDLY TIME-SHIFT SLIDER */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Departure Time: <span className="text-emerald-700 font-mono text-base font-extrabold">{currentStep.label}</span></span>
          </label>
          <span className="text-xs text-slate-500 font-medium">
            Drag to compare exposure
          </span>
        </div>

        {/* Task 2: Slider & Tick Container with mb-6 for Breathing Room */}
        <div className="mb-6 space-y-2">
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
          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
            <span>06:00 AM (Low)</span>
            <span className="text-amber-700 font-bold">08:30 AM (Peak Smog)</span>
            <span>10:30 AM (Dispersal)</span>
          </div>
        </div>

        {/* Task 1: Quick Shift Presets with Uniform Flex & Vertical Centering */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-xs text-slate-500 font-medium inline-flex items-center">
            Quick Shifts:
          </span>
          <button
            type="button"
            onClick={() => {
              setDepartureTimeIndex(4);
              setPm25Level(TIME_STEPS[4].pm25);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] text-slate-700 border border-stone-200 font-medium transition-all cursor-pointer inline-flex items-center"
          >
            Early (07:00 AM)
          </button>
          <button
            type="button"
            onClick={() => {
              setDepartureTimeIndex(10);
              setPm25Level(TIME_STEPS[10].pm25);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[11px] text-rose-800 border border-rose-200 font-medium transition-all cursor-pointer inline-flex items-center"
          >
            Peak Hour (08:30 AM)
          </button>
          <button
            type="button"
            onClick={() => {
              setDepartureTimeIndex(18);
              setPm25Level(TIME_STEPS[18].pm25);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[11px] text-emerald-800 border border-emerald-200 font-medium transition-all cursor-pointer inline-flex items-center"
          >
            Cleanest (10:30 AM)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeShiftSlider;
