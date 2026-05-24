'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Smartphone } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4 pb-20 md:pb-0">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            Unshelf
          </h1>
          <p className="text-gray-600">Login with your college email</p>
        </div>

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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-xs text-gray-600 mb-4">
              ✓ College email users get a verified badge
            </p>
            <button
              onClick={() => setStep(2)}
              className="btn-primary w-full mb-4"
            >
              Send OTP
            </button>
            <p className="text-center text-xs text-gray-600">
              Supported: @cs.sjcetpalai.ac.in, @ecs.sjcetpalai.ac.in, @eee.sjcetpalai.ac.in, etc.
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Enter OTP
            </label>
            <p className="text-xs text-gray-600 mb-3">
              OTP sent to your email (check spam folder)
            </p>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength="1"
                  className="w-full h-12 text-center border border-gray-300 rounded-lg text-xl focus:outline-none focus:border-accent"
                />
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              className="btn-primary w-full mb-2"
            >
              Verify OTP
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4"
            />

            <label className="block text-sm font-medium text-primary mb-2">
              Department
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4">
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
              Current Semester
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent mb-4">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              />
            </div>

            <button
              onClick={() => {
                alert('Login successful! Demo account created.');
                window.location.href = '/';
              }}
              className="btn-primary w-full"
            >
              Complete Login
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
