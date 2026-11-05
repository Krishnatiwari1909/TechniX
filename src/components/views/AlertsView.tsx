import React, { useState } from 'react';
import { MOCK_ALERTS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { speakNativeAlert } from '../../utils/speech';
import { AlertTriangle, Bell, ShieldAlert, PhoneCall, Sliders } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { userProfile, pm25Level } = useApp();
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [threshold, setThreshold] = useState<number>(75);
  const [testSent, setTestSent] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleTestAlert = async () => {
    setTestSent(true);
    setDispatchStatus('Dispatching SOS...');

    try {
      const activePersona = (userProfile.persona || 'Asthma').charAt(0).toUpperCase() + (userProfile.persona || 'Asthma').slice(1);
      const activePM25 = pm25Level ?? 84;

      // 1. Call Backend /api/sos
      const res = await fetch('http://localhost:8000/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_number: userProfile.emergencyContact || "+15553829912",
          email: 'emergency@atmosai.dev',
          persona: activePersona,
          current_pm25: activePM25
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDispatchStatus(`Dispatched (${data.dispatched_via?.join(', ') || 'OK'})`);
      }

      // 2. Play 100% on-device native voice alert
      const alertSpeech = "AtmosAi Alert: Hazardous particulate levels detected. Seek indoor shelter immediately.";
      speakNativeAlert(alertSpeech);
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
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-rose-100 text-rose-600">
              <Bell className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-rose-700">
              Predictive Alert Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Environmental Early-Warnings
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Atmos Neural Engine evaluates atmospheric boundary layer stability and rolling 3-hour PM2.5 trends to warn before severe surges hit.
          </p>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          className="text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all self-start sm:self-auto font-medium cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      {/* Emergency Contact Fail-Safe Banner */}
      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-rose-950 text-sm sm:text-base">
              Emergency Contact Broadcast Armed
            </h3>
            <p className="text-xs text-rose-900 mt-0.5">
              If severe PM2.5 exceeds 150 µg/m³ during your scheduled commute ({userProfile.commuteTime} AM), an automated SMS advisory will alert <strong className="text-rose-950">{userProfile.emergencyName}</strong> ({userProfile.emergencyContact}).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestAlert}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-sm shrink-0 cursor-pointer"
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
                  ? 'bg-rose-50/70 border-rose-200 text-slate-800'
                  : isWarning
                  ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                  : 'bg-white border-stone-200/80 text-slate-800 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-rose-100 text-rose-600'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {alert.title}
                      </h4>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {alert.timestamp}
                </span>
              </div>

              {/* Actionable Demographics */}
              <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="text-slate-500">
                  Targeted Persona: <strong className="text-emerald-800 font-semibold">{alert.affectedDemographic}</strong>
                </div>
                <div className="text-emerald-700 font-semibold">
                  {alert.actionRequired}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Threshold Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Custom Early-Warning Threshold
            </h3>
          </div>
          <span className="text-emerald-700 font-mono font-bold text-sm">
            {threshold} µg/m³
          </span>
        </div>
        <p className="text-xs text-slate-500">
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
