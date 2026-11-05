import React, { useState } from 'react';
import { MOCK_ALERTS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, Bell, ShieldAlert, PhoneCall, Sliders, Volume2 } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { userProfile } = useApp();
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [threshold, setThreshold] = useState<number>(75);
  const [testSent, setTestSent] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleTestAlert = async () => {
    setTestSent(true);
    setDispatchStatus('Dispatching SOS...');

    try {
      // 1. Call Backend /api/sos
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_number: userProfile.emergencyContact,
          email: 'emergency@atmosai.dev'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDispatchStatus(`Dispatched (${data.dispatched_via?.join(', ') || 'OK'})`);
      }

      // 2. Play ElevenLabs voice alert audio with offline Web Speech fallback
      const alertSpeech = "AtmosAi Alert: Hazardous particulate levels detected. Seek indoor shelter immediately.";
      try {
        const audioRes = await fetch('/api/voice-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_text: alertSpeech
          })
        });

        if (!audioRes.ok) {
          throw new Error(`API Error: ${audioRes.status}`);
        }

        const blob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(alertSpeech));
          }
        };
        await audio.play().catch(e => {
          console.log('Audio autoplay prevented:', e);
          URL.revokeObjectURL(audioUrl);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(alertSpeech));
          }
        });
      } catch (err) {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(alertSpeech));
        }
      }
    } catch (e) {
      console.warn('Backend SOS dispatch failed:', e);
      setDispatchStatus('Dispatched (Offline Mock)');
    }

    setTimeout(() => {
      setTestSent(false);
      setDispatchStatus(null);
    }, 4000);
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-red-500/20 text-red-400">
              <Bell className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-red-400">
              Predictive Alert Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Environmental Early-Warnings
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            LightGBM evaluates atmospheric boundary layer stability and rolling 3-hour PM2.5 trends to warn before severe surges hit.
          </p>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all self-start sm:self-auto font-medium cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      {/* Emergency Contact Fail-Safe Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900/60 to-slate-950/90 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">
              Emergency Contact Broadcast Armed
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              If severe PM2.5 exceeds 150 µg/m³ during your scheduled commute ({userProfile.commuteTime} AM), an automated SMS advisory will alert <strong className="text-white">{userProfile.emergencyName}</strong> ({userProfile.emergencyContact}).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestAlert}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] shrink-0 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4" />
          <span>{dispatchStatus || (testSent ? 'Dispatched ✓' : 'Send Test Advisory & Audio')}</span>
        </button>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const isCritical = alert.level === 'critical';
          const isWarning = alert.level === 'warning';

          return (
            <div
              key={alert.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isCritical
                  ? 'bg-red-950/30 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                  : isWarning
                  ? 'bg-amber-950/30 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'glass-panel border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-red-500/20 text-red-400'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {alert.title}
                      </h4>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {alert.timestamp}
                </span>
              </div>

              {/* Actionable Demographics */}
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="text-slate-400">
                  Targeted Persona: <strong className="text-cyan-300 font-semibold">{alert.affectedDemographic}</strong>
                </div>
                <div className="text-emerald-400 font-medium">
                  {alert.actionRequired}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Threshold Configuration */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              Custom Early-Warning Threshold
            </h3>
          </div>
          <span className="text-cyan-300 font-mono font-bold text-sm">
            {threshold} µg/m³
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Push notification triggers whenever local station predictions surpass this level.
        </p>
        <input
          type="range"
          min={35}
          max={150}
          step={5}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="touch-slider"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>35 µg (Strict / Asthma)</span>
          <span>75 µg (WHO Guideline)</span>
          <span>150 µg (Hazardous Only)</span>
        </div>
      </div>
    </div>
  );
};

export default AlertsView;
