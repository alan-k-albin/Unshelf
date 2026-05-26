'use client';

import { useState } from 'react';
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

  const validateEmail = (emailInput) => {
    if (!emailInput) return 'Email is required';
    if (!COLLEGE_EMAIL_REGEX.test(emailInput))
      return 'Please use your college email format';
    return null;
  };

  const handleSendOTP = async () => {
    setError(''); setSuccess(''); setLoading(true);
    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); setLoading(false); return; }
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: 'temp_' + Math.random().toString(36).slice(2),
      });
      if (signUpError) {
        if (signUpError.message.includes('rate limit')) setError('Too many attempts. Please wait 5 minutes.');
        else if (signUpError.message.includes('already registered')) setError('This email is already registered.');
        else setError(signUpError.message || 'Failed to send OTP.');
        setLoading(false); return;
      }
      setSuccess('OTP sent successfully!');
      setTimeout(() => { setStep(2); setSuccess(''); setLoading(false); }, 1500);
    } catch (err) { setError(err.message || 'An error occurred.'); setLoading(false); }
  };

  const handleVerifyOTP = () => {
    setError(''); setLoading(true);
    if (!otp) { setError('OTP is required'); setLoading(false); return; }
    if (otp.length !== 6) { setError('OTP must be 6 digits'); setLoading(false); return; }
    setSuccess('OTP verified!');
    setTimeout(() => { setStep(3); setSuccess(''); setLoading(false); }, 1200);
  };

  const handleCompleteProfile = async () => {
    setError(''); setLoading(true);
    if (!fullName) { setError('Full name is required'); setLoading(false); return; }
    if (!department) { setError('Please select a department'); setLoading(false); return; }
    if (!semester) { setError('Please select a semester'); setLoading(false); return; }
    if (!whatsapp || whatsapp.length !== 10) { setError('WhatsApp number must be 10 digits'); setLoading(false); return; }
    try {
      const deptMatch = email.match(/@([a-z]+)\./i);
      const deptMap = { 'cs': 'CS', 'ecs': 'ECS', 'eee': 'EEE', 'me': 'ME', 'civil': 'Civil', 'mca': 'MCA', 'mba': 'MBA', 'ad': 'AD' };
      const emailDept = deptMatch ? deptMap[deptMatch[1].toLowerCase()] : department;
      const { error: insertError } = await supabase.from('users').insert([{
        email, full_name: fullName, department: emailDept,
        semester, whatsapp_number: whatsapp, is_verified: true,
      }]);
      if (insertError) throw insertError;
      localStorage.setItem('user', JSON.stringify({ email, fullName, department: emailDept, semester, whatsapp }));
      setSuccess('Account created successfully!');
      setTimeout(() => { router.push('/'); }, 1500);
    } catch (err) { setError(err.message || 'Failed to create account'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #1a3a5c 40%, #0f4c75 100%)' }}>

      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: '#27AE60', filter: 'blur(80px)', transform: 'translate(-30%, -30%)' }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
        style={{ background: '#27AE60', filter: 'blur(100px)', transform: 'translate(30%, 30%)' }} />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #1B2A4A, #27AE60)' }}>
              <span className="text-white text-xl font-bold">U</span>
            </div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#1B2A4A' }}>Unshelf</h1>
            <p className="text-gray-500 text-sm">
              {step === 1 && 'Welcome Back 👋'}
              {step === 2 && 'Verify Your Email 📧'}
              {step === 3 && 'Complete Your Profile ✏️'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{ background: s <= step ? '#27AE60' : '#E5E7EB' }} />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-xl flex gap-3 border"
              style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 p-4 rounded-xl flex gap-3 border"
              style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#16A34A' }} />
              <p className="text-sm" style={{ color: '#16A34A' }}>{success}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
                  College Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="student@cs.sjcetpalai.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm transition-all outline-none"
                    style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                    onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  We'll send an OTP to verify your identity
                </p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={!email || loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: loading ? '#94A3B8' : 'linear-gradient(135deg, #1B2A4A, #27AE60)' }}
              >
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Sending...</> : 'Send OTP →'}
              </button>

              <p className="text-center text-xs text-gray-400">
                Supported: @cs, @ecs, @eee, @me, @civil, @mca, @mba, @ad
              </p>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
                  Enter OTP
                </label>
                <p className="text-xs text-gray-400 mb-4">Sent to {email}</p>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 rounded-xl border-2 text-center text-3xl tracking-widest font-light outline-none transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                  onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1B2A4A, #27AE60)' }}
              >
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify OTP →'}
              </button>

              <button
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                style={{ color: '#1B2A4A', background: '#F8FAFC' }}
              >
                ← Back
              </button>
            </div>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <div className="space-y-4">
              {[
                { label: 'Full Name', type: 'text', value: fullName, onChange: setFullName, placeholder: 'Rahul Sharma' },
              ].map(({ label, type, value, onChange, placeholder }) => (
                <div key={label}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                    style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                    onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                  onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                >
                  <option value="">Select Department</option>
                  {['CS','CS AI','CS CY','ECS','EEE','ME','Civil','MCA','MBA','AD'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                  onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={`S${s}`}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>WhatsApp Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    maxLength="10"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                    style={{ borderColor: '#E5E7EB', color: '#1B2A4A' }}
                    onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              </div>

              <button
                onClick={handleCompleteProfile}
                disabled={!fullName || !department || !semester || !whatsapp || loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg, #1B2A4A, #27AE60)' }}
              >
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Creating Account...</> : 'Complete Login →'}
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            By logging in, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
    }
