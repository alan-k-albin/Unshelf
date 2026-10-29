'use client';

import { useState } from 'react';
import { Mail, Loader, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const SJCET_REGEX = /^[a-zA-Z0-9._]{1,27}20(2[5-9]|3[0-5])@[a-z]{2,3}\.sjcetpalai\.ac\.in$/i;

export default function OtpRequestForm({
  email,
  setEmail,
  isForgotPassword,
  onCodeSent,
  onBackToPasswordLogin,
  onError,
  setSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || loading) return;

    onError('');
    setSuccess('');

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
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        const errorMsg = otpError.message?.toLowerCase() || '';
        if (errorMsg.includes('rate limit') || otpError.status === 429) {
          onError('Too many codes requested. Please wait a while and try again.');
        } else if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
          onError('Network error. Please check your internet connection.');
        } else {
          onError(otpError.message || 'Failed to send OTP.');
        }
        setLoading(false);
        return;
      }

      setSuccess('OTP sent to your SJCET email!');
      setTimeout(() => {
        setSuccess('');
        onCodeSent();
      }, 1200);
    } catch (err) {
      onError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 rounded-xl bg-[#EAF3EC] border border-[#CFECDA] flex gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#1F7A44] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#1F7A44] leading-relaxed">
          {isForgotPassword
            ? "Enter your SJCET email to receive a code and choose a new password."
            : "First time here? We will email you a one-time code to verify your SJCET account and set up your password."}
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

      <button
        type="submit"
        disabled={!email || loading}
        className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] mt-2"
        style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
      >
        {loading ? (
          <><Loader className="w-4 h-4 animate-spin" /> Sending Code...</>
        ) : (
          <>{isForgotPassword ? 'Send Reset Code' : 'Send One-Time Code'} <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onBackToPasswordLogin}
          disabled={loading}
          className="text-sm font-semibold text-[#1B2A4A] hover:text-[#27AE60] transition inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to password login
        </button>
      </div>
    </form>
  );
}

