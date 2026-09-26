'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Smartphone, AlertCircle, CheckCircle, Loader, ArrowRight, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const INSTITUTION_TYPES = [
  { value: 'engineering_college', label: '🏛️ Engineering College' },
  { value: 'arts_college', label: '🎓 Arts College' },
  { value: 'school', label: '🏫 School' },
  { value: 'coaching_center', label: '📘 Coaching Center' },
  { value: 'other', label: '✨ Other' },
];

const DEPT_MAP = {
  cs: 'CS', ecs: 'ECS', eee: 'EEE', me: 'ME',
  civil: 'Civil', mca: 'MCA', mba: 'MBA', ad: 'AD',
};

export default function Login() {
  const router = useRouter();

  // Step 0 = institution type, Step 0.5 = pick institution, Step 1 = email,
  // Step 2 = OTP, Step 3 = complete profile
  const [step, setStep] = useState(0);

  const [institutionType, setInstitutionType] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState(null); // null = "not listed" / unverified path
  const [notListed, setNotListed] = useState(false);

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

  // Fetch institutions of the selected type once chosen
  useEffect(() => {
    if (!institutionType) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('institutions')
        .select('id, name, type, email_regex')
        .eq('type', institutionType)
        .eq('is_active', true)
        .order('name');
      if (!fetchErr) setInstitutions(data || []);
    })();
  }, [institutionType]);

  const filteredInstitutions = useMemo(() => {
    if (!institutionSearch) return institutions;
    return institutions.filter((i) =>
      i.name.toLowerCase().includes(institutionSearch.toLowerCase())
    );
  }, [institutions, institutionSearch]);

  // Is this a verified (real-domain) institution, or the Gmail/unverified tier?
  const isVerifiedTier = !!(selectedInstitution && selectedInstitution.email_regex);

  const validateEmail = (emailInput) => {
    if (!emailInput) return 'Email is required';
    if (isVerifiedTier) {
      const regex = new RegExp(selectedInstitution.email_regex, 'i');
      if (!regex.test(emailInput)) {
        return `Use your ${selectedInstitution.name} email address`;
      }
    } else {
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(emailInput)) {
        return 'Please use a Gmail address (@gmail.com)';
      }
    }
    return null;
  };

  const handleSelectInstitutionType = (type) => {
    setInstitutionType(type);
    setInstitutionSearch('');
    setSelectedInstitution(null);
    setNotListed(false);
    setStep(0.5);
  };

  const handlePickInstitution = (inst) => {
    setSelectedInstitution(inst);
    setNotListed(false);
    setStep(1);
  };

  const handleNotListed = () => {
    setSelectedInstitution(null);
    setNotListed(true);
    setStep(1);
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

    if (!otp || otp.length !== 6) {
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

      // Check if user already has a profile in the users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, full_name, department, semester, whatsapp_number, is_verified, institution_type')
        .eq('id', data.user.id)
        .single();

      if (existingUser) {
        localStorage.setItem('user', JSON.stringify({
          email,
          fullName: existingUser.full_name,
          full_name: existingUser.full_name,
          department: existingUser.department,
          semester: existingUser.semester,
          whatsapp: existingUser.whatsapp_number,
          is_verified: existingUser.is_verified,
          institution_type: existingUser.institution_type,
        }));
        localStorage.setItem('lastActivity', Date.now().toString());
        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => { router.push('/'); }, 1200);
        return;
      }

      // New user — go to profile completion step
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

    if (!fullName || !department || !semester || !whatsapp || whatsapp.length !== 10) {
      setError('Please fill all fields correctly');
      setLoading(false);
      return;
    }

    try {
      // SJCET-style dept-from-email extraction only applies to the verified
      // institution that actually uses that email pattern (email_regex present
      // AND email contains a dept subdomain). For everyone else, use the
      // manually selected department as-is.
      let emailDept = department;
      if (isVerifiedTier) {
        const deptMatch = email.match(/@([a-z]{2,3})\./i);
        if (deptMatch && DEPT_MAP[deptMatch[1].toLowerCase()]) {
          emailDept = DEPT_MAP[deptMatch[1].toLowerCase()];
        }
      }

      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id;

      if (!authUserId) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      const { error: upsertError } = await supabase.from('users').upsert(
        [
          {
            id: authUserId,
            email,
            full_name: fullName,
            department: emailDept || department,
            semester,
            whatsapp_number: whatsapp,
            is_verified: isVerifiedTier,
            institution_id: selectedInstitution?.id || null,
            institution_type: institutionType || null,
          },
        ],
        { onConflict: 'id' }
      );

      if (upsertError) throw upsertError;

      localStorage.setItem('user', JSON.stringify({
        email,
        fullName,
        full_name: fullName,
        department: emailDept || department,
        semester,
        whatsapp,
        is_verified: isVerifiedTier,
        institution_type: institutionType,
      }));
      localStorage.setItem('lastActivity', Date.now().toString());

      setSuccess('Account created! Redirecting...');
      setTimeout(() => { router.push('/'); }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const stepLabel = () => {
    if (step === 0) return '🏫 Where do you study?';
    if (step === 0.5) return '🔎 Find your institution';
    if (step === 1) return '📚 Welcome to your marketplace';
    if (step === 2) return '✉️ Verify your email';
    return '👤 Complete your profile';
  };

  // Progress across 4 conceptual stages (0/0.5 count as one stage)
  const progressStage = step === 0 || step === 0.5 ? 1 : step === 1 ? 2 : step === 2 ? 3 : 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4 py-8 overflow-y-auto relative">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/80">

          <div className="text-center mb-8">
            <img src="/logo.png" alt="Unshelf" className="h-20 w-auto mx-auto mb-3 object-contain" />
            <p className="text-gray-500 text-sm mt-1">{stepLabel()}</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  background: s <= progressStage
                    ? 'linear-gradient(90deg, #1877F2, #27AE60)'
                    : '#E5E7EB',
                }}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex gap-3 border border-red-200 bg-red-50/50">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl flex gap-3 border border-green-200 bg-green-50/50">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Step 0: Institution Type */}
          {step === 0 && (
            <div className="space-y-3">
              {INSTITUTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleSelectInstitutionType(t.value)}
                  className="w-full py-3.5 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-left hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between"
                  style={{ color: '#1B2A4A' }}
                >
                  {t.label}
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* Step 0.5: Pick institution */}
          {step === 0.5 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={institutionSearch}
                  onChange={(e) => setInstitutionSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  style={{ color: '#1B2A4A' }}
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => handlePickInstitution(inst)}
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-sm text-left hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between"
                    style={{ color: '#1B2A4A' }}
                  >
                    <span>{inst.name}</span>
                    <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </button>
                ))}

                {filteredInstitutions.length === 0 && institutionSearch && (
                  <p className="text-xs text-gray-500 text-center py-2">No matches found.</p>
                )}
              </div>

              <button
                onClick={handleNotListed}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-gray-400 transition flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                My institution isn't listed
              </button>

              <button
                onClick={() => setStep(0)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
              >
                ← Change institution type
              </button>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="space-y-4">
              {!isVerifiedTier && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Your institution doesn't have a verified email system yet, so you'll sign
                    in with Gmail. Your account will show as <strong>unverified</strong> — WhatsApp
                    contact reveal and posting paid services will be unavailable until your
                    institution is verified.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
                  {isVerifiedTier ? `${selectedInstitution.name} Email` : 'Gmail Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder={isVerifiedTier ? 'student@dept.college.ac.in' : 'yourname@gmail.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    style={{ color: '#1B2A4A' }}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={!email || loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Sending OTP...</>
                ) : (
                  <>Send OTP <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <button
                onClick={() => setStep(0.5)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
              >
                ← Go Back
              </button>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold" style={{ color: '#1B2A4A' }}>
                    Enter 6-Digit OTP
                  </label>
                  {otpTimer > 0 && (
                    <span className="text-xs font-semibold text-orange-600">
                      ⏱️ {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">Sent to {email}</p>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLockedOut}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-center text-3xl tracking-widest font-light focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 transition"
                  style={{ color: '#1B2A4A' }}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || loading || isLockedOut}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg transition-all"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Verify OTP <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {otpTimer > 0 && otpTimer <= 300 && (
                <button
                  onClick={handleResendOTP}
                  disabled={otpTimer > 240}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition"
                >
                  🔄 Resend OTP
                </button>
              )}

              <button
                onClick={() => setStep(1)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
              >
                ← Go Back
              </button>
            </div>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <div className="space-y-4">
              {!isVerifiedTier && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Your account will be marked <strong>Unverified</strong>. You can browse and post
                    listings/requests, but WhatsApp contact reveal and posting paid services are
                    disabled until your institution is verified.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  style={{ color: '#1B2A4A' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  style={{ color: '#1B2A4A' }}
                >
                  <option value="">Select Department</option>
                  {['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT', 'Other'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Semester / Year</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  style={{ color: '#1B2A4A' }}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={`S${s}`}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>WhatsApp Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    maxLength="10"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    style={{ color: '#1B2A4A' }}
                  />
                </div>
              </div>

              <button
                onClick={handleCompleteProfile}
                disabled={!fullName || !department || !semester || !whatsapp || loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg transition-all mt-2"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Creating Account...</>
                ) : (
                  <>Complete Login <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            By logging in, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
