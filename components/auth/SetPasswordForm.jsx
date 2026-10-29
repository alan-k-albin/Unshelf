'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader, ArrowRight, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { logoutUser } from '@/lib/auth';

export default function SetPasswordForm({
  isForgotPassword,
  onSuccess,
  onLogout,
  onError,
  setSuccess,
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Live validation rules: minimum 8 characters, and must match confirm
  const isMinLength = password.length >= 8;
  const isMatching = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = isMinLength && isMatching && !loading;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    onError('');
    setSuccess('');

    if (!isMinLength) {
      onError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      onError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
        data: { has_password: true },
      });

      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (errorMsg.includes('least') || errorMsg.includes('weak')) {
          onError('Password is too weak. Please choose a stronger password.');
        } else if (errorMsg.includes('rate limit') || error.status === 429) {
          onError('Too many attempts. Please wait a few minutes and try again.');
        } else if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
          onError('Network error. Please check your internet connection.');
        } else {
          onError(error.message || 'Failed to set password.');
        }
        setLoading(false);
        return;
      }

      // Requirement 1: refresh session so PasswordGuard never sees stale metadata
      await supabase.auth.refreshSession();

      setSuccess('Password saved successfully!');
      setTimeout(() => {
        setSuccess('');
        onSuccess(data?.user);
      }, 1000);
    } catch (err) {
      onError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // Requirement 2: reuse existing logout logic from lib/auth
      await logoutUser();
      localStorage.removeItem('lastActivity');
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">
          {isForgotPassword ? 'New Password' : 'Create Password'}
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8272]" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-12 pr-12 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] placeholder-[#8A8272] disabled:bg-gray-50"
            autoComplete="new-password"
            autoFocus
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

      <div>
        <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8272]" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-12 pr-12 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] placeholder-[#8A8272] disabled:bg-gray-50"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8272] hover:text-[#1B2A4A] transition"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Live validation hints */}
      <div className="p-3 bg-[#FBF8F1] rounded-xl border border-[#EDE6D6] space-y-2">
        <p className="text-xs font-semibold text-[#1B2A4A]">Password requirements:</p>
        <div className="flex items-center gap-2 text-xs">
          {isMinLength ? (
            <CheckCircle className="w-4 h-4 text-[#27AE60] flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border border-[#8A8272] flex-shrink-0" />
          )}
          <span className={isMinLength ? 'text-[#27AE60] font-medium' : 'text-[#5B5647]'}>
            At least 8 characters
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isMatching ? (
            <CheckCircle className="w-4 h-4 text-[#27AE60] flex-shrink-0" />
          ) : confirmPassword.length > 0 && !isMatching ? (
            <AlertCircle className="w-4 h-4 text-[#B23A2E] flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border border-[#8A8272] flex-shrink-0" />
          )}
          <span
            className={
              isMatching
                ? 'text-[#27AE60] font-medium'
                : confirmPassword.length > 0 && !isMatching
                ? 'text-[#B23A2E] font-medium'
                : 'text-[#5B5647]'
            }
          >
            Passwords match
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] mt-2"
        style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
      >
        {loading ? (
          <><Loader className="w-4 h-4 animate-spin" /> Saving Password...</>
        ) : (
          <>{isForgotPassword ? 'Reset & Continue' : 'Set Password & Continue'} <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      {/* Requirement 2: Log out / Switch account using existing logout logic */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleSwitchAccount}
          disabled={loading || loggingOut}
          className="text-xs font-semibold text-[#8A8272] hover:text-[#B23A2E] transition inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          {loggingOut ? 'Signing out...' : 'Log out / Switch account'}
        </button>
      </div>
    </form>
  );
}

