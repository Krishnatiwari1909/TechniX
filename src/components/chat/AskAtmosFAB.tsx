import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from '../../types';
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
    text: `Hello! I'm Atmos AI, your personal environmental intelligence assistant powered by Google Gemini and live IoT telemetry. I'm actively monitoring particulate sensors and meteorological patterns for your commute. How can I protect your lungs today?`,
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
  
  // Task 1: Chat LocalStorage Persistence - load saved history on mount
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Task 1: Sync messages array to localStorage on changes
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

  const fallbackSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis fallback error in chat:', err);
        setIsPlayingAudio(false);
      }
    } else {
      setIsPlayingAudio(false);
    }
  };

  const playVoiceAlert = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      const response = await fetch('http://localhost:8000/api/voice-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_text: text })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        console.warn('Audio playback error, falling back to Web Speech API');
        URL.revokeObjectURL(audioUrl);
        fallbackSpeak(text);
      };
      await audio.play();
    } catch (err) {
      console.warn('Voice alert fetch failed, falling back to Web Speech API:', err);
      fallbackSpeak(text);
    }
  };

  const handleSend = async (textToSend?: string) => {
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

    let replyText = '';
    let badgeText = 'Google Gemini 1.5 Flash';

    try {
      // Call FastAPI Backend POST http://localhost:8000/api/chat
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          persona: userProfile.persona || 'Runner',
          current_pm25: pm25Level || 84.0
        })
      });

      if (res.ok) {
        const data = await res.json();
        replyText = data.response;
        badgeText = data.model === 'gemini-1.5-flash' ? 'Google Gemini 1.5 Flash' : 'AtmosAi Local AI';
      }
    } catch (error) {
      console.warn('Backend /api/chat unreachable, using offline fallback', error);
    }

    if (!replyText) {
      replyText = `AtmosAi synthesized your query for your ${userProfile.persona || 'Runner'} profile (PM2.5: ${pm25Level} µg/m³). Avoid peak traffic corridors and shift departure to protect your respiratory health.`;
    }

    const aiMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      sender: 'atmos',
      text: replyText,
      timestamp: 'Just now',
      badge: badgeText
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
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
            className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,0.65)] hover:shadow-[0_0_35px_rgba(6,182,212,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/25 cursor-pointer"
            aria-label="Ask Atmos AI"
          >
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 blur-sm opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse pointer-events-none" />

            <div className="relative flex items-center gap-2 z-10 text-white">
              <Sparkles className="w-5 h-5 text-cyan-200 animate-bounce" />
              <span className="text-sm font-extrabold tracking-tight">
                Ask Atmos
              </span>
              <span className="hidden md:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/20 text-cyan-200">
                Gemini
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
          {/* Header */}
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
                    FastAPI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {userProfile.persona} mode • PM2.5: {pm25Level}µg
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Close chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
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
                      <div className="flex items-center justify-between gap-1 text-[10px] text-cyan-400 font-mono font-bold mb-1 pb-1 border-b border-white/5">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {msg.badge}
                        </span>

                        {/* ElevenLabs TTS speaker button */}
                        <button
                          type="button"
                          onClick={() => playVoiceAlert(msg.text)}
                          className="text-slate-400 hover:text-cyan-300 p-0.5 rounded cursor-pointer"
                          title="Listen with ElevenLabs Voice"
                        >
                          {isPlayingAudio ? (
                            <VolumeX className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
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
                          className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/50 text-[11px] text-cyan-300 font-medium transition-all cursor-pointer"
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
                <span className="animate-pulse">Atmos Gemini is generating answer...</span>
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
                placeholder="Ask Gemini about air quality, routing, gear..."
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="absolute right-1.5 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 transition-all font-bold cursor-pointer"
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
