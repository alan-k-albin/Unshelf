'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const SJCET_REGEX = /^[a-zA-Z0-9._]{1,27}20(2[5-9]|3[0-5])@[a-z]{2,3}\.sjcetpalai\.ac\.in$/i;

export default function PasswordLoginForm({
  email,
  setEmail,
  onSuccess,
  onForgotPassword,
  onFirstTime,
  onError,
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password || loading) return;

    onError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      onError('Email is required');
      return;
    }

    if (!SJCET_REGEX.test(cleanEmail)) {
      onError('Please enter a valid SJCET student email (e.g., student2026@cs.sjcetpalai.ac.in)');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (errorMsg.includes('rate limit') || error.status === 429) {
          onError('Too many attempts. Please wait a few minutes and try again.');
        } else if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
          onError('Network error. Please check your internet connection.');
        } else {
          onError("Incorrect email or password. If you haven't set a password yet, use 'Email me a code'.");
        }
        setLoading(false);
        return;
      }

      if (data?.session?.user) {
        onSuccess(data.session.user);
      } else {
        onError("Incorrect email or password. If you haven't set a password yet, use 'Email me a code'.");
      }
    } catch (err) {
      onError("Incorrect email or password. If you haven't set a password yet, use 'Email me a code'.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 rounded-xl bg-[#EAF3EC] border border-[#CFECDA] flex gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#1F7A44] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#1F7A44] leading-relaxed">
          Exclusive to St. Joseph's College of Engineering and Technology (batch 2025–2035).
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">
          SJCET Student Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8272]" />
          <input
            type="email"
            placeholder="student2026@cs.sjcetpalai.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            disabled={loading}
            className="w-full pl-12 pr-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] placeholder-[#8A8272] disabled:bg-gray-50"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-[#1B2A4A]">
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading}
            className="text-xs font-semibold text-[#B23A2E] hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8272]" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-12 pr-12 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] placeholder-[#8A8272] disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8272] hover:text-[#1B2A4A] transition"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!email || !password || loading}
        className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] mt-2"
        style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
      >
        {loading ? (
          <><Loader className="w-4 h-4 animate-spin" /> Signing In...</>
        ) : (
          <>Sign In <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onFirstTime}
          disabled={loading}
          className="text-sm font-semibold text-[#1B2A4A] hover:text-[#27AE60] transition"
        >
          First time here? <span className="underline font-bold text-[#27AE60]">Email me a code</span>
        </button>
      </div>
    </form>
  );
}

