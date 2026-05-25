'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const COLLEGE_EMAIL_REGEX = /^[a-zA-Z0-9.+_-]+@(cs|ecs|eee|me|civil|mca|mba|ad)\.sjcetpalai\.ac\.in$/i;
const DEPARTMENTS = {
  'cs': 'CS', 'ecs': 'ECS', 'eee': 'EEE', 'me': 'ME',
  'civil': 'Civil', 'mca': 'MCA', 'mba': 'MBA', 'ad': 'AD'
};

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

  const validateEmail = (emailInput) => {
    if (!COLLEGE_EMAIL_REGEX.test(emailInput)) {
      return 'Please use your college email (e.g., name2029@cs.sjcetpalai.ac.in)';
    }
    return null;
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');

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
          setError('Too many attempts. Please wait 5 minutes before trying again.');
        } else if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please login or use another email.');
        } else {
          setError(signUpError.message || 'Failed to send OTP. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Auto-proceed to OTP step (in production, Supabase sends email)
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      // In production, verify with backend
      // For now, proceed if OTP is valid length
      setStep(3);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!fullName || !department || !semester || !whatsapp) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract department from email
      const deptMatch = email.match(/@([a-z]+)\./i);
      const emailDept = deptMatch ? DEPARTMENTS[deptMatch[1].toLowerCase()] : department;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        setError('User already exists with this email');
        setLoading(false);
        return;
      }

      // Insert new user
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

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify({
        email,
        fullName,
        department: emailDept,
        semester,
        whatsapp,
      }));

      // Redirect to home
      router.push('/');
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4 pb-20 md:pb-0">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            Unshelf
          </h1>
          <p className="text-gray-600">Login with your college email</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              College Email *
            </label>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="name2029@cs.sjcetpalai.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-xs text-gray-600 mb-4">
              ✓ Format: name+year@dept.sjcetpalai.ac.in
              <br />
              Example: elommuskbezoz2029@cs.sjcetpalai.ac.in
            </p>
            <button
              onClick={handleSendOTP}
              disabled={!email || loading}
              className="btn-primary w-full mb-4 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <p className="text-center text-xs text-gray-600">
              Supported: @cs, @ecs, @eee, @me, @civil, @mca, @mba, @ad
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Enter OTP
            </label>
            <p className="text-xs text-gray-600 mb-3">
              OTP sent to {email}
            </p>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-accent mb-4"
            />
            <button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || loading}
              className="btn-primary w-full mb-2 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => { setStep(1); setOtp(''); setError(''); }}
              className="btn-secondary w-full"
            >
              Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="Your Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4"
              required
            />

            <label className="block text-sm font-medium text-primary mb-2">
              Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4"
              required
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

            <label className="block text-sm font-medium text-primary mb-2">
              Semester *
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4"
              required
            >
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`S${s}`}>S{s}</option>)}
            </select>

            <label className="block text-sm font-medium text-primary mb-2">
              WhatsApp Number *
            </label>
            <div className="relative mb-4">
              <Smartphone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="9876543210"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                required
              />
            </div>

            <button
              onClick={handleCompleteProfile}
              disabled={!fullName || !department || !semester || !whatsapp || loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Login'}
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-600">
            By logging in, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
        }
