'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Upload, ArrowLeft, Loader, AlertCircle, CheckCircle, X } from 'lucide-react';
import { validateImage, compressImage } from '@/lib/imageValidation';
import { CATEGORIES } from '@/app/data';

const DEPARTMENTS = ['CS', 'CS AI', 'CS CY', 'ECS', 'ECE', 'EEE', 'ME', 'Civil', 'MCA', 'MBA', 'AD', 'IT'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function EditListing() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id;

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState('');
  const [authUserId, setAuthUserId] = useState(null);
  const [pageError, setPageError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    targetDepartment: '',
    targetSemester: '',
    subject: '',
    price: '',
    isFree: false,
    condition: 'Good',
  });

  useEffect(() => { initPage(); }, [listingId]);

  const initPage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/login'); return; }
      setAuthUserId(session.user.id);

      const { data: listing, error: listingError } = await supabase
        .from('listings').select('*').eq('id', listingId).single();

      if (listingError || !listing) { setPageError('Listing not found.'); setPageLoading(false); return; }
      if (listing.user_id !== session.user.id) { setPageError('You are not allowed to edit this listing.'); setPageLoading(false); return; }

      setFormData({
        title: listing.title || '',
        category: listing.category || '',
        targetDepartment: listing.department || '',
        targetSemester: listing.semester || '',
        subject: listing.subject || '',
        price: listing.is_free ? '' : String(listing.price || ''),
        isFree: listing.is_free || false,
        condition: listing.condition || 'Good',
      });

      if (listing.image_url) {
        setExistingImageUrl(listing.image_url);
        setImagePreview(listing.image_url);
      }
    } catch (err) {
      setPageError('Failed to load listing.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setCompressionProgress('');

    const validation = validateImage(file);
    if (!validation.valid) { setError(validation.error); return; }

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
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setCompressionProgress('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.title.trim()) { setError('Title is required'); setLoading(false); return; }
      if (!formData.category) { setError('Please select a category'); setLoading(false); return; }
      if (!formData.isFree && !formData.price) { setError('Enter price or mark as free'); setLoading(false); return; }
      if (!imagePreview) { setError('Please upload at least one image'); setLoading(false); return; }

      let imageUrl = existingImageUrl;

      if (image) {
        if (existingImageUrl) {
          const oldPath = existingImageUrl.split('/listings/')[1];
          if (oldPath) await supabase.storage.from('listings').remove([oldPath]);
        }
        const fileName = `${authUserId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('listings').upload(fileName, image);
        if (uploadError) { setError(`Image upload failed: ${uploadError.message}`); setLoading(false); return; }
        const { data: publicUrlData } = supabase.storage.from('listings').getPublicUrl(fileName);
        imageUrl = publicUrlData?.publicUrl || null;
      }

      const { error: updateError } = await supabase.from('listings').update({
        title: formData.title.trim(),
        category: formData.category,
        department: formData.targetDepartment || '',
        semester: formData.targetSemester || '',
        subject: formData.subject || null,
        price: formData.isFree ? 0 : parseInt(formData.price),
        is_free: formData.isFree,
        condition: formData.condition,
        image_url: imageUrl,
      }).eq('id', listingId);

      if (updateError) throw updateError;

      setSuccess('✓ Listing updated successfully!');
      setTimeout(() => router.push(`/listing/${listingId}`), 1500);
    } catch (err) {
      setError(err.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin" style={{ color: '#1877F2' }} />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>Edit Listing</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-lg font-semibold mb-2" style={{ color: '#1B2A4A' }}>{pageError}</p>
          <button onClick={() => router.back()}
            className="mt-4 px-6 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>Edit Listing</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {error && (
          <div className="mb-4 p-4 rounded-lg flex gap-3 border" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-lg flex gap-3 border" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#16A34A' }} />
            <p className="text-sm" style={{ color: '#16A34A' }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Item Title *</label>
            <input type="text" name="title" placeholder="e.g., Physics Textbook 2nd Semester"
              value={formData.title} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Category *</label>
            <select name="category" value={formData.category} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Subject/Topic <span className="font-normal text-gray-400">(Optional)</span>
            </label>
            <input type="text" name="subject" placeholder="e.g., Quantum Mechanics"
              value={formData.subject} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Target Department & Semester */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-4">
            <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
              For which students? <span className="font-normal text-gray-400">(Optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-600">Department</label>
                <select name="targetDepartment" value={formData.targetDepartment} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Any</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-600">Semester</label>
                <select name="targetSemester" value={formData.targetSemester} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Any</option>
                  {SEMESTERS.map((s) => <option key={s} value={`S${s}`}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Condition *</label>
            <select name="condition" value={formData.condition} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Like New">✨ Like New</option>
              <option value="Good">👍 Good</option>
              <option value="Used">📖 Used</option>
              <option value="Heavily Used">⚙️ Heavily Used</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>Price (₹) *</label>
            <div className="flex gap-3">
              <input type="number" name="price" placeholder="Enter price"
                value={formData.price} onChange={handleInputChange}
                disabled={formData.isFree} min="0"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
              <label className="flex items-center gap-2 px-4 cursor-pointer">
                <input type="checkbox" name="isFree" checked={formData.isFree}
                  onChange={handleInputChange} className="w-4 h-4" />
                <span className="text-sm font-medium">Free</span>
              </label>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Item Image *{' '}
              <span className="font-normal text-gray-400 text-xs">(Keep existing or upload a new one)</span>
            </label>

            {imagePreview ? (
              <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="Preview" className="w-full h-52 object-cover" />
                <button type="button" onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition">
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {image ? '✓ New image selected' : '📷 Current image'}
                </div>
                {compressionProgress && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5">
                    <p className="text-xs text-green-300">{compressionProgress}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: '#CBD5E1' }}>
                <input type="file" accept="image/*" onChange={handleImageSelect}
                  disabled={isCompressing} className="hidden" id="image-input" />
                <label htmlFor="image-input" className="cursor-pointer flex flex-col items-center gap-2">
                  {isCompressing ? (
                    <><Loader className="w-8 h-8 text-blue-400 animate-spin" />
                    <span className="text-sm text-blue-600 font-medium">Compressing...</span></>
                  ) : (
                    <><Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Tap to upload a photo</span>
                    <span className="text-xs text-gray-400">JPG, PNG, WebP • Max 5MB</span></>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || isCompressing}
            className="w-full py-3 rounded-lg font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}>
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Saving Changes...</> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
         }
