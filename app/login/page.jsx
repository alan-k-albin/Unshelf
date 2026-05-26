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
    if (!COLLEGE_EMAIL_REGEX.test(emailInput)) {
      return 'Please use your college email format';
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
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: 'temp_' + Math.random().toString(36).slice(2),
      });

      if (signUpError) {
        if (signUpError.message.includes('rate limit')) {
          setError('Too many attempts. Please wait 5 minutes.');
        } else if (signUpError.message.includes('already registered')) {
          setError('This email is already registered.');
        } else {
          setError(signUpError.message || 'Failed to send OTP.');
        }
        setLoading(false);
        return;
      }

      setSuccess('OTP sent successfully!');
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

  const handleVerifyOTP = () => {
    setError('');
    setLoading(true);

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

    setSuccess('OTP verified!');
    setTimeout(() => {
      setStep(3);
      setSuccess('');
      setLoading(false);
    }, 1200);
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
      setError('Please select a department');
      setLoading(false);
      return;
    }
    if (!semester) {
      setError('Please select a semester');
      setLoading(false);
      return;
    }
    if (!whatsapp || whatsapp.length !== 10) {
      setError('WhatsApp number must be 10 digits');
      setLoading(false);
      return;
    }

    try {
      const deptMatch = email.match(/@([a-z]+)\./i);
      const deptMap = {
        'cs': 'CS', 'ecs': 'ECS', 'eee': 'EEE', 'me': 'ME',
        'civil': 'Civil', 'mca': 'MCA', 'mba': 'MBA', 'ad': 'AD'
      };
      const emailDept = deptMatch ? deptMap[deptMatch[1].toLowerCase()] : department;

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
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

      setSuccess('Account created successfully!');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-primary mb-3">Unshelf</h1>
          <p className="text-gray-500 text-sm tracking-wide">
            {step === 1 && 'Welcome Back'}
            {step === 2 && 'Verify Your Email'}
            {step === 3 && 'Complete Your Profile'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                College Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="student@cs.sjcetpalai.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll send an OTP to verify your identity
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={!email || loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Enter OTP
              </label>
              <p className="text-sm text-gray-600 mb-4">
                We sent a code to {email}
              </p>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-3xl tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-light"
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>

            <button
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
              className="w-full text-primary py-2 text-sm hover:bg-primary/5 rounded-lg transition"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              >
                <option value="">Select Department</option>
                <option>CS</option>
                <option>CS AI</option>
                <option>CS CY</option>
                <option>ECS</option>
                <option>EEE</option>
                <option>ME</option>
                <option>Civil</option>
                <option>MCA</option>
                <option>MBA</option>
                <option>AD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
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
              <label className="block text-sm font-medium text-primary mb-2">
                WhatsApp Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  maxLength="10"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            <button
              onClick={handleCompleteProfile}
              disabled={!fullName || !department || !semester || !whatsapp || loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition mt-8 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Login'
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-10">
          By logging in, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
                                           }
