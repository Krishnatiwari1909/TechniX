import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import { speakNativeAlert, cancelNativeSpeech } from '../../utils/speech';
import { sendChatMessage } from '../../lib/api';
import { 
  Bot, 
  Sparkles, 
  Minimize2, 
  Trash2, 
  CornerDownLeft, 
  Volume2, 
  VolumeX 
} from 'lucide-react';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'atmos',
    text: `Hello! I'm AtmosAi, your personal environmental intelligence assistant powered by the Atmos Neural Engine and real-time telemetry. I'm actively monitoring boundary layer inversion and air quality patterns for your commute. How can I protect your lungs today?`,
    timestamp: 'Just now',
    quickActions: [
      '🏃 Is it safe to run outdoors now?',
      '🗺️ Why is the Green Route better?',
      '👶 Stroller walk safety today?',
      '😷 Do I need an N95 mask?'
    ]
  }
];

const CHAT_STORAGE_KEY = 'atmos_chat_history_v2';

export const AskAtmosFAB: React.FC = () => {
  const { chatOpen, setChatOpen, userProfile, pm25Level } = useApp();
  
  // Chat LocalStorage Persistence - load saved history on mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse chat history from localStorage', e);
    }
    return INITIAL_MESSAGES;
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync messages array to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist chat history to localStorage', e);
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove chat history from localStorage', e);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [chatOpen, messages, isTyping]);

  const playVoiceAlert = (text: string) => {
    if (isPlayingAudio) {
      cancelNativeSpeech();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    speakNativeAlert(text, {
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const data = await sendChatMessage({
        message: text,
        persona: userProfile.persona || 'commuter',
        current_pm25: pm25Level || 84,
        user_profile: {
          persona: userProfile.persona,
          destination: userProfile.destination,
          commute_mode: userProfile.commuteMode,
          sensitivities: userProfile.sensitivities,
          exposure_multiplier: userProfile.exposureMultiplier
        }
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'atmos',
        text: data.response || data.reply || "I've analyzed the meteorological telemetry. Stay on the green corridor to preserve lung health.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'AtmosAi Neural Engine'
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.warn('Chat API error, falling back to local simulation:', err);

      let fallbackReply = `Given your ${userProfile.persona} profile and current PM2.5 level of ${pm25Level}µg/m³, I strongly recommend taking the Green Parkside route.`;
      if (text.toLowerCase().includes('run')) {
        fallbackReply = pm25Level > 75 
          ? `⚠️ Warning: Outdoor running is not advised right now (PM2.5 is ${pm25Level}µg/m³). Inhalation during aerobic exertion will deliver over 24µg of particulate deep into your alveoli.`
          : `✅ Outdoor running conditions are acceptable along green corridors. Avoid arterial roads where morning vehicle exhaust accumulates.`;
      } else if (text.toLowerCase().includes('mask')) {
        fallbackReply = pm25Level > 50
          ? `😷 Yes, an N95 or KF94 respirator is recommended, especially for your ${userProfile.persona} profile.`
          : `Air quality is currently moderate. Masks are optional unless you experience respiratory irritation.`;
      }

      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'atmos',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'AtmosAi Neural Engine'
      };

      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON (FAB) */}
      {!chatOpen && (
        <div className="fixed right-4 bottom-20 md:right-6 md:bottom-6 z-[50]">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="group relative flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl hover:shadow-emerald-600/30 active:scale-95 transition-all duration-300 border border-emerald-500/30 cursor-pointer"
            aria-label="Ask Atmos AI"
          >
            <div className="relative flex items-center gap-2 z-10 text-white">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-100 animate-bounce" />
              <span className="font-extrabold tracking-tight">
                Ask Atmos
              </span>
              <span className="hidden md:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-800 border border-emerald-500/40 text-emerald-100">
                Neural AI
              </span>
            </div>
          </button>
        </div>
      )}

      {/* SLIDE-UP CHAT INTERFACE */}
      {chatOpen && (
        <div
          className="fixed z-[60] right-4 sm:right-6 bottom-20 sm:bottom-6 w-[90vw] h-[70vh] sm:w-[380px] sm:h-[500px] md:w-[450px] md:h-[650px] max-h-[90vh] flex flex-col rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-6"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          {/* Header */}
          <div className="p-4 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900">Atmos AI</h3>
                  <span className="text-[10px] text-emerald-800 font-mono px-1.5 py-0.2 rounded bg-emerald-100 border border-emerald-200 font-bold">
                    FastAPI
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {userProfile.persona} mode • PM2.5: {pm25Level}µg
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                title="Close chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfcfb]">
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
                        ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm'
                        : 'bg-white border border-stone-200/80 text-slate-800 rounded-bl-xs shadow-sm'
                    }`}
                  >
                    {!isUser && msg.badge && (
                      <div className="flex items-center justify-between gap-1 text-[10px] text-emerald-700 font-mono font-bold mb-1 pb-1 border-b border-stone-100">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {msg.badge}
                        </span>

                        {/* TTS speaker button */}
                        <button
                          type="button"
                          onClick={() => playVoiceAlert(msg.text)}
                          className="text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
                          title="Listen with Voice"
                        >
                          {isPlayingAudio ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
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
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-[11px] text-slate-700 font-medium transition-all cursor-pointer shadow-2xs"
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
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2.5 bg-white border border-stone-200 rounded-xl w-fit shadow-xs animate-in fade-in duration-200">
                <Bot className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="animate-pulse font-medium text-slate-600">AtmosAi is thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-stone-50 border-t border-stone-200/80 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AtmosAi about air quality, routing, gear..."
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-white border border-stone-200 text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="absolute right-1.5 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white transition-all font-bold cursor-pointer"
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
