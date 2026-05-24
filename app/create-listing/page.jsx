'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { CATEGORIES, DEPARTMENTS } from '@/app/data';

export default function CreateListing() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    department: '',
    semester: '',
    subject: '',
    condition: '',
    price: '',
    isFree: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="bg-white rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
          Create New Listing
        </h1>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Listing submitted! (Demo)'); }}>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Item Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Data Structures by Cormen - Like New"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              required
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Semester *
            </label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              required
            >
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={`S${s}`}>S{s}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Subject (Optional)
            </label>
            <input
              type="text"
              name="subject"
              placeholder="e.g., Data Structures, Physics, etc."
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Item Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              required
            >
              <option value="">Select Condition</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Used">Used</option>
              <option value="Heavily Used">Heavily Used</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-center gap-4 mb-2">
              <label className="block text-sm font-medium text-primary">
                Price (Rs.) *
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleChange}
                />
                <span className="text-gray-600">Free / Donation</span>
              </label>
            </div>
            {!formData.isFree && (
              <input
                type="number"
                name="price"
                placeholder="500"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                required={!formData.isFree}
              />
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Images (Maximum 2) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              rows="4"
              placeholder="Add any additional details about the item..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full py-3 font-medium"
          >
            Publish Listing
          </button>

          <p className="text-xs text-gray-600 text-center">
            Your WhatsApp number will be shown to interested buyers
          </p>
        </form>
      </div>
    </div>
  );
      }
