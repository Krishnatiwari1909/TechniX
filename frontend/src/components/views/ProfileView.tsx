import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PERSONA_CONFIGS } from '../../data/mockData';
import { supabase } from '../../supabaseClient';
import { 
  User, 
  Clock, 
  Phone, 
  Download, 
  CheckCircle2, 
  RefreshCw,
  LogOut
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { userProfile, setShowOnboarding } = useApp();
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const personaInfo = PERSONA_CONFIGS[userProfile.persona] || PERSONA_CONFIGS.runner;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('atmos_auth');
    localStorage.removeItem('atmos_supabase_token');
    localStorage.removeItem('atmosai_authenticated');
    window.location.reload();
  };

  const handleInstallClick = () => {
    const promptEvent = (window as any).deferredPwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setPwaInstalled(true);
        }
      });
    } else {
      alert("To install AtmosAi on iOS, tap the Share icon and select 'Add to Home Screen'. On Android, tap the three dots menu and select 'Install App'.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-sm shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {userProfile.name}
              </h2>
              <span className="text-[11px] font-bold text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 capitalize">
                {userProfile.persona} Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized Biometric Early-Warning & Demographic Exposure Shield
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Edit Persona / Setup</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-stone-200 text-xs font-bold transition-all cursor-pointer"
            title="Sign out of current account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Exposure Multiplier Analysis Card */}
      <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Personalized Inhalation Multiplier
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-emerald-700 font-mono">
                {userProfile.exposureMultiplier}x
              </span>
              <span className="text-xs font-semibold text-slate-500">
                vs standard adult baseline
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs text-slate-700 space-y-1 sm:text-right shadow-2xs">
            <div>Ventilation Volume: <strong className="text-slate-900">{personaInfo.ventilationRate}</strong></div>
            <div>Health Sensitivities: <strong className="text-emerald-800 font-semibold">{userProfile.sensitivities.join(', ') || 'None reported'}</strong></div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed border-t border-stone-200/80 pt-3">
          {personaInfo.description}
        </p>

        {/* Persona Tips */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Targeted Mitigation Protocols:
          </span>
          {personaInfo.tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Commute Parameters */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Commute Parameters
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-slate-500">Morning Departure:</span>
              <span className="font-mono font-bold text-slate-800">{userProfile.commuteTime} AM</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-slate-500">Evening Return:</span>
              <span className="font-mono font-bold text-slate-800">{userProfile.returnTime} PM</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-slate-500">Transit Mode:</span>
              <span className="font-bold text-emerald-800 capitalize">{userProfile.commuteMode}</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Emergency Contact Advisory
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-slate-500">Contact Name:</span>
              <span className="font-bold text-slate-800">{userProfile.emergencyName}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-mono font-bold text-slate-800">{userProfile.emergencyContact}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-slate-500">Severe Spike Alert:</span>
              <span className="font-bold text-emerald-700">Automated SMS Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Native Installation Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Progressive Web App (PWA) Mode
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Install AtmosAi on iOS or Android for full-screen standalone experience without browser toolbars.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold transition-all border border-stone-200 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          {pwaInstalled ? 'Installed ✓' : 'Install Standalone App'}
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
