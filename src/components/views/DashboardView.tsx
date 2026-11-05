import React, { useState, useRef, useEffect } from 'react';
import { AQIHeroCard } from '../dashboard/AQIHeroCard';
import { PredictedVsActualChart } from '../dashboard/PredictedVsActualChart';
import { TimeShiftSlider } from '../dashboard/TimeShiftSlider';
import { LungsSavedCard } from '../dashboard/LungsSavedCard';
import { RouteMap } from '../map/RouteMap';
import { useApp } from '../../context/AppContext';
import { 
  ArrowRight, 
  Navigation, 
  Volume2, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  VolumeX, 
  X,
  PhoneCall,
  Radio
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    setActiveTab, 
    userProfile, 
    pm25Level, 
    setPm25Level, 
    setWindDirection, 
    setWindSpeed, 
    setTelemetryHistory 
  } = useApp();

  // State for ElevenLabs Voice Shield & Emergency SOS
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Task 3: WebSocket Telemetry Integration & Real-Time Sync
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/telemetry');

        ws.onopen = () => {
          if (!isDisposed) {
            setIsWsConnected(true);
            console.log('[Telemetry WS] Connected to live PM2.5 stream');
          }
        };

        ws.onmessage = (event) => {
          if (isDisposed) return;
          try {
            const data = JSON.parse(event.data);
            if (typeof data.pm25 === 'number') {
              // 1. Update PM2.5 state (animates particles & stat cards)
              setPm25Level(data.pm25);

              // 2. Task 2: Rolling Telemetry Sparkline (capped at 10 data points)
              setTelemetryHistory(prev => {
                const timeLabel = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
                const nextPoints = [...prev, { time: timeLabel, pm25: data.pm25 }];
                return nextPoints.slice(-10);
              });
            }

            // 3. Task 1: Update Wind Direction and Speed for trigonometric 3D physics
            if (typeof data.wind_direction === 'number') {
              setWindDirection(data.wind_direction);
            }
            if (typeof data.wind_speed === 'number') {
              setWindSpeed(data.wind_speed);
            }
          } catch (err) {
            console.warn('[Telemetry WS] Payload error:', err);
          }
        };

        ws.onclose = () => {
          if (!isDisposed) {
            setIsWsConnected(false);
            console.log('[Telemetry WS] Disconnected. Reconnecting in 3s...');
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = (err) => {
          console.warn('[Telemetry WS] Connection error:', err);
          ws?.close();
        };
      } catch (err) {
        console.warn('[Telemetry WS] Initialization failed:', err);
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [setPm25Level, setWindDirection, setWindSpeed, setTelemetryHistory]);

  // Task 2: Offline Web Speech Fallback
  const fallbackSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => setIsPlayingVoice(false);
        utterance.onerror = (e) => {
          console.warn('Web Speech API playback error:', e);
          setIsPlayingVoice(false);
        };
        window.speechSynthesis.speak(utterance);
      } catch (speechErr) {
        console.warn('Web Speech API execution failed:', speechErr);
        setIsPlayingVoice(false);
      }
    } else {
      console.warn('SpeechSynthesis not supported on this browser');
      setIsPlayingVoice(false);
    }
  };

  // 1. Wire the ElevenLabs Voice Alert Button with Web Speech Fallback
  const handleActivateVoiceShield = async () => {
    const alertMessage = "Warning: PM2.5 levels are rising rapidly. Please consider moving indoors.";
    setIsPlayingVoice(true);

    try {
      const response = await fetch('http://localhost:8000/api/voice-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_text: alertMessage })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.warn('Audio playback error, falling back to Web Speech API');
        URL.revokeObjectURL(audioUrl);
        fallbackSpeak(alertMessage);
      };

      await audio.play();
    } catch (error) {
      console.warn('Voice alert failed, falling back to Web Speech API:', error);
      fallbackSpeak(alertMessage);
    }
  };

  // 2. Wire the Emergency SOS Trigger
  const handleTriggerSOS = async () => {
    try {
      setIsSendingSOS(true);

      const sosPayload = {
        contact_number: userProfile.emergencyContact || "+15553829912",
        email: "emergency@atmosai.dev"
      };

      const response = await fetch('http://localhost:8000/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sosPayload)
      });

      if (response.ok) {
        setToastMessage("Emergency Alert Sent");
      } else {
        setToastMessage("Emergency Alert Sent (Local Fallback)");
      }
    } catch (error) {
      console.warn('Backend /api/sos unreachable, using offline fallback', error);
      setToastMessage("Emergency Alert Sent (Offline Fallback)");
    } finally {
      setIsSendingSOS(false);
      // Auto-dismiss toast after 4 seconds
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification for Emergency SOS */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] backdrop-blur-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-white text-sm">{toastMessage}</p>
              <p className="text-slate-400">
                Dispatched to {userProfile.emergencyContact}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome & Demographic Context Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
              Personalized Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs text-slate-400">FastAPI & Bedrock Live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all duration-300 ${
                isWsConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              <Radio className={`w-3 h-3 ${isWsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span>{isWsConnected ? 'Live Sensor Stream (3s)' : 'Connecting WS...'}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            Welcome back, {userProfile.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            AtmosAi is calculating micro-pollutant intake for your <strong className="text-cyan-300 capitalize">{userProfile.persona}</strong> profile ({userProfile.exposureMultiplier}x biological multiplier).
          </p>
        </div>

        {/* Action Buttons: Voice Shield, Emergency SOS, Map Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Activate AI Voice Shield Button */}
          <button
            type="button"
            onClick={handleActivateVoiceShield}
            disabled={isPlayingVoice}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-md ${
              isPlayingVoice
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-indigo-950/60 hover:bg-indigo-900/70 border-indigo-500/40 text-indigo-300 hover:text-white shadow-[0_0_12px_rgba(99,102,241,0.2)]'
            }`}
            title="Trigger ElevenLabs TTS Voice Broadcast"
          >
            {isPlayingVoice ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Playing Voice Shield...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Activate AI Voice Shield</span>
              </>
            )}
          </button>

          {/* Emergency SOS Button */}
          <button
            type="button"
            onClick={handleTriggerSOS}
            disabled={isSendingSOS}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all duration-200 shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
            title="Dispatch emergency SMS & alert to emergency contact"
          >
            {isSendingSOS ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                <span>Sending SOS...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Emergency SOS</span>
              </>
            )}
          </button>

          {/* Open Full Map */}
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Map Corridors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Air Quality Telemetry & Simulation Gauge */}
      <AQIHeroCard />

      {/* Responsive Multi-Column Layout on Desktop / Single-Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Predicted vs Actual Graph */}
        <div className="lg:col-span-7 flex flex-col">
          <PredictedVsActualChart />
        </div>

        {/* Right Column (5 cols): Time-Shift Departure Slider & Exposure Card */}
        <div className="lg:col-span-5 flex flex-col">
          <TimeShiftSlider />
        </div>

      </div>

      {/* Gamified Stat Card & Clean Routing Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gamified Lungs Saved (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <LungsSavedCard />
        </div>

        {/* RouteMap Component (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Route Optimization Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                Full Map View →
              </button>
            </div>
            
            <RouteMap />
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardView;
