'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Upload, ArrowLeft, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { validateImage, compressImage } from '@/lib/imageValidation';
import { checkRateLimit, recordAction } from '@/lib/rateLimiter';
import { CATEGORIES } from '@/app/data';

export default function CreateListing() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState('');

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

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setCompressionProgress('');

    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      setIsCompressing(true);
      setCompressionProgress('Compressing image...');

      const compressedFile = await compressImage(file);
      setImage(compressedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result);
        setCompressionProgress(
          `✓ Compressed: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`
        );
        setTimeout(() => setCompressionProgress(''), 3000);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setError('Failed to compress image. Please try another file.');
      console.error(err);
    } finally {
      setIsCompressing(false);
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
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }
      if (!formData.category) {
        setError('Please select a category');
        setLoading(false);
        return;
      }
      if (!formData.condition) {
        setError('Please select condition');
        setLoading(false);
        return;
      }
      if (!formData.isFree && !formData.price) {
        setError('Enter price or mark as free');
        setLoading(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id || null;

      if (!authUserId) {
        setError('You must be logged in to create a listing');
        setLoading(false);
        return;
      }

      // ⭐ CHECK RATE LIMIT
      const rateLimit = await checkRateLimit(authUserId, 'CREATE_LISTING');
      if (!rateLimit.allowed) {
        setError(rateLimit.message);
        setLoading(false);
        return;
      }

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      let imageUrl = null;
      if (image) {
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(7)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, image);

        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`);
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('listings')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData?.publicUrl || null;
      }

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

      if (insertError) {
        setError(`Failed to create listing: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // ⭐ RECORD ACTION
      await recordAction(authUserId, 'CREATE_LISTING', { title: formData.title });

      setSuccess('✓ Listing created successfully!');
      setTimeout(() => router.push('/'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
            Create Listing
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div
            className="mb-4 p-4 rounded-lg flex gap-3 border"
            style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <p className="text-sm" style={{ color: '#DC2626' }}>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div
            className="mb-4 p-4 rounded-lg flex gap-3 border"
            style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#16A34A' }} />
            <p className="text-sm" style={{ color: '#16A34A' }}>
              {success}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Upload Image (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={isCompressing}
                className="hidden"
                id="image-input"
              />
              <label
                htmlFor="image-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {isCompressing ? 'Compressing...' : 'Click to upload image'}
                    </span>
                    <span className="text-xs text-gray-500">JPG, PNG, WebP • Max 5MB</span>
                  </>
                )}
              </label>
            </div>

            {compressionProgress && (
              <p className="text-xs text-green-600 mt-2">{compressionProgress}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isCompressing}
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
