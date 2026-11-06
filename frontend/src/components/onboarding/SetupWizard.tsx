import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PersonaType, CommuteMode } from '../../types';
import { supabase } from '../../supabaseClient';
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
  const [userName, setUserName] = useState<string>(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('atmos_auth') || '{}');
      if (auth.name) return auth.name;
    } catch {}
    return localStorage.getItem('atmosai_user_name') || userProfile.name || 'Commuter';
  });
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
    if (item === 'None') {
      setSensitivities(['None']);
      return;
    }
    setSensitivities(prev => {
      const clean = prev.filter(s => s !== 'None');
      return clean.includes(item) ? clean.filter(s => s !== item) : [...clean, item];
    });
  };

  const handleSaveAndRedirect = async () => {
    const wizardData = {
      commuteMode,
      sensitivities,
      name: userName || userProfile.name || 'Commuter',
      persona: selectedPersona,
      destination,
      emergencyName,
      emergencyContact,
      commuteTime,
      returnTime,
      exposureMultiplier: currentMultiplier,
      onboardingCompleted: true
    };

    // 1. Attempt database persistence if user has an authenticated session
    let dbPersisted = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUser = user || (() => {
        try {
          const auth = JSON.parse(localStorage.getItem('atmos_auth') || '{}');
          return auth.id ? { id: auth.id } : null;
        } catch {
          return null;
        }
      })();

      if (currentUser?.id) {
        const { error } = await supabase.from('profiles').upsert({
          user_id: currentUser.id,
          name: wizardData.name,
          commute_mode: wizardData.commuteMode,
          sensitivities: wizardData.sensitivities,
          persona: wizardData.persona,
          destination: wizardData.destination,
          emergency_name: wizardData.emergencyName,
          emergency_contact: wizardData.emergencyContact,
          commute_time: wizardData.commuteTime,
          return_time: wizardData.returnTime,
          exposure_multiplier: wizardData.exposureMultiplier,
          updated_at: new Date().toISOString()
        });

        if (error) {
          console.warn('[SetupWizard] Supabase profiles upsert notice:', error);
        } else {
          dbPersisted = true;
        }
      }
    } catch (dbErr) {
      console.warn('[SetupWizard] Supabase insert warning:', dbErr);
    }

    // 2. Always persist locally for offline resilience & guest support
    updateProfile(wizardData);
    try {
      localStorage.setItem('atmos_profile', JSON.stringify({
        commuteMode,
        sensitivities,
        ...wizardData,
        _db_persisted: dbPersisted
      }));
      localStorage.setItem('atmosai_user_profile_v2', JSON.stringify(wizardData));
      localStorage.setItem('atmosai_visited', 'true');
      localStorage.setItem('atmosai_authenticated', 'true');
    } catch (e) {
      console.warn('[SetupWizard] localStorage save notice:', e);
    }

    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close setup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Wizard Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Setup Wizard • Step {step} of 3
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {step === 1 && 'Demographic Persona'}
              {step === 2 && 'Commute & Safety Contacts'}
              {step === 3 && 'Calculated Multiplier'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? 'bg-emerald-600' : 'bg-stone-200'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? 'bg-emerald-600' : 'bg-stone-200'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 3 ? 'bg-emerald-600' : 'bg-stone-200'}`} />
          </div>
        </div>

        {/* STEP 1: SELECT PERSONA */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Select Your Persona
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                AtmosAi customizes pollution inhalation models and early alerts specifically for your biological profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Runner */}
              <button
                type="button"
                onClick={() => setSelectedPersona('runner')}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedPersona === 'runner'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 shadow-sm'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-800'
                }`}
              >
                {selectedPersona === 'runner' && (
                  <div className="absolute top-3 right-3 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Runner</h3>
                <span className="text-[11px] text-emerald-800 font-medium px-2 py-0.5 mt-1 rounded-full bg-white border border-emerald-200">
                  45-60 L/min air
                </span>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                  High lung ventilation during outdoor workouts. Rapid accumulation of fine PM2.5.
                </p>
              </button>

              {/* Parent */}
              <button
                type="button"
                onClick={() => setSelectedPersona('parent')}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedPersona === 'parent'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 shadow-sm'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-800'
                }`}
              >
                {selectedPersona === 'parent' && (
                  <div className="absolute top-3 right-3 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
                  <Baby className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Parent</h3>
                <span className="text-[11px] text-rose-800 font-medium px-2 py-0.5 mt-1 rounded-full bg-white border border-rose-200">
                  Stroller Height
                </span>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                  Focus on infant alveoli protection and avoiding exhaust plume heights (&lt; 0.9m).
                </p>
              </button>

              {/* Commuter */}
              <button
                type="button"
                onClick={() => setSelectedPersona('commuter')}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedPersona === 'commuter'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 shadow-sm'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-800'
                }`}
              >
                {selectedPersona === 'commuter' && (
                  <div className="absolute top-3 right-3 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-3">
                  <Bike className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Commuter</h3>
                <span className="text-[11px] text-teal-800 font-medium px-2 py-0.5 mt-1 rounded-full bg-white border border-teal-200">
                  Peak Rush Hour
                </span>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                  Daily recurring transit exposure. Intelligent departure shifting to bypass congestion soot.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm cursor-pointer"
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
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Safety & Commute Schedule
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Configure your typical travel times for automated early-warning alerts and emergency fail-safes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Destination / College Location */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Primary Destination / College / Workplace
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. IISc Bangalore Campus, RV College, Electronic City Tech Park"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              {/* Emergency Contact Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Partner, Parent, Guardian"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm font-mono"
                />
              </div>

              {/* Morning Departure Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Morning Departure Time
                </label>
                <input
                  type="time"
                  value={commuteTime}
                  onChange={(e) => setCommuteTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-emerald-600 text-sm font-mono"
                />
              </div>

              {/* Evening Return Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Evening Return Time
                </label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-800 focus:outline-none focus:border-emerald-600 text-sm font-mono"
                />
              </div>
            </div>

            {/* Commute Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Primary Commute Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    { id: 'car', label: 'Car' },
                    { id: 'transit', label: 'Public Transit' },
                    { id: 'walking', label: 'Walking' },
                    { id: 'bicycle', label: 'Bicycle' },
                    { id: 'two-wheeler', label: 'Two-Wheeler' }
                  ] as { id: CommuteMode; label: string }[]
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCommuteMode(id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      commuteMode === id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-slate-600 hover:bg-stone-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensitivities */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
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
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-slate-600 hover:bg-stone-100'
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
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-slate-600 hover:text-slate-900 hover:bg-stone-100 text-sm font-medium transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveAndRedirect}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm cursor-pointer"
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
            <div className="inline-flex p-3 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 mb-1">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Setup Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Your Profile is Ready
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                We've synthesized your persona, commute mode, and health factors into a custom biometric exposure multiplier.
              </p>
            </div>

            {/* Multiplier Card */}
            <div className="relative p-6 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-sm text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                    Custom Exposure Multiplier
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-700 font-mono">
                      {currentMultiplier}x
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      vs. standard baseline
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {selectedPersona === 'runner' && 'High ventilation rate (45L/min) accumulates particulate dosage quickly during cardio.'}
                    {selectedPersona === 'parent' && 'Stroller altitude corresponds to peak exhaust stagnation boundary layer.'}
                    {selectedPersona === 'commuter' && 'Daily peak congestion exposure mitigated through intelligent time-shifting.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Persona:</span>
                    <span className="font-semibold text-slate-900 capitalize">{selectedPersona}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Commute Mode:</span>
                    <span className="font-semibold text-slate-900 capitalize">{commuteMode}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Departure:</span>
                    <span className="font-semibold text-emerald-700">{commuteTime} AM</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-semibold text-emerald-700 truncate max-w-[140px]" title={destination}>{destination}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Emergency Alert:</span>
                    <span className="font-semibold text-emerald-700">Armed</span>
                  </div>
                </div>
              </div>

              {/* Protective Recommendation Pill */}
              <div className="mt-4 pt-4 border-t border-stone-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs text-slate-700">
                  <strong className="text-emerald-800 font-semibold">Recommended Action:</strong> Shift departure by +25m during inversion alerts to reduce daily alveolar accumulation by ~42%.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-slate-600 hover:text-slate-900 hover:bg-stone-100 text-sm font-medium transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveAndRedirect}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
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
