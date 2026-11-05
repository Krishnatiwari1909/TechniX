import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PersonaType, CommuteMode } from '../../types';
import { 
  Activity, 
  Baby, 
  Bike, 
  ShieldCheck, 
  Clock, 
  Phone, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle,
  X,
  MapPin
} from 'lucide-react';

interface SetupWizardProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onClose }) => {
  const { userProfile, updateProfile, calculateMultiplier } = useApp();
  
  const [step, setStep] = useState<number>(1);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(userProfile.persona || 'runner');
  const [emergencyName, setEmergencyName] = useState<string>(userProfile.emergencyName || 'Partner / Family');
  const [emergencyContact, setEmergencyContact] = useState<string>(userProfile.emergencyContact || '+1 (555) 382-9912');
  const [commuteTime, setCommuteTime] = useState<string>(userProfile.commuteTime || '08:15');
  const [returnTime, setReturnTime] = useState<string>(userProfile.returnTime || '18:00');
  const [commuteMode, setCommuteMode] = useState<CommuteMode>(userProfile.commuteMode || 'bicycle');
  const [destination, setDestination] = useState<string>(userProfile.destination || 'IISc Bangalore Campus');
  const [sensitivities, setSensitivities] = useState<string[]>(userProfile.sensitivities || ['Asthma']);

  // Calculated multiplier in real time
  const currentMultiplier = calculateMultiplier(selectedPersona, commuteMode, sensitivities);

  const toggleSensitivity = (item: string) => {
    setSensitivities(prev => 
      prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
    );
  };

  const handleFinish = () => {
    updateProfile({
      persona: selectedPersona,
      emergencyName,
      emergencyContact,
      commuteTime,
      returnTime,
      commuteMode,
      destination,
      sensitivities,
      exposureMultiplier: currentMultiplier,
      onboardingCompleted: true
    });
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close setup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Wizard Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Setup Wizard • Step {step} of 3
            </span>
            <span className="text-xs text-slate-400">
              {step === 1 && 'Demographic Persona'}
              {step === 2 && 'Commute & Safety Contacts'}
              {step === 3 && 'Calculated Multiplier'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-700'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-700'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 3 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-700'}`} />
          </div>
        </div>

        {/* STEP 1: SELECT PERSONA */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Select Your Persona
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                AtmosAi customizes pollution inhalation models and early alerts specifically for your biological profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Runner */}
              <button
                type="button"
                onClick={() => setSelectedPersona('runner')}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all text-left ${
                  selectedPersona === 'runner'
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400'
                    : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'
                }`}
              >
                {selectedPersona === 'runner' && (
                  <div className="absolute top-3 right-3 text-cyan-400">
                    <CheckCircle2 className="w-5 h-5 fill-cyan-400/20" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-white">Runner</h3>
                <span className="text-[11px] text-cyan-300 font-medium px-2 py-0.5 mt-1 rounded-full bg-cyan-950 border border-cyan-800">
                  45-60 L/min air
                </span>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  High lung ventilation during outdoor workouts. Rapid accumulation of fine PM2.5.
                </p>
              </button>

              {/* Parent */}
              <button
                type="button"
                onClick={() => setSelectedPersona('parent')}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all text-left ${
                  selectedPersona === 'parent'
                    ? 'border-pink-400 bg-pink-950/40 shadow-[0_0_20px_rgba(244,114,182,0.25)] ring-1 ring-pink-400'
                    : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'
                }`}
              >
                {selectedPersona === 'parent' && (
                  <div className="absolute top-3 right-3 text-pink-400">
                    <CheckCircle2 className="w-5 h-5 fill-pink-400/20" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-3">
                  <Baby className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-white">Parent</h3>
                <span className="text-[11px] text-pink-300 font-medium px-2 py-0.5 mt-1 rounded-full bg-pink-950 border border-pink-800">
                  Stroller Height
                </span>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  Focus on infant alveoli protection and avoiding exhaust plume heights (&lt; 0.9m).
                </p>
              </button>

              {/* Commuter */}
              <button
                type="button"
                onClick={() => setSelectedPersona('commuter')}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all text-left ${
                  selectedPersona === 'commuter'
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400'
                    : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'
                }`}
              >
                {selectedPersona === 'commuter' && (
                  <div className="absolute top-3 right-3 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 fill-emerald-400/20" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <Bike className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-white">Commuter</h3>
                <span className="text-[11px] text-emerald-300 font-medium px-2 py-0.5 mt-1 rounded-full bg-emerald-950 border border-emerald-800">
                  Peak Rush Hour
                </span>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  Daily recurring transit exposure. Intelligent departure shifting to bypass congestion soot.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Continue to Commute Setup
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COMMUTE & SAFETY CONTACTS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Safety & Commute Schedule
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Configure your typical travel times for automated early-warning alerts and emergency fail-safes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Destination / College Location */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Primary Destination / College / Workplace
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. IISc Bangalore Campus, RV College, Electronic City Tech Park"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                />
              </div>

              {/* Emergency Contact Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Partner, Parent, Guardian"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm font-mono"
                />
              </div>

              {/* Morning Departure Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Morning Departure Time
                </label>
                <input
                  type="time"
                  value={commuteTime}
                  onChange={(e) => setCommuteTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white focus:outline-none focus:border-cyan-400 text-sm font-mono"
                />
              </div>

              {/* Evening Return Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Evening Return Time
                </label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white focus:outline-none focus:border-cyan-400 text-sm font-mono"
                />
              </div>
            </div>

            {/* Commute Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Primary Commute Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['bicycle', 'walking', 'transit', 'car'] as CommuteMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCommuteMode(mode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                      commuteMode === mode
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'border-white/10 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'transit' ? 'Public Transit' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensitivities */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Vulnerability Sensitivities (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {['Asthma', 'Cardiovascular', 'Allergies', 'None'].map((item) => {
                  const active = sensitivities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSensitivity(item)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        active
                          ? 'border-amber-400 bg-amber-950/60 text-amber-300 font-semibold'
                          : 'border-white/10 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Review Exposure Profile
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PROFILE READY SCREEN */}
        {step === 3 && (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Setup Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Your Profile is Ready
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
                We've synthesized your persona, commute mode, and health factors into a custom biometric exposure multiplier.
              </p>
            </div>

            {/* Multiplier Card */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Custom Exposure Multiplier
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">
                      {currentMultiplier}x
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      vs. standard baseline
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    {selectedPersona === 'runner' && 'High ventilation rate (45L/min) accumulates particulate dosage quickly during cardio.'}
                    {selectedPersona === 'parent' && 'Stroller altitude corresponds to peak exhaust stagnation boundary layer.'}
                    {selectedPersona === 'commuter' && 'Daily peak congestion exposure mitigated through intelligent time-shifting.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Persona:</span>
                    <span className="font-semibold text-white capitalize">{selectedPersona}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Commute Mode:</span>
                    <span className="font-semibold text-white capitalize">{commuteMode}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Departure:</span>
                    <span className="font-semibold text-cyan-300">{commuteTime} AM</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Destination:</span>
                    <span className="font-semibold text-cyan-300 truncate max-w-[140px]" title={destination}>{destination}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Emergency Alert:</span>
                    <span className="font-semibold text-emerald-300">Armed</span>
                  </div>
                </div>
              </div>

              {/* Protective Recommendation Pill */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  <strong className="text-emerald-400 font-semibold">Recommended Action:</strong> Shift departure by +25m during inversion alerts to reduce daily alveolar accumulation by ~42%.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)]"
              >
                Launch AtmosAi Dashboard
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SetupWizard;

