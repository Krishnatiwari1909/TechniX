import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Wind, Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: () => void;
  onSignUpSuccess: () => void;
  onContinueAsGuest?: () => void;
}

export const Auth: React.FC<AuthProps> = ({
  onLoginSuccess,
  onSignUpSuccess,
  onContinueAsGuest
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleAutofillDemo = () => {
    setFullName('Krishna');
    setEmail('krishna.tiwaricap@gmail.com');
    setPassword('123456');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    // Phase 26 Task 2: Form Validation Before Submission
    if (isSignUp && !trimmedName) {
      setErrorMessage('Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    // Phase 30 Task 2: Fallback check if VITE_SUPABASE_URL is missing
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setErrorMessage("Configuration Error: Supabase URL is missing from .env");
      return;
    }

    setLoading(true);

    const effectiveName = trimmedName || trimmedEmail.split('@')[0] || 'Commuter';
    const effectiveEmail = trimmedEmail;

    try {
      if (isSignUp) {
        // Phase 25 Task 2: Live Supabase Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: effectiveEmail,
          password,
          options: {
            data: {
              full_name: effectiveName
            }
          }
        });

        if (error) {
          throw error;
        }

        // Store session token and user info
        if (data.session) {
          localStorage.setItem('atmos_supabase_token', data.session.access_token);
        }
        localStorage.setItem(
          'atmos_auth',
          JSON.stringify({
            id: data.user?.id,
            name: effectiveName,
            email: effectiveEmail,
            token: data.session?.access_token || null,
            isLoggedIn: true
          })
        );
        localStorage.setItem('atmosai_authenticated', 'true');

        setLoading(false);
        // Direct new user to the Setup Wizard
        onSignUpSuccess();
      } else {
        // Phase 25 Task 2: Live Supabase Sign In for returning users
        const { data, error } = await supabase.auth.signInWithPassword({
          email: effectiveEmail,
          password
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          localStorage.setItem('atmos_supabase_token', data.session.access_token);
        }

        const nameFromUser = data.user?.user_metadata?.full_name || effectiveName;
        localStorage.setItem(
          'atmos_auth',
          JSON.stringify({
            id: data.user?.id,
            name: nameFromUser,
            email: effectiveEmail,
            token: data.session?.access_token || null,
            isLoggedIn: true
          })
        );
        localStorage.setItem('atmosai_authenticated', 'true');

        // Check if user has an existing profile in Supabase database
        let hasProfile = false;
        try {
          if (data.user?.id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (profileData) {
              hasProfile = true;
              localStorage.setItem('atmos_profile', JSON.stringify(profileData));
            }
          }
        } catch (dbErr) {
          console.warn('[Auth] Check profile warning:', dbErr);
        }

        setLoading(false);
        if (hasProfile || localStorage.getItem('atmos_profile')) {
          onLoginSuccess();
        } else {
          onSignUpSuccess();
        }
      }
    } catch (error: any) {
      // Phase 30 Task 2: Enhanced raw error logging
      console.error("Supabase Auth Error:", error);
      const errMsg = error?.message || String(error || '');
      // Phase 26 Task 3: Specific fallback on Failed to fetch
      if (errMsg.includes('Failed to fetch')) {
        setErrorMessage('Database connection failed. Check VITE_SUPABASE_URL environment variables.');
      } else {
        setErrorMessage(errMsg || 'Authentication failed. Please verify credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      {/* Background Decorative Blurs */}
      <div className="fixed top-12 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Japandi-Minimalist Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] relative z-10 transition-all">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 mb-3">
            <Wind className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Atmos<span className="text-emerald-700">Ai</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs font-normal">
            Intelligent urban air protection &amp; personal micro-exposure modeling
          </p>
        </div>

        {/* Tab Toggle: Log In vs Sign Up */}
        <div className="flex p-1 bg-stone-100 rounded-2xl mb-6 border border-stone-200/70">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isSignUp
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successNotice}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name for Sign Up */}
          {isSignUp && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-slate-700 block">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. Alex Chen"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            {isSignUp && (
              <span className="text-[10px] text-slate-400 block">Must be at least 6 characters</span>
            )}
          </div>

          {/* Phase 26 Task 1: The "Fill for Demo" Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer transition-colors"
            >
              <span>🪄 Autofill for Demo</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isSignUp ? (
              <>
                <span>Sign Up &amp; Setup Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Log In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest / Bypass Mode Option */}
        <div className="mt-6 pt-5 border-t border-stone-200/70 text-center">
          <button
            type="button"
            onClick={onContinueAsGuest || onLoginSuccess}
            className="text-xs text-slate-500 hover:text-emerald-700 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Continue as Guest (Explore Dashboard)</span>
          </button>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected with AtmosAi Local Shield</span>
        </div>

      </div>
    </div>
  );
};

