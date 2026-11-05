import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, calculateDynamicMultiplier } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Bike, 
  Footprints, 
  Bus, 
  Car, 
  Heart, 
  Activity, 
  Dumbbell, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { updateProfile, userProfile } = useApp();

  const [fullName, setFullName] = useState(userProfile.name || '');
  const [transportMode, setTransportMode] = useState<'bike' | 'walk' | 'transit' | 'car'>('bike');
  const [healthPersona, setHealthPersona] = useState<'standard' | 'asthmatic' | 'athlete'>('standard');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prepopulate name from logged-in Supabase user metadata if available
  useEffect(() => {
    const fetchUserMeta = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const metaName = user.user_metadata?.full_name;
          if (metaName && !fullName) {
            setFullName(metaName);
          }
        }
      } catch (err) {
        console.warn('Could not read user meta:', err);
      }
    };
    fetchUserMeta();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const calculatedMultiplier = calculateDynamicMultiplier(healthPersona, transportMode);

    // 1. Sync locally in AppContext
    updateProfile({
      name: fullName.trim() || 'Commuter',
      commuteMode: transportMode === 'walk' ? 'walking' : (transportMode === 'bike' ? 'bicycle' : transportMode),
      persona: healthPersona === 'athlete' ? 'runner' : (healthPersona === 'asthmatic' ? 'asthmatic' : 'elderly'),
      exposureMultiplier: calculatedMultiplier,
      onboardingCompleted: true,
    });

    // 2. Persist to Supabase user_profiles table if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('user_profiles')
            .upsert({
              id: user.id,
              full_name: fullName.trim() || 'Commuter',
              transport_mode: transportMode,
              health_persona: healthPersona,
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.warn('[Supabase user_profiles upsert notice]:', error.message);
          }
        }
      } catch (err: any) {
        console.warn('Supabase profile persistence skipped or error:', err);
      }
    }

    setLoading(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      {/* Background Decorative Blurs */}
      <div className="fixed top-12 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] relative z-10">
        
        {/* Step Indicator & Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 2 of 2: Profile Calibration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Personalize Your Air Defense
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            AtmosAi calibrates microscopic alveolar particulate deposition specifically for your daily commute.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Full Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              What should we call you?
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* 2. Primary Transport Mode Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Primary Mode of Commute
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Walk */}
              <button
                type="button"
                onClick={() => setTransportMode('walk')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  transportMode === 'walk'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${transportMode === 'walk' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                    <Footprints className="w-4 h-4" />
                  </div>
                  {transportMode === 'walk' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Walking</div>
                  <div className="text-[10px] text-slate-500">Sidewalk &amp; Park</div>
                </div>
              </button>

              {/* Two-Wheeler / Bike */}
              <button
                type="button"
                onClick={() => setTransportMode('bike')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  transportMode === 'bike'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${transportMode === 'bike' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                    <Bike className="w-4 h-4" />
                  </div>
                  {transportMode === 'bike' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Two-Wheeler</div>
                  <div className="text-[10px] text-slate-500">Bike / Scooter</div>
                </div>
              </button>

              {/* Transit */}
              <button
                type="button"
                onClick={() => setTransportMode('transit')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  transportMode === 'transit'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${transportMode === 'transit' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                    <Bus className="w-4 h-4" />
                  </div>
                  {transportMode === 'transit' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Transit</div>
                  <div className="text-[10px] text-slate-500">Metro / Bus</div>
                </div>
              </button>

              {/* Car */}
              <button
                type="button"
                onClick={() => setTransportMode('car')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  transportMode === 'car'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${transportMode === 'car' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                    <Car className="w-4 h-4" />
                  </div>
                  {transportMode === 'car' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Car / Cab</div>
                  <div className="text-[10px] text-slate-500">Cabin Filtered</div>
                </div>
              </button>

            </div>
          </div>

          {/* 3. Health Persona Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Health Persona (Sensitivity Model)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Standard */}
              <button
                type="button"
                onClick={() => setHealthPersona('standard')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  healthPersona === 'standard'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${healthPersona === 'standard' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                    <Heart className="w-4 h-4" />
                  </div>
                  {healthPersona === 'standard' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Standard Adult</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Baseline biological sensitivity (1.2x baseline)
                  </div>
                </div>
              </button>

              {/* Asthmatic */}
              <button
                type="button"
                onClick={() => setHealthPersona('asthmatic')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  healthPersona === 'asthmatic'
                    ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-400 shadow-xs'
                    : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${healthPersona === 'asthmatic' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  {healthPersona === 'asthmatic' && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Asthmatic</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    High bronchial reaction, strict detour warnings
                  </div>
                </div>
              </button>

              {/* Athlete */}
              <button
                type="button"
                onClick={() => setHealthPersona('athlete')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  healthPersona === 'athlete'
                    ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-500 shadow-xs'
                    : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${healthPersona === 'athlete' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  {healthPersona === 'athlete' && <Check className="w-4 h-4 text-teal-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Athlete / Runner</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Deep tidal volume (3x ventilation rate)
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* Dynamic Calculated Impact Preview */}
          <div className="p-3.5 rounded-2xl bg-stone-100/70 border border-stone-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">Calculated Biological Factor:</span>
            </div>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {calculateDynamicMultiplier(healthPersona, transportMode)}x Multiplier
            </span>
          </div>

          {/* Submit and Save */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <span>Complete Setup &amp; Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
