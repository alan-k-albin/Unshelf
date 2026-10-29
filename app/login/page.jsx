'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PasswordLoginForm from '@/components/auth/PasswordLoginForm';
import OtpRequestForm from '@/components/auth/OtpRequestForm';
import OtpVerifyForm from '@/components/auth/OtpVerifyForm';
import SetPasswordForm from '@/components/auth/SetPasswordForm';

const DEPT_MAP = {
  cs: 'CS', ecs: 'ECS', eee: 'EEE', me: 'ME',
  civil: 'Civil', mca: 'MCA', mba: 'MBA', ad: 'AD',
  ec: 'ECE', cy: 'CS CY',
};

const INSTITUTION_ID = 'd369d7e0-6808-481f-888c-8b13418ec463';
const INSTITUTION_TYPE = 'engineering_college';

// Views: 'PASSWORD_LOGIN' | 'OTP_REQUEST' | 'OTP_VERIFY' | 'SET_PASSWORD' | 'PROFILE'
export default function Login() {
  const router = useRouter();

  const [view, setView] = useState('PASSWORD_LOGIN');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [sessionUser, setSessionUser] = useState(null);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [detectedDept, setDetectedDept] = useState('');
  const [semester, setSemester] = useState('');

  const [loading, setLoading] = useState(false);
  const [checkingInitialSession, setCheckingInitialSession] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setError('Your session has expired. Please login again.');
      window.history.replaceState({}, document.title, '/login');
    }

    const checkViewParam = async () => {
      const viewParam = params.get('view');
      if (viewParam === 'set-password') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSessionUser(session.user);
          if (session.user.email) setEmail(session.user.email);
          setView('SET_PASSWORD');
          setCheckingInitialSession(false);
          return;
        }
      }
      setCheckingInitialSession(false);
    };

    checkViewParam();
  }, []);

  const checkAndRouteUserProfile = async (user) => {
    const authUserId = user.id;
    const authUserEmail = user.email;
    setSessionUser(user);

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, full_name, department, semester, is_verified, institution_id, institution_type')
        .eq('id', authUserId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', fetchError);
      }

      const deptMatch = authUserEmail ? authUserEmail.match(/@([a-z]{2,3})\./i) : null;
      const autoDept = deptMatch && DEPT_MAP[deptMatch[1].toLowerCase()] ? DEPT_MAP[deptMatch[1].toLowerCase()] : '';
      setDetectedDept(autoDept);

      const hasCompleteProfile = !!(
        existingUser?.full_name &&
        existingUser?.semester &&
        (existingUser?.department || autoDept)
      );

      if (hasCompleteProfile) {
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
          has_password: true,
        }));
        localStorage.setItem('lastActivity', Date.now().toString());

        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setFullName(existingUser?.full_name || '');
        setSemester(existingUser?.semester || '');
        if (existingUser?.department) {
          setDepartment(existingUser.department);
        } else if (autoDept) {
          setDepartment(autoDept);
        } else {
          setDepartment('');
        }
        setView('PROFILE');
      }
    } catch (err) {
      console.error('Profile route error:', err);
      setError(err.message || 'Error loading profile.');
    }
  };

  const handlePasswordLoginSuccess = async (user) => {
    setError('');
    await checkAndRouteUserProfile(user);
  };

  const handleOtpVerified = (user) => {
    setError('');
    setSessionUser(user);
    setView('SET_PASSWORD');
  };

  const handlePasswordSetSuccess = async (updatedUser) => {
    setError('');
    const userToRoute = updatedUser || sessionUser;
    if (userToRoute) {
      await checkAndRouteUserProfile(userToRoute);
    } else {
      router.push('/');
    }
  };

  const handleCompleteProfile = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    const finalDept = department.trim();
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
      setError('Session expired. Please sign in again.');
      setLoading(false);
      setView('PASSWORD_LOGIN');
      return;
    }

    try {
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
        has_password: true,
      }));
      localStorage.setItem('lastActivity', Date.now().toString());

      setSuccess('Profile completed! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to complete profile');
      setLoading(false);
    }
  };

  const getHeadingAndSubtitle = () => {
    switch (view) {
      case 'PASSWORD_LOGIN':
        return {
          title: '🎓 SJCET Campus Login',
          subtitle: "Exclusive to St. Joseph's College of Engineering and Technology",
        };
      case 'OTP_REQUEST':
        return isForgotPassword
          ? {
              title: '🔑 Reset your password',
              subtitle: 'Enter your SJCET email to receive a password reset code',
            }
          : {
              title: '✉️ First-time Login',
              subtitle: 'Verify your SJCET email to set up your password',
            };
      case 'OTP_VERIFY':
        return {
          title: '✉️ Verify your email',
          subtitle: `Enter the 6-digit code sent to ${email}`,
        };
      case 'SET_PASSWORD':
        return isForgotPassword
          ? {
              title: '🔑 Reset your password',
              subtitle: 'Choose a new password for your Unshelf account',
            }
          : {
              title: '🔒 Set your password',
              subtitle: 'Create a password of at least 8 characters for quick login',
            };
      case 'PROFILE':
        return {
          title: '👤 Complete your profile',
          subtitle: 'Set up your name, semester and department to finish joining',
        };
      default:
        return {
          title: '🎓 SJCET Campus Login',
          subtitle: "Exclusive to St. Joseph's College of Engineering and Technology",
        };
    }
  };

  const { title, subtitle } = getHeadingAndSubtitle();

  // Progress stepper mapping for multi-step onboarding/reset
  const getStepNumber = () => {
    if (view === 'OTP_REQUEST') return 1;
    if (view === 'OTP_VERIFY') return 2;
    if (view === 'SET_PASSWORD') return 3;
    if (view === 'PROFILE') return 4;
    return 0;
  };
  const currentStep = getStepNumber();

  if (checkingInitialSession) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#1B2A4A] animate-spin" />
      </div>
    );
  }

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
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Unshelf" className="h-16 w-auto mx-auto mb-3 object-contain" />
            <h2 className="font-display text-xl font-semibold text-[#1B2A4A] mt-1">
              {title}
            </h2>
            <p className="text-xs text-[#5B5647] mt-1">
              {subtitle}
            </p>
          </div>

          {currentStep > 0 && (
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className="h-1.5 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background:
                      s <= currentStep
                        ? 'linear-gradient(90deg, #1B2A4A, #27AE60)'
                        : '#EDE6D6',
                  }}
                />
              ))}
            </div>
          )}

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

          {view === 'PASSWORD_LOGIN' && (
            <PasswordLoginForm
              email={email}
              setEmail={setEmail}
              onSuccess={handlePasswordLoginSuccess}
              onForgotPassword={() => {
                setError('');
                setSuccess('');
                setIsForgotPassword(true);
                setView('OTP_REQUEST');
              }}
              onFirstTime={() => {
                setError('');
                setSuccess('');
                setIsForgotPassword(false);
                setView('OTP_REQUEST');
              }}
              onError={setError}
            />
          )}

          {view === 'OTP_REQUEST' && (
            <OtpRequestForm
              email={email}
              setEmail={setEmail}
              isForgotPassword={isForgotPassword}
              onCodeSent={() => {
                setError('');
                setView('OTP_VERIFY');
              }}
              onBackToPasswordLogin={() => {
                setError('');
                setSuccess('');
                setView('PASSWORD_LOGIN');
              }}
              onError={setError}
              setSuccess={setSuccess}
            />
          )}

          {view === 'OTP_VERIFY' && (
            <OtpVerifyForm
              email={email}
              onVerified={handleOtpVerified}
              onChangeEmail={() => {
                setError('');
                setSuccess('');
                setView('OTP_REQUEST');
              }}
              onError={setError}
              setSuccess={setSuccess}
            />
          )}

          {view === 'SET_PASSWORD' && (
            <SetPasswordForm
              isForgotPassword={isForgotPassword}
              onSuccess={handlePasswordSetSuccess}
              onLogout={() => {
                setSessionUser(null);
                setError('');
                setSuccess('');
                setView('PASSWORD_LOGIN');
              }}
              onError={setError}
              setSuccess={setSuccess}
            />
          )}

          {view === 'PROFILE' && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Alex Joseph"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] placeholder-[#8A8272] disabled:bg-gray-50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[#1B2A4A]">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] bg-white disabled:bg-gray-50"
                >
                  <option value="">Select Department</option>
                  {['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT', 'Other'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {detectedDept && (
                  <p className="text-xs text-[#27AE60] mt-1.5 font-medium">
                    ✓ Detected from your SJCET email, change it if needed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-[#1B2A4A]">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-[#EDE6D6] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] bg-white disabled:bg-gray-50"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={`S${s}`}>Semester {s} (S{s})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!fullName.trim() || !department || !semester || loading}
                className="w-full py-3.5 min-h-[48px] rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all mt-2 active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Saving Profile...</>
                ) : (
                  <>Complete & Enter Unshelf <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-[#5B5647] mt-6">
            By logging in, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
