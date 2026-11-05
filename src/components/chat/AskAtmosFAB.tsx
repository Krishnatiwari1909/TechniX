import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import { 
  Bot, 
  Sparkles, 
  Minimize2, 
  Trash2,
  CornerDownLeft
} from 'lucide-react';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'atmos',
    text: `Hello! I'm Atmos AI, your personal environmental intelligence assistant powered by AWS Bedrock. I'm actively monitoring particulate sensors and meteorological patterns for your commute. How can I protect your lungs today?`,
    timestamp: 'Just now',
    quickActions: [
      '🏃 Is it safe to run outdoors now?',
      '🗺️ Why is the Green Route better?',
      '👶 Stroller walk safety today?',
      '😷 Do I need an N95 mask?'
    ]
  }
];

export const AskAtmosFAB: React.FC = () => {
  const { chatOpen, setChatOpen, userProfile, pm25Level } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [chatOpen, messages, isTyping]);

  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    const persona = userProfile.persona;
    const multiplier = userProfile.exposureMultiplier;

    if (q.includes('run') || q.includes('workout') || q.includes('cardio')) {
      if (pm25Level > 100) {
        return `⚠️ High Alert for ${persona}s (${multiplier}x multiplier): Current PM2.5 is ${pm25Level} µg/m³. At your heavy ventilation rate (45-60 L/min), a 45-minute run will deposit ~24µg of diesel particulate directly into your deep alveoli. Please reschedule your cardio workout past 11:30 AM when thermal lift breaks the inversion.`;
      }
      return `✅ Good news! Current ambient PM2.5 is ${pm25Level} µg/m³. If you run along the Parkside Greenway (Cubbon canopy), particulate inhalation is 72% lower than arterial roads. Hydrate well and wrap up before the 06:00 PM rush hour surge!`;
    }

    if (q.includes('green route') || q.includes('route') || q.includes('map')) {
      return `🌿 The Green Route diverts through the Madhavan & Cubbon green buffer. The dense tree canopy filters coarse and fine particulates, reducing average PM2.5 from 148 µg/m³ down to 42 µg/m³. For your commute, taking this route saves ~3.6µg of toxic soot—equivalent to avoiding 0.5 cigarettes today!`;
    }

    if (q.includes('stroller') || q.includes('child') || q.includes('baby') || q.includes('parent')) {
      return `👶 Pediatric Lung Advisory: Stroller height (0.3m - 0.8m) directly aligns with the vehicular exhaust dispersion plume. We strongly recommend using the Green Corridor and avoiding idling near intersections between 08:00 AM and 09:30 AM. A breathable HEPA stroller cover is recommended when PM2.5 exceeds 75 µg/m³.`;
    }

    if (q.includes('mask') || q.includes('gear') || q.includes('n95')) {
      if (pm25Level > 75) {
        return `😷 Mask Recommended: With current PM2.5 at ${pm25Level} µg/m³, standard cloth or surgical masks only block ~20% of sub-micron particles. For your ${userProfile.commuteMode} transit, wear a certified N95, KN95, or FFP2 respirator with an airtight facial seal.`;
      }
      return `Current PM2.5 is ${pm25Level} µg/m³. A mask is optional for general outdoor walking, but recommended if you have pre-existing sensitivities like ${userProfile.sensitivities.join(', ') || 'asthma'}.`;
    }

    if (q.includes('time') || q.includes('departure') || q.includes('shift')) {
      return `🕒 Time-Shift Analysis: The morning thermal inversion peaks between 08:00 AM and 09:15 AM. Shifting your departure either earlier to 07:15 AM or later to 10:15 AM cuts your total inhaled dose by 44% to 52%.`;
    }

    return `Atmos AI synthesized your query against telemetry station #AGY-09 (PM2.5: ${pm25Level} µg/m³) and your ${persona} profile (${multiplier}x multiplier). To keep your daily inhalation safe, consider shifting departure times or using our verified Green Route.`;
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = generateAIResponse(text);
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'atmos',
        text: responseText,
        timestamp: 'Just now',
        badge: 'AWS Bedrock • Claude Sonnet'
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 650);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON (FAB) */}
      {!chatOpen && (
        <div
          className="fixed z-40 right-4 sm:right-6"
          style={{
            bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,0.65)] hover:shadow-[0_0_35px_rgba(6,182,212,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/25"
            aria-label="Ask Atmos AI"
          >
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 blur-sm opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse pointer-events-none" />

            <div className="relative flex items-center gap-2 z-10 text-white">
              <Sparkles className="w-5 h-5 text-cyan-200 animate-bounce" />
              <span className="text-sm font-extrabold tracking-tight">
                Ask Atmos
              </span>
              <span className="hidden md:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/20 text-cyan-200">
                AI
              </span>
            </div>
          </button>
        </div>
      )}

      {/* SLIDE-UP CHAT INTERFACE */}
      {chatOpen && (
        <div
          className="fixed z-50 right-2 sm:right-6 bottom-0 sm:bottom-6 w-[calc(100vw-1rem)] sm:w-[420px] max-w-full h-[85vh] sm:h-[580px] max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl glass-panel border border-white/20 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          {/* Top Bar / Header */}
          <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Atmos AI</h3>
                  <span className="text-[10px] text-cyan-300 font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Station #AGY-09 • {userProfile.persona} ({userProfile.exposureMultiplier}x)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages(INITIAL_MESSAGES)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Close chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-xs shadow-md'
                        : 'glass-panel bg-slate-900/80 border border-white/10 text-slate-100 rounded-bl-xs shadow-md'
                    }`}
                  >
                    {!isUser && msg.badge && (
                      <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono font-bold mb-1 pb-1 border-b border-white/5">
                        <Sparkles className="w-3 h-3" />
                        {msg.badge}
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>

                  {/* Suggestion Pills */}
                  {msg.quickActions && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(action)}
                          className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/50 text-[11px] text-cyan-300 font-medium transition-all"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2 glass-panel rounded-xl w-fit">
                <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="animate-pulse">Atmos is analyzing telemetry...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950/80 border-t border-white/10 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about route safety, PM2.5, run times..."
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="absolute right-1.5 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 transition-all font-bold"
                aria-label="Send message"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AskAtmosFAB;
