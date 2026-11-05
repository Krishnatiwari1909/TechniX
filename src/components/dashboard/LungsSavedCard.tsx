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
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Lungs Saved
            </h3>
            <span className="text-[11px] text-emerald-300 font-medium">
              Health Impact & Toxicity Prevention
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="How is this calculated?"
          aria-label="How is this calculated?"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Explainer Popover */}
      {showExplanation && (
        <div className="my-2 p-3 rounded-xl bg-slate-900/95 border border-white/15 text-xs text-slate-300 space-y-1 z-20 animate-in fade-in duration-200">
          <p className="font-semibold text-emerald-400">Berkeley Earth Environmental Equivalence:</p>
          <p className="text-[11px] leading-relaxed">
            Inhaling 22 µg/m³ of PM2.5 continuously for 24 hours delivers the equivalent alveolar inflammation of smoking <strong>1 cigarette</strong>. AtmosAi calculates avoided microgram dosages through route selection and time-shifting.
          </p>
        </div>
      )}

      {/* Centerpiece: Equivalence Display */}
      <div className="my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/40 border border-emerald-500/25 relative z-10 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="text-center sm:text-left">
            <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Avoided Today
            </div>
            <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-400 font-mono">
                {avoidedMicrograms} µg
              </span>
              <span className="text-xs font-semibold text-emerald-400">PM2.5</span>
            </div>

            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs font-medium text-emerald-300">
              <Cigarette className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Equivalent to <strong className="text-white font-bold">{cigaretteEquivalence} cigarettes</strong> avoided</span>
            </div>
          </div>

          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400"
                strokeDasharray="75, 100"
                strokeWidth="3.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-200">75%</span>
              <span className="text-[8px] text-slate-400">Target</span>
            </div>
          </div>

        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-2 gap-3 z-10">
        <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Clean Streak</span>
            <span className="text-xs font-bold text-white">6 Days Active</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Weekly Total</span>
            <span className="text-xs font-bold text-white">{weeklyAvoidedCigarettes} Cigs Saved</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between z-10">
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Persona Shield Active ({userProfile.persona})
        </span>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/50 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Copied Stats!' : 'Share Milestone'}
        </button>
      </div>
    </div>
  );
};

export default LungsSavedCard;

