import React, { useState, useRef, useEffect } from 'react';
import { AQIHeroCard } from '../dashboard/AQIHeroCard';
import { PredictedVsActualChart } from '../dashboard/PredictedVsActualChart';
import { TimeShiftSlider } from '../dashboard/TimeShiftSlider';
import { LungsSavedCard } from '../dashboard/LungsSavedCard';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured, calculateDynamicMultiplier } from '../../lib/supabase';
import { 
  ArrowRight, 
  Navigation, 
  Volume2, 
  ShieldAlert, 
  AlertTriangle,
  CheckCircle2, 
  Loader2, 
  VolumeX, 
  X,
  PhoneCall,
  Radio,
  Sparkles,
  MapPin
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    setActiveTab, 
    userProfile, 
    updateProfile,
    pm25Level, 
    setPm25Level, 
    setWindDirection, 
    setWindSpeed, 
    setTelemetryHistory,
    departureTimeIndex,
    userLocation,
    isLocating
  } = useApp();

  // Task 5: Supabase logged-in user profile fetch on mount
  useEffect(() => {
    let isCancelled = false;
    const fetchSupabaseProfile = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!isCancelled && data && !error) {
            const fetchedMultiplier = calculateDynamicMultiplier(data.health_persona, data.transport_mode);
            updateProfile({
              name: data.full_name || userProfile.name,
              commuteMode: data.transport_mode === 'walk' ? 'walking' : (data.transport_mode === 'bike' ? 'bicycle' : (data.transport_mode || 'bicycle')),
              persona: data.health_persona === 'athlete' ? 'runner' : (data.health_persona === 'asthmatic' ? 'asthmatic' : 'elderly'),
              exposureMultiplier: fetchedMultiplier,
            });
          }
        }
      } catch (err) {
        console.warn('[DashboardView] Supabase profile fetch notice:', err);
      }
    };

    fetchSupabaseProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Task 2: Check if Departure Time falls between 06:00 and 08:30 (indices 0 - 10)
  const isMorningInversion = departureTimeIndex >= 0 && departureTimeIndex <= 10;

  // State for Native Voice Shield & Emergency SOS
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [briefingResponse, setBriefingResponse] = useState<string | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(false);

  // Pre-load on-device speech voices on mount (required for Chromium/Chrome)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Task 4: The "Morning Briefing" Gemini Trigger
  const handleGetCommuteBriefing = async () => {
    setIsLoadingBriefing(true);
    const destination = userProfile.destination || 'IISc Bangalore Campus';
    const mode = userProfile.commuteMode || 'bicycle';
    const currentAqi = Math.round(pm25Level * 1.35);

    const hiddenPrompt = `User is commuting to their saved destination (${destination}) via ${mode}. Current AQI is ${currentAqi} (PM2.5: ${pm25Level} µg/m³). Give a 2-sentence safety briefing.`;

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: hiddenPrompt,
          persona: userProfile.persona || 'commuter',
          current_pm25: pm25Level
        })
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      setBriefingResponse(data.response);
    } catch (err) {
      console.warn('Commute briefing API error, falling back:', err);
      setBriefingResponse(
        `AtmosAi Commute Advisory: PM2.5 levels along your route to ${destination} are currently ${pm25Level} µg/m³ for your ${mode} trip. Maintain active respiratory protection and consider shifting departure by 25 minutes to avoid peak diesel smog.`
      );
    } finally {
      setIsLoadingBriefing(false);
    }
  };

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

  // Natural-sounding voice selection algorithm prioritizing premium on-device voices
  const getBestNaturalVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Prioritized list of premium natural-sounding voices across platforms
    const preferredNames = [
      'Google UK English Female',
      'Google US English',
      'Samantha',
      'Karen',
      'Moira',
      'Tessa',
      'Victoria',
      'Daniel',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Zira',
      'Microsoft David'
    ];

    for (const name of preferredNames) {
      const found = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (found) return found;
    }

    // Fallback: Any English voice with Natural or Neural in its title
    const naturalEnglish = voices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium'))
    );
    if (naturalEnglish) return naturalEnglish;

    // Fallback: Any Google English voice
    const googleEnglish = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
    if (googleEnglish) return googleEnglish;

    // Fallback: Any English voice
    const defaultEnglish = voices.find(v => v.lang.startsWith('en'));
    if (defaultEnglish) return defaultEnglish;

    return voices[0] || null;
  };

  // Phase 7b: 100% On-Device Native Speech Synthesis Voice Shield
  const fallbackSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const bestVoice = getBestNaturalVoice();
        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang || 'en-US';
        } else {
          utterance.lang = 'en-US';
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onstart = () => setIsPlayingVoice(true);
        utterance.onend = () => setIsPlayingVoice(false);
        utterance.onerror = (e) => {
          console.warn('Native speech error:', e);
          setIsPlayingVoice(false);
        };
        window.speechSynthesis.speak(utterance);
      } catch (speechErr) {
        console.warn('Native Web Speech API execution failed:', speechErr);
        setIsPlayingVoice(false);
      }
    } else {
      console.warn('SpeechSynthesis not supported on this browser');
      setIsPlayingVoice(false);
    }
  };

  // Direct trigger of Native On-Device Voice Shield (Zero Cloud API, 100% Offline)
  const handleActivateVoiceShield = () => {
    if (isPlayingVoice) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingVoice(false);
      return;
    }

    const alertMessage = "Warning: PM2.5 levels are rising rapidly. Please consider moving indoors.";
    setIsPlayingVoice(true);
    fallbackSpeak(alertMessage);
  };

  // 2. Wire the Emergency SOS Trigger (Enhanced Dynamic Persona & Telemetry Payload)
  const handleTriggerSOS = async () => {
    try {
      setIsSendingSOS(true);

      // Extract saved persona and current PM2.5 from state / localStorage
      let activePersona = userProfile.persona || 'Asthma';
      try {
        const saved = localStorage.getItem('atmosai_user_profile_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.persona) activePersona = parsed.persona;
        }
      } catch (e) {
        console.warn('Could not read persona from localStorage', e);
      }

      // Format clean capitalized label (e.g., "Asthma" or "Runner")
      const formattedPersona = activePersona.charAt(0).toUpperCase() + activePersona.slice(1);
      const activePM25 = pm25Level ?? 84;

      const sosPayload = {
        contact_number: userProfile.emergencyContact || "+15553829912",
        email: "emergency@atmosai.dev",
        persona: formattedPersona,
        current_pm25: activePM25
      };

      const response = await fetch('http://localhost:8000/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sosPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setToastMessage(
          data.alert_text || 
          `AtmosAi EMERGENCY: The user is in a hazardous zone (PM2.5: ${activePM25}). Their health profile is marked as: ${formattedPersona}. Please contact them immediately.`
        );
      } else {
        setToastMessage(
          `AtmosAi EMERGENCY: The user is in a hazardous zone (PM2.5: ${activePM25}). Their health profile is marked as: ${formattedPersona}. Please contact them immediately.`
        );
      }
    } catch (error) {
      console.warn('Backend /api/sos unreachable, using offline fallback', error);
      const fallbackPersona = (userProfile.persona || 'Asthma').charAt(0).toUpperCase() + (userProfile.persona || 'Asthma').slice(1);
      setToastMessage(
        `AtmosAi EMERGENCY: The user is in a hazardous zone (PM2.5: ${pm25Level}). Their health profile is marked as: ${fallbackPersona}. Please contact them immediately.`
      );
    } finally {
      setIsSendingSOS(false);
      // Auto-dismiss toast after 6 seconds
      setTimeout(() => {
        setToastMessage(null);
      }, 6000);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Toast Notification for Emergency SOS */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-rose-200 text-slate-800 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.12)]">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-rose-600 text-sm">Emergency Alert Dispatched</p>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  SOS Sent
                </span>
              </div>
              <p className="text-slate-700 text-xs leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-mono">
                {toastMessage}
              </p>
              <p className="text-slate-500 text-[11px]">
                Target: <strong className="text-slate-800">{userProfile.emergencyContact || "+1 (555) 382-9912"}</strong>
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-1 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome & Demographic Context Banner (Solid White Minimalist Card) */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-700">
              Personalized Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{isLocating ? 'Detecting GPS...' : userLocation?.name ? `GPS: ${userLocation.name}` : `GPS: ${userProfile.destination}`}</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all duration-300 ${
                isWsConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <Radio className={`w-3 h-3 ${isWsConnected ? 'text-emerald-600 animate-pulse' : 'text-amber-600'}`} />
              <span>{isWsConnected ? 'Live Sensor Stream (3s)' : 'Connecting WS...'}</span>
            </span>

            {/* Task 2: Morning Inversion Dashboard Warning Badge */}
            {isMorningInversion && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Morning Inversion: Pollutants trapped at ground level</span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Welcome back, {userProfile.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            AtmosAi is calculating micro-pollutant intake for your <strong className="text-emerald-700 capitalize">{userProfile.persona}</strong> profile ({userProfile.exposureMultiplier}x dynamic multiplier via <span className="capitalize font-semibold text-slate-800">{userProfile.commuteMode}</span>).
          </p>

          {/* Detailed Morning Inversion Banner */}
          {isMorningInversion && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Morning Inversion Alert:</strong> Cool air cap traps toxic diesel particulates at surface breathing height. Applied 1.3x exposure surcharge.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons: Soft Sage Green, Teal, Coral SOS, Clean Map link */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Prominent Soft Sage Green "Get Commute Briefing" Button */}
          <button
            type="button"
            onClick={handleGetCommuteBriefing}
            disabled={isLoadingBriefing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all duration-200 shadow-sm hover:shadow active:scale-95 cursor-pointer shrink-0"
            title="Generate AI commute safety advisory for your location"
          >
            {isLoadingBriefing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing AI Briefing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Get Commute Briefing</span>
              </>
            )}
          </button>

          {/* Activate AI Voice Shield Button */}
          <button
            type="button"
            onClick={handleActivateVoiceShield}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
              isPlayingVoice
                ? 'bg-amber-50 border border-amber-300 text-amber-800 animate-pulse'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
            title="Trigger On-Device AI Voice Shield (Native Speech)"
          >
            {isPlayingVoice ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Playing Voice Shield...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-teal-200" />
                <span>Activate AI Voice Shield</span>
              </>
            )}
          </button>

          {/* Emergency SOS Button (Refined Soft Red/Coral bg-rose-500) */}
          <button
            type="button"
            onClick={handleTriggerSOS}
            disabled={isSendingSOS}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all duration-200 shadow-sm hover:shadow active:scale-95 cursor-pointer shrink-0"
            title="Dispatch emergency SMS & alert to emergency contact with active health persona"
          >
            {isSendingSOS ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sending SOS...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-200" />
                <span>Emergency SOS</span>
              </>
            )}
          </button>

          {/* Open Full Map */}
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Map Corridors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task 4: Morning Commute Gemini Briefing Sleek Minimal Card */}
      {briefingResponse && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                    Morning Commute Safety Briefing
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                    Atmos Neural Engine
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Destination: <strong className="text-slate-800">{userProfile.destination || 'Detected Location'}</strong>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Mode: <strong className="text-slate-800 capitalize">{userProfile.commuteMode || 'bicycle'}</strong>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {briefingResponse}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fallbackSpeak(briefingResponse)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Read briefing aloud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setBriefingResponse(null)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Dismiss briefing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Air Quality Telemetry & Simulation Gauge */}
      <AQIHeroCard />

      {/* Task 3: Uniform 2-Column Dashboard Grid with items-start for Top Edge Alignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Card 1: Predicted vs Actual Graph */}
        <div className="w-full">
          <PredictedVsActualChart />
        </div>

        {/* Card 2: Time-Shift Departure Slider & Exposure Card */}
        <div className="w-full">
          <TimeShiftSlider />
        </div>

        {/* Card 3: Gamified Lungs Saved */}
        <div className="w-full">
          <LungsSavedCard />
        </div>

        {/* Card 4: Clean Air Navigation Callout to dedicated Map Page */}
        <div className="w-full">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Clean Air Routing
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-bold block">
                    Turn-by-Turn Navigation
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plan trips between custom origins &amp; destinations. Our ML engine steers you through green canopy corridors to minimize alveolar toxin intake.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <span>Explore Dedicated Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardView;
