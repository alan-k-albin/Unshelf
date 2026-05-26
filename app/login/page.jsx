'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Smartphone, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const COLLEGE_EMAIL_REGEX = /^[a-zA-Z0-9._]{1,27}@[a-z]{2,3}\.sjcetpalai\.ac\.in$/i;

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
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

  const validateEmail = (emailInput) => {
    if (!emailInput) return 'Email is required';
    if (!COLLEGE_EMAIL_REGEX.test(emailInput))
      return 'Use your college email: name@dept.sjcetpalai.ac.in';
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
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        if (otpError.message.includes('rate limit'))
          setError('Too many attempts. Wait 5 minutes.');
        else setError(otpError.message || 'Failed to send OTP.');
        setLoading(false);
        return;
      }

      setSuccess('OTP sent to your email!');
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

    if (!otp) {
      setError('OTP is required');
      setLoading(false);
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError || !data.user) {
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

      setSuccess('OTP verified! Complete your profile.');
      setTimeout(() => {
        setStep(3);
        setSuccess('');
        setLoading(false);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Verification failed.');
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

  const handleCompleteProfile = async () => {
    setError('');
    setLoading(true);

    if (!fullName) {
      setError('Full name is required');
      setLoading(false);
      return;
    }
    if (!department) {
      setError('Please select your department');
      setLoading(false);
      return;
    }
    if (!semester) {
      setError('Please select your semester');
      setLoading(false);
      return;
    }
    if (!whatsapp || whatsapp.length !== 10) {
      setError('Enter valid 10-digit WhatsApp number');
      setLoading(false);
      return;
    }

    try {
      const deptMatch = email.match(/@([a-z]{2,3})\./i);
      const deptMap = {
        cs: 'CS',
        ecs: 'ECS',
        eee: 'EEE',
        me: 'ME',
        civil: 'Civil',
        mca: 'MCA',
        mba: 'MBA',
        ad: 'AD',
      };
      const emailDept = deptMatch ? deptMap[deptMatch[1].toLowerCase()] : department;

      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id;

      if (!authUserId) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('users').insert([
        {
          id: authUserId,
          email,
          full_name: fullName,
          department: emailDept,
          semester,
          whatsapp_number: whatsapp,
          is_verified: true,
        },
      ]);

      if (insertError) throw insertError;

      localStorage.setItem('user', JSON.stringify({
        email,
        fullName,
        department: emailDept,
        semester,
        whatsapp,
      }));

      setSuccess('Account created! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6 overflow-y-auto"
      style={{
        background: 'linear-gradient(160deg, #1877F2 0%, #166FE5 60%, #0d5ed4 100%)',
      }}
    >
      <div
        className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(60px)',
          transform: 'translate(30%,-30%)',
        }}
      />
      <div
        className="fixed bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'rgba(39,174,96,0.15)',
          filter: 'blur(80px)',
          transform: 'translate(-30%,30%)',
        }}
      />

      <div className="w-full max-w-sm relative">
        <div className="bg-white rounded-2xl shadow-2xl px-6 py-7">
          <div className="text-center mb-5">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
              style={{ background: 'linear-gradient(135deg, #1877F2, #27AE60)' }}
            >
              <span className="text-white text-lg font-bold">U</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>
              Unshelf
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {step === 1 && 'Welcome Back 👋'}
              {step === 2 && 'Verify Your Email 📧'}
              {step === 3 && 'Complete Your Profile ✏️'}
            </p>
          </div>

          <div className="flex gap-2 mb-5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{ background: s <= step ? '#1877F2' : '#E5E7EB' }}
              />
            ))}
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl flex gap-2 border"
              style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
            >
              <AlertCircle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: '#DC2626' }}
              />
              <p className="text-xs" style={{ color: '#DC2626' }}>
                {error}
              </p>
            </div>
          )}

          {success && (
            <div
              className="mb-4 p-3 rounded-xl flex gap-2 border"
              style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}
            >
              <CheckCircle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: '#16A34A' }}
              />
              <p className="text-xs" style={{ color: '#16A34A' }}>
                {success}
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
                  College Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="student@cs.sjcetpalai.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm transition-all outline-none"
                    style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                    onFocus={(e) => (e.target.style.borderColor = '#1877F2')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">All SJCET departments supported</p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={!email || loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background:
                    loading ? '#94A3B8' : 'linear-gradient(135deg, #1877F2, #166FE5)',
                }}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  'Send OTP →'
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
                  Enter OTP
                </label>
                <p className="text-xs text-gray-400 mb-1">Sent to {email}</p>
                {otpTimer > 0 && (
                  <p className="text-xs text-orange-600 mb-2 font-semibold">
                    ⏱️ Expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                  </p>
                )}
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLockedOut}
                  className="w-full px-4 py-3 rounded-xl border-2 text-center text-2xl tracking-widest font-light outline-none disabled:bg-gray-100"
                  style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1877F2')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || loading || isLockedOut}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Verify OTP →'
                )}
              </button>

              {otpTimer > 0 && (
                <button
                  onClick={handleResendOTP}
                  disabled={otpTimer > 240}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 disabled:opacity-50"
                  style={{ background: '#EFF6FF' }}
                >
                  🔄 Resend OTP
                </button>
              )}

              <button
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                  setOtpTimer(0);
                }}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ color: '#1877F2', background: '#EFF6FF' }}
              >
                ← Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1877F2')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1877F2')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                >
                  <option value="">Select Department</option>
                  {['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT'].map(
                    (d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1877F2')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={`S${s}`}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1B2A4A' }}>
                  WhatsApp Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    maxLength="10"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none"
                    style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                    onFocus={(e) => (e.target.style.borderColor = '#1877F2')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              </div>

              <button
                onClick={handleCompleteProfile}
                disabled={!fullName || !department || !semester || !whatsapp || loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Creating Account...
                  </>
                ) : (
                  'Complete Login →'
                )}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            By logging in, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
    }
