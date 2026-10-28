'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, AlertCircle, CheckCircle, Loader, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const SJCET_REGEX = /^[a-zA-Z0-9._]{1,27}20(2[5-9]|3[0-5])@[a-z]{2,3}\.sjcetpalai\.ac\.in$/i;

const DEPT_MAP = {
  cs: 'CS', ecs: 'ECS', eee: 'EEE', me: 'ME',
  civil: 'Civil', mca: 'MCA', mba: 'MBA', ad: 'AD',
  ec: 'ECE', cy: 'CS CY',
};

const INSTITUTION_ID = 'd369d7e0-6808-481f-888c-8b13418ec463';
const INSTITUTION_TYPE = 'engineering_college';

export default function Login() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionUser, setSessionUser] = useState(null);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [detectedDept, setDetectedDept] = useState('');
  const [semester, setSemester] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setSessionExpired(true);
      setError('Your session has expired. Please login again.');
      window.history.replaceState({}, document.title, '/login');
    }
  }, []);

  const validateEmail = (emailInput) => {
    if (!emailInput || !emailInput.trim()) {
      return 'Email is required';
    }
    const cleanEmail = emailInput.trim();
    if (!SJCET_REGEX.test(cleanEmail)) {
      return 'Please enter a valid SJCET student email (e.g., student2026@cs.sjcetpalai.ac.in)';
    }
    return null;
  };

  const handleSendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        if (otpError.message.includes('rate limit')) {
          setError('Too many attempts. Wait 5 minutes.');
        } else {
          setError(otpError.message || 'Failed to send OTP.');
        }
        setLoading(false);
        return;
      }

      setSuccess('OTP sent to your SJCET email!');
      setOtpTimer(300);
      setOtpAttempts(0);
      setTimeout(() => {
        setStep(2);
        setSuccess('');
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setLoading(true);

    if (isLockedOut) {
      setError(`Too many attempts. Try again in ${lockoutTimer} seconds.`);
      setLoading(false);
      return;
    }

    if (!otp || otp.length !== 6) {
      setError('OTP must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp.trim(),
        type: 'email',
      });

      const session = data?.session || (data?.user ? { user: data.user } : null);

      if (verifyError || !session?.user) {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLockedOut(true);
          setLockoutTimer(300);
          setError('Too many attempts. Locked for 5 minutes.');
        } else {
          setError(`Invalid OTP. ${3 - newAttempts} attempts left.`);
        }
        setOtp('');
        setLoading(false);
        return;
      }

      // Security requirement: use session.user.id and session.user.email only, never form values
      const authUserId = session.user.id;
      const authUserEmail = session.user.email;
      setSessionUser(session.user);

      // Check if user record already exists to inspect profile completeness
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, full_name, department, semester, is_verified, institution_id, institution_type')
        .eq('id', authUserId)
        .single();

      // Extract department from verified session email domain via DEPT_MAP
      const deptMatch = authUserEmail.match(/@([a-z]{2,3})\./i);
      const autoDept = deptMatch && DEPT_MAP[deptMatch[1].toLowerCase()] ? DEPT_MAP[deptMatch[1].toLowerCase()] : '';
      setDetectedDept(autoDept);

      const hasCompleteProfile = !!(
        existingUser?.full_name &&
        existingUser?.semester &&
        (existingUser?.department || autoDept)
      );

      if (hasCompleteProfile) {
        // Returning user with full profile: upsert institution details without sending is_verified
        const userPayload = {
          id: authUserId,
          email: authUserEmail,
          department: existingUser.department || autoDept || null,
          full_name: existingUser.full_name,
          semester: existingUser.semester,
          institution_id: INSTITUTION_ID,
          institution_type: INSTITUTION_TYPE,
        };

        const { error: upsertError } = await supabase
          .from('users')
          .upsert([userPayload], { onConflict: 'id' });

        if (upsertError) {
          console.error('Failed to update user row:', upsertError);
          throw upsertError;
        }

        localStorage.setItem('user', JSON.stringify({
          id: authUserId,
          email: authUserEmail,
          fullName: userPayload.full_name,
          full_name: userPayload.full_name,
          department: userPayload.department,
          semester: userPayload.semester,
          is_verified: existingUser?.is_verified ?? false,
          institution_type: userPayload.institution_type,
          institution_id: userPayload.institution_id,
        }));
        localStorage.setItem('lastActivity', Date.now().toString());

        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      } else {
        // Missing full_name, semester, or department: prompt profile step
        // For a brand-new user, do NOT upsert before the profile form is submitted.
        if (existingUser?.full_name) setFullName(existingUser.full_name);
        if (existingUser?.semester) setSemester(existingUser.semester);
        if (autoDept) {
          setDepartment(autoDept);
        } else if (existingUser?.department) {
          setDepartment(existingUser.department);
        }

        setSuccess('OTP verified! Please complete your profile.');
        setTimeout(() => {
          setStep(3);
          setSuccess('');
          setLoading(false);
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Verification failed.');
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    setError('');
    setLoading(true);

    if (!fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    const finalDept = detectedDept || department;
    if (!finalDept) {
      setError('Please select a department');
      setLoading(false);
      return;
    }

    if (!semester) {
      setError('Please select your semester');
      setLoading(false);
      return;
    }

    const userId = sessionUser?.id;
    const userEmail = sessionUser?.email;

    if (!userId || !userEmail) {
      setError('Session expired. Please verify your OTP again.');
      setLoading(false);
      setStep(1);
      return;
    }

    try {
      // Upsert using session.user.id and session.user.email only
      // Do not send is_verified from the client
      const userPayload = {
        id: userId,
        email: userEmail,
        full_name: fullName.trim(),
        department: finalDept,
        semester,
        institution_id: INSTITUTION_ID,
        institution_type: INSTITUTION_TYPE,
      };

      const { error: upsertError } = await supabase
        .from('users')
        .upsert([userPayload], { onConflict: 'id' });

      if (upsertError) throw upsertError;

      // Re-select row to get DB-truth is_verified
      const { data: savedUser } = await supabase
        .from('users')
        .select('id, full_name, department, semester, is_verified, institution_id, institution_type')
        .eq('id', userId)
        .single();

      localStorage.setItem('user', JSON.stringify({
        id: userId,
        email: userEmail,
        fullName: savedUser?.full_name || userPayload.full_name,
        full_name: savedUser?.full_name || userPayload.full_name,
        department: savedUser?.department || userPayload.department,
        semester: savedUser?.semester || userPayload.semester,
        is_verified: savedUser?.is_verified ?? false,
        institution_type: savedUser?.institution_type || userPayload.institution_type,
        institution_id: savedUser?.institution_id || userPayload.institution_id,
      }));
      localStorage.setItem('lastActivity', Date.now().toString());

      setSuccess('Profile completed! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to complete profile');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 240) {
      setError('Please wait before requesting a new OTP');
      return;
    }
    setOtp('');
    setOtpAttempts(0);
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] font-body flex items-center justify-center px-4 py-8 overflow-y-auto relative">
      {/* Subtle corkboard texture overlay matching home page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: '#F1E8D8',
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(27,42,74,0.08) 1px, transparent 0)',
          backgroundSize: '22px 22px',
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FBF8F1]/60 to-[#FBF8F1] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-[#EDE6D6]">

          <div className="text-center mb-7">
            <img src="/logo.png" alt="Unshelf" className="h-16 w-auto mx-auto mb-3 object-contain" />
            <h2 className="font-display text-xl font-semibold text-[#1B2A4A] mt-1">
              {step === 1
                ? '🎓 SJCET Campus Login'
                : step === 2
                ? '✉️ Verify your email'
                : '👤 Complete your profile'}
            </h2>
            <p className="text-xs text-[#5B5647] mt-1">
              {step === 1
                ? 'Exclusive to St. Joseph\'s College of Engineering and Technology'
                : step === 2
                ? `Enter the 6-digit code sent to ${email}`
                : 'Set up your name, semester and contact to finish joining'}
            </p>
          </div>

          <div className="flex gap-2 mb-7">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  background: s <= step
                    ? 'linear-gradient(90deg, #1B2A4A, #27AE60)'
                    : '#EDE6D6',
                }}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl flex gap-3 border border-red-200 bg-[#FEF2F2]">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-xl flex gap-3 border border-[#CFECDA] bg-[#EAF3EC]">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#1F7A44]" />
              <p className="text-sm text-[#1F7A44] font-medium">{success}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#EAF3EC] border border-[#CFECDA] flex gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1F7A44] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#1F7A44] leading-relaxed">
                  Only official SJCET student email addresses (batch 2025–2035) are permitted.
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
                    className="w-full pl-12 pr-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] placeholder-[#8A8272]"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={!email || loading}
                className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Sending OTP...</>
                ) : (
                  <>Send OTP <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Enter 6-Digit OTP
                  </label>
                  {otpTimer > 0 && (
                    <span className="text-xs font-semibold text-[#B23A2E]">
                      ⏱️ {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLockedOut}
                  className="w-full px-4 py-3.5 min-h-[56px] rounded-xl border-2 border-[#EDE6D6] text-center text-3xl tracking-widest font-light focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 disabled:bg-gray-100 transition text-[#1B2A4A]"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || loading || isLockedOut}
                className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {otpTimer > 0 && otpTimer <= 300 && (
                <button
                  onClick={handleResendOTP}
                  disabled={otpTimer > 240}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#1B2A4A] hover:text-[#27AE60] disabled:opacity-50 transition"
                >
                  🔄 Resend OTP
                </button>
              )}

              <button
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#1B2A4A] hover:text-[#27AE60] transition"
              >
                ← Change Email
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Alex Joseph"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] placeholder-[#8A8272]"
                />
              </div>

              {detectedDept ? (
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-[#1B2A4A]">Department</label>
                  <div className="py-2.5 px-4 rounded-xl border border-[#CFECDA] bg-[#EAF3EC] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1F7A44]">{detectedDept}</span>
                    <span className="text-xs font-medium text-[#1F7A44]/80">✓ Detected from SJCET email</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] bg-white"
                  >
                    <option value="">Select Department</option>
                    {['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT', 'Other'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] bg-white"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={`S${s}`}>Semester {s} (S{s})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCompleteProfile}
                disabled={!fullName.trim() || (!detectedDept && !department) || !semester || loading}
                className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all mt-2 active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Saving Profile...</>
                ) : (
                  <>Complete & Enter Unshelf <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-[#5B5647] mt-6">
            By logging in, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
