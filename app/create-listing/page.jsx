'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Upload, ArrowLeft, Loader } from 'lucide-react';
import CATEGORIES from '@/app/data';

export default function CreateListing() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    department: '',
    semester: '',
    subject: '',
    price: '',
    isFree: false,
    condition: 'Good',
  });

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) { setError('Title is required'); setLoading(false); return; }
      if (!formData.category) { setError('Please select a category'); setLoading(false); return; }
      if (!formData.condition) { setError('Please select condition'); setLoading(false); return; }
      if (!formData.isFree && !formData.price) { setError('Enter price or mark as free'); setLoading(false); return; }

      // Get real Supabase auth user ID
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id || null;

      if (!authUserId) {
        setError('You must be logged in to create a listing');
        setLoading(false);
        return;
      }

      // Get user profile from localStorage for department/semester
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      // Upload image if provided (optional)
      let imageUrl = null;
      if (image) {
        const fileName = `${Date.now()}_${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, image);

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('listings')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData?.publicUrl || null;
      }

      // Insert listing with auth user ID
      const { error: insertError } = await supabase.from('listings').insert([
        {
          user_id: authUserId,
          title: formData.title.trim(),
          category: formData.category,
          department: user?.department || '',
          semester: user?.semester || '',
          subject: formData.subject || null,
          price: formData.isFree ? 0 : parseInt(formData.price),
          is_free: formData.isFree,
          condition: formData.condition,
          status: 'Active',
          featured: false,
          image_url: imageUrl,
        },
      ]);

      if (insertError) throw insertError;

      setSuccess('Listing created successfully!');
      setTimeout(() => router.push('/'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>Create Listing</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Item Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Physics Textbook 2nd Semester"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subject (Optional) */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Subject/Topic (Optional)
            </label>
            <input
              type="text"
              name="subject"
              placeholder="e.g., Quantum Mechanics"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>✨ Like New</option>
              <option>👍 Good</option>
              <option>📖 Used</option>
              <option>⚙️ Heavily Used</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Price (₹)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={formData.price}
                onChange={handleInputChange}
                disabled={formData.isFree}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <label className="flex items-center gap-2 px-4">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Free</span>
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Upload Image (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input" className="cursor-pointer flex flex-col items-center gap-2">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload image</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating Listing...
              </>
            ) : (
              'Create Listing'
            )}
          </button>
        </form>
      </div>
    </div>
  );
      }
