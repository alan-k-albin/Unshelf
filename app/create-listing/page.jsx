'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { uploadListingImage } from '@/lib/uploadImage';
import { CATEGORIES } from '@/app/data';

const DEPARTMENTS = ['CS', 'CS AI', 'CS CY', 'ECS', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD'];
const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const CONDITIONS = ['Like New', 'Good', 'Used', 'Heavily Used'];

export default function CreateListing() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    department: '',
    semester: '',
    subject: '',
    condition: '',
    isFree: false,
    price: '',
    description: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setIsLoggedIn(true);
    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.title || !formData.category || !formData.department || !formData.semester) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!formData.isFree && !formData.price) {
        setError('Please enter a price or mark as free');
        setLoading(false);
        return;
      }

      // Upload image if provided (optional)
      let imageUrl = null;
      if (imageFile) {
        const tempId = Date.now();
        imageUrl = await uploadListingImage(imageFile, tempId);
      }

      // Create listing in database
      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert([
          {
            title: formData.title,
            category: formData.category,
            department: formData.department,
            semester: formData.semester,
            subject: formData.subject || '',
            condition: formData.condition || 'Good',
            price: formData.isFree ? null : parseInt(formData.price),
            is_free: formData.isFree,
            status: 'Active',
            image_url: imageUrl,
            featured: false,
            user_id: user?.id || null,
          },
        ])
        .select();

      if (insertError) throw insertError;

      // Success!
      router.push(`/listing/${listing[0]?.id || ''}`);
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Failed to create listing. Please try again.');
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center pb-20 md:pb-8">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-8">
      <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="bg-white rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">List Your Item</h1>
        <p className="text-gray-600 mb-6">Fill in the details below to create your listing</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Item Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Data Structures Textbook"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Department & Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                required
              >
                <option value="">Select</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Semester *
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                required
              >
                <option value="">Select</option>
                {SEMESTERS.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Subject/Course (Optional)
            </label>
            <input
              type="text"
              name="subject"
              placeholder="e.g., CSE101 - Data Structures"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Condition
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
            >
              <option value="">Select Condition</option>
              {CONDITIONS.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Price (Optional)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="price"
                placeholder="Enter price in ₹"
                value={formData.price}
                onChange={handleInputChange}
                disabled={formData.isFree}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent disabled:bg-gray-100"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Free/Donation</span>
              </label>
            </div>
          </div>

          {/* Image Upload (Optional) */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG up to 5MB
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              placeholder="Add more details about your item..."
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
