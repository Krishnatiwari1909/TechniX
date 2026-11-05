import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Flame, Award, HeartPulse, Cigarette, Info, Sparkles, CheckCircle, Share2 } from 'lucide-react';

export const LungsSavedCard: React.FC = () => {
  const { userProfile } = useApp();
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const avoidedMicrograms = 4.2;
  const cigaretteEquivalence = 0.5;
  const weeklyAvoidedCigarettes = 3.8;

  const handleShare = () => {
    navigator.clipboard?.writeText(
      `🫁 Today I avoided 4.2µg of toxic PM2.5 (equal to 0.5 cigarettes) using AtmosAi Clean Routing! #CleanAir #AtmosAi`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Lungs Saved
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold">
              Health Impact & Toxicity Prevention
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title="How is this calculated?"
          aria-label="How is this calculated?"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Explainer Popover */}
      {showExplanation && (
        <div className="my-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-700 space-y-1 z-20 animate-in fade-in duration-200">
          <p className="font-semibold text-emerald-800">Berkeley Earth Environmental Equivalence:</p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Inhaling 22 µg/m³ of PM2.5 continuously for 24 hours delivers the equivalent alveolar inflammation of smoking <strong>1 cigarette</strong>. AtmosAi calculates avoided microgram dosages through route selection and time-shifting.
          </p>
        </div>
      )}

      {/* Centerpiece: Equivalence Display */}
      <div className="my-4 p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 relative z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="text-center sm:text-left">
            <div className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Avoided Today
            </div>
            <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                {avoidedMicrograms} µg
              </span>
              <span className="text-xs font-bold text-emerald-700">PM2.5</span>
            </div>

            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-slate-700 shadow-sm">
              <Cigarette className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Equivalent to <strong className="text-slate-900 font-bold">{cigaretteEquivalence} cigarettes</strong> avoided</span>
            </div>
          </div>

          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-stone-200"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-600"
                strokeDasharray="75, 100"
                strokeWidth="3.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-800">75%</span>
              <span className="text-[8px] text-slate-500">Target</span>
            </div>
          </div>

        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-2 gap-3 z-10">
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Clean Streak</span>
            <span className="text-xs font-bold text-slate-900">6 Days Active</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Weekly Total</span>
            <span className="text-xs font-bold text-slate-900">{weeklyAvoidedCigarettes} Cigs Saved</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between z-10">
        <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Persona Shield Active ({userProfile.persona})
        </span>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-900 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Copied Stats!' : 'Share Milestone'}
        </button>
      </div>
    </div>
  );
};

export default LungsSavedCard;
