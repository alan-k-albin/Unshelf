'use client';

import { useState, useEffect } from 'react';
import { Loader, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function OtpVerifyForm({
  email,
  onVerified,
  onChangeEmail,
  onError,
  setSuccess,
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(interval);
    }
  }, [otpTimer]);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
      return () => clearTimeout(interval);
    } else if (isLockedOut && lockoutTimer === 0) {
      setIsLockedOut(false);
      setOtpAttempts(0);
    }
  }, [lockoutTimer, isLockedOut]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    onError('');

    if (isLockedOut) {
      onError(`Too many attempts. Try again in ${lockoutTimer} seconds.`);
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      onError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp.trim(),
        type: 'email',
      });

      const session = data?.session || (data?.user ? { user: data.user } : null);

      if (verifyError || !session?.user) {
        const errorMsg = verifyError?.message?.toLowerCase() || '';
        if (errorMsg.includes('expired')) {
          onError('The verification code has expired. Please request a new one.');
        } else if (errorMsg.includes('rate limit') || verifyError?.status === 429) {
          onError('Too many codes requested. Please wait a while and try again.');
        } else if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
          onError('Network error. Please check your internet connection.');
        } else {
          const newAttempts = otpAttempts + 1;
          setOtpAttempts(newAttempts);

          if (newAttempts >= 3) {
            setIsLockedOut(true);
            setLockoutTimer(300);
            onError('Too many attempts. Locked for 5 minutes.');
          } else {
            onError(`Invalid OTP. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? '' : 's'} left.`);
          }
        }
        setOtp('');
        setLoading(false);
        return;
      }

      setSuccess('Code verified!');
      setTimeout(() => {
        setSuccess('');
        onVerified(session.user);
      }, 800);
    } catch (err) {
      onError(err.message || 'Verification failed.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (otpTimer > 240 || isLockedOut || resending) {
      onError('Please wait before requesting a new code');
      return;
    }

    onError('');
    setSuccess('');
    setResending(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        const errorMsg = otpError.message?.toLowerCase() || '';
        if (errorMsg.includes('rate limit') || otpError.status === 429) {
          onError('Too many codes requested. Please wait a while and try again.');
        } else {
          onError(otpError.message || 'Failed to resend code.');
        }
        setResending(false);
        return;
      }

      setOtp('');
      setOtpAttempts(0);
      setOtpTimer(300);
      setSuccess('A new 6-digit code has been sent!');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      onError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-[#1B2A4A]">
            Enter 6-Digit Code
          </label>
          {otpTimer > 0 && (
            <span className="text-xs font-semibold text-[#B23A2E]">
              ⏱️ {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="6"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          disabled={isLockedOut || loading}
          className="w-full px-4 py-3.5 min-h-[56px] rounded-xl border-2 border-[#EDE6D6] text-center text-3xl tracking-widest font-light focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 disabled:bg-gray-100 transition text-[#1B2A4A]"
          autoComplete="one-time-code"
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={otp.length !== 6 || loading || isLockedOut}
        className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
        style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
      >
        {loading ? (
          <><Loader className="w-4 h-4 animate-spin" /> Verifying Code...</>
        ) : (
          <>Verify & Continue <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <div className="flex flex-col gap-2 pt-1 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={otpTimer > 240 || isLockedOut || resending}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#1B2A4A] hover:text-[#27AE60] disabled:opacity-40 transition"
        >
          {resending ? (
            'Sending code...'
          ) : otpTimer > 240 ? (
            `Resend code in ${otpTimer - 240}s`
          ) : (
            '🔄 Resend code'
          )}
        </button>

        <button
          type="button"
          onClick={onChangeEmail}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#8A8272] hover:text-[#1B2A4A] transition inline-flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Change Email
        </button>
      </div>
    </form>
  );
}

