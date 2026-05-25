'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

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

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: 'temp_password_' + Math.random().toString(36).slice(2),
      });

      if (signUpError) throw signUpError;

      // In real app, Supabase would send OTP to email
      // For demo, we'll auto-proceed after 2 seconds
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');

    try {
      // In production, verify actual OTP here
      // For now, accept any OTP and proceed
      if (otp.length === 6) {
        setStep(3);
      } else {
        setError('Please enter a 6-digit OTP');
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
      setLoading(false);
    }
  };

  // Step 3: Complete Profile & Save to Database
  const handleCompleteProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) throw new Error('Not authenticated');

      // Insert user into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: authData.user.email,
            full_name: fullName,
            department,
            semester,
            whatsapp_number: whatsapp,
            is_verified: true,
          },
        ]);

      if (insertError) throw insertError;

      // Save user data to localStorage for session
      localStorage.setItem('user', JSON.stringify({
        email,
        fullName,
        department,
        semester,
        whatsapp,
      }));

      // Redirect to home
      router.push('/');
    } catch (err) {
      setError(err.message || 'Failed to save profile');
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              College Email
            </label>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="yourname@cs.sjcetpalai.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-xs text-gray-600 mb-4">
              ✓ College email users get a verified badge
            </p>
            <button
              onClick={handleSendOTP}
              disabled={!email || loading}
              className="btn-primary w-full mb-4 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <p className="text-center text-xs text-gray-600">
              Supported: @cs.sjcetpalai.ac.in, @ecs.sjcetpalai.ac.in, @eee.sjcetpalai.ac.in
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
              onClick={() => setStep(1)}
              className="btn-secondary w-full"
            >
              Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Alan K Albin"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4"
            />

            <label className="block text-sm font-medium text-primary mb-2">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4"
            >
              <option>Select Department</option>
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
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4"
            >
              <option>Select Semester</option>
              <option>S1</option>
              <option>S2</option>
              <option>S3</option>
              <option>S4</option>
              <option>S5</option>
              <option>S6</option>
              <option>S7</option>
              <option>S8</option>
            </select>

            <label className="block text-sm font-medium text-primary mb-2">
              WhatsApp Number
            </label>
            <div className="relative mb-4">
              <Smartphone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="9876543210"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
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
