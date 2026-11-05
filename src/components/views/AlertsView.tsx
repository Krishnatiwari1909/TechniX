import React, { useState } from 'react';
import { MOCK_ALERTS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, Bell, ShieldAlert, PhoneCall, Sliders } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { userProfile } = useApp();
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [threshold, setThreshold] = useState<number>(75);
  const [testSent, setTestSent] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleTestAlert = () => {
    setTestSent(true);
    setDispatchStatus('Dispatched (Simulated)');

    setTimeout(() => {
      setTestSent(false);
      setDispatchStatus(null);
    }, 3000);
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
          <span>{dispatchStatus || (testSent ? 'Dispatched ✓' : 'Send Test Advisory')}</span>
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
              className={`p-4 rounded-xl border transition-all ${
                alert.read
                  ? 'bg-slate-900/40 border-white/5 opacity-60'
                  : isCritical
                  ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                  : isWarning
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                  : 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-red-500/20 text-red-400'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">
                        {alert.title}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                          isCritical
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {alert.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                      <span>Time: {alert.timestamp}</span>
                      <span>Affected Persona: <strong className="text-slate-200 capitalize">{alert.personaAffected}</strong></span>
                    </div>
                  </div>
                </div>

                {!alert.read && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Threshold Slider Preference */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              Custom Early-Warning Threshold
            </h3>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            {threshold} µg/m³
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Set the PM2.5 boundary where AtmosAi activates high-priority audio chime and sends your contact warning.
        </p>
        <input
          type="range"
          min={30}
          max={180}
          step={5}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>30 µg/m³ (WHO Safe)</span>
          <span>75 µg/m³ (Moderate)</span>
          <span>180 µg/m³ (Severe Alert)</span>
        </div>
      </div>
    </div>
  );
};

export default AlertsView;
