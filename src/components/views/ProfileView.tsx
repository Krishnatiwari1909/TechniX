import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PERSONA_CONFIGS } from '../../data/mockData';
import { 
  User, 
  Clock, 
  Phone, 
  Download, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { userProfile, setShowOnboarding } = useApp();
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const personaInfo = PERSONA_CONFIGS[userProfile.persona] || PERSONA_CONFIGS.runner;

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
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
            <User className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {userProfile.name}
              </h2>
              <span className="text-[11px] font-bold text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 capitalize">
                {userProfile.persona} Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized Biometric Early-Warning & Demographic Exposure Shield
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Edit Persona / Relaunch Setup</span>
        </button>
      </div>

      {/* Exposure Multiplier Analysis Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-cyan-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Personalized Inhalation Multiplier
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 font-mono">
                {userProfile.exposureMultiplier}x
              </span>
              <span className="text-xs font-semibold text-slate-400">
                vs standard adult baseline
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-slate-300 space-y-1 sm:text-right">
            <div>Ventilation Volume: <strong className="text-white">{personaInfo.ventilationRate}</strong></div>
            <div>Health Sensitivities: <strong className="text-cyan-300">{userProfile.sensitivities.join(', ') || 'None reported'}</strong></div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-3">
          {personaInfo.description}
        </p>

        {/* Persona Tips */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Targeted Mitigation Protocols:
          </span>
          {personaInfo.tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Commute Parameters */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              Commute Parameters
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-white/5">
              <span className="text-slate-400">Morning Departure:</span>
              <span className="font-mono font-bold text-white">{userProfile.commuteTime} AM</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-white/5">
              <span className="text-slate-400">Evening Return:</span>
              <span className="font-mono font-bold text-white">{userProfile.returnTime} PM</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-white/5">
              <span className="text-slate-400">Transit Mode:</span>
              <span className="font-bold text-cyan-300 capitalize">{userProfile.commuteMode}</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-red-400" />
            <h3 className="font-bold text-white text-sm">
              Emergency Contact Advisory
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-white/5">
              <span className="text-slate-400">Contact Name:</span>
              <span className="font-bold text-white">{userProfile.emergencyName}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-white/5">
              <span className="text-slate-400">Phone Number:</span>
              <span className="font-mono font-bold text-white">{userProfile.emergencyContact}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-white/5">
              <span className="text-slate-400">Severe Spike Alert:</span>
              <span className="font-bold text-emerald-400">Automated SMS Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Native Installation Status Card */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              Progressive Web App (PWA) Mode
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Install AtmosAi on iOS or Android for full-screen standalone experience without browser toolbars.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all border border-white/10 self-start sm:self-auto shrink-0"
        >
          {pwaInstalled ? 'Installed ✓' : 'Install Standalone App'}
        </button>
      </div>
    </div>
  );
};

export default ProfileView;

