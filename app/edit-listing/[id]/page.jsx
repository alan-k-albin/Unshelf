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
  const [images, setImages] = useState([]); // Array of { url?: string, file?: File, preview: string }
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

      const existingUrls = (listing.image_urls && listing.image_urls.length > 0)
        ? listing.image_urls
        : (listing.image_url ? [listing.image_url] : []);

      setImages(existingUrls.map((url) => ({ url, preview: url })));
    } catch (err) {
      setPageError('Failed to load listing.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setCompressionProgress('');

    if (images.length + files.length > 5) {
      setError('You can have a maximum of 5 photos per listing');
      return;
    }

    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) { setError(validation.error); return; }
    }

    try {
      setIsCompressing(true);
      setCompressionProgress(`Compressing ${files.length} image(s)...`);

      const newImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await compressImage(file);
        const preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result);
          reader.readAsDataURL(compressedFile);
        });
        newImages.push({ file: compressedFile, preview });
      }

      setImages((prev) => [...prev, ...newImages]);
      setCompressionProgress('✓ Images ready');
      setTimeout(() => setCompressionProgress(''), 3000);
    } catch (err) {
      setError('Failed to compress image. Please try another file.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
      if (images.length === 0) { setError('Please upload at least one image'); setLoading(false); return; }

      const finalUrls = [];
      const timestamp = Date.now();

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (item.url) {
          // Keep existing image URL
          finalUrls.push(item.url);
        } else if (item.file) {
          // Upload new image
          const fileName = `${authUserId}/${timestamp}-${i}.jpg`;
          const { error: uploadError } = await supabase.storage.from('listings').upload(fileName, item.file);
          if (uploadError) { setError(`Image upload failed: ${uploadError.message}`); setLoading(false); return; }
          const { data: publicUrlData } = supabase.storage.from('listings').getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            finalUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      if (finalUrls.length === 0) {
        setError('At least one valid image is required');
        setLoading(false);
        return;
      }

      const primaryImageUrl = finalUrls[0];

      const { error: updateError } = await supabase.from('listings').update({
        title: formData.title.trim(),
        category: formData.category,
        department: formData.targetDepartment || '',
        semester: formData.targetSemester || '',
        subject: formData.subject || null,
        price: formData.isFree ? 0 : parseInt(formData.price),
        is_free: formData.isFree,
        condition: formData.condition,
        image_url: primaryImageUrl,
        image_urls: finalUrls,
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
      <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center font-body">
        <Loader className="w-6 h-6 animate-spin text-[#1B2A4A]" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] font-body">
        <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10 flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-display font-bold text-[#1B2A4A]">Edit Listing</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EDE6D6]/60 flex items-center justify-center text-3xl mb-4 text-[#8A8272]">⚠️</div>
          <p className="text-lg font-display font-semibold mb-2 text-[#1B2A4A]">{pageError}</p>
          <button onClick={() => router.back()}
            className="mt-4 px-6 py-3 rounded-xl font-semibold text-white text-base btn-action-green transition active:scale-[0.98]">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F1] font-body">
      <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3.5">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-[#1B2A4A]">Edit Listing</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {error && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-5 p-4 rounded-xl flex gap-3 border bg-[#F0FDF4] border-[#BBF7D0]">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#27AE60]" />
            <p className="text-sm font-medium text-[#27AE60]">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-[#EDE6D6] shadow-xs space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Item Title *</label>
            <input type="text" name="title" placeholder="e.g., Physics Textbook 2nd Semester"
              value={formData.title} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Category *</label>
            <select name="category" value={formData.category} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition">
              <option value="">Select Category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
              Subject/Topic <span className="font-normal text-[#8A8272]">(Optional)</span>
            </label>
            <input type="text" name="subject" placeholder="e.g., Quantum Mechanics"
              value={formData.subject} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition" />
          </div>

          {/* Target Department & Semester */}
          <div className="p-4 rounded-xl border border-[#EDE6D6] bg-[#FAF6EE] space-y-3">
            <p className="text-sm font-semibold text-[#1B2A4A]">
              For which students? <span className="font-normal text-[#8A8272]">(Optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#5B5647]">Department</label>
                <select name="targetDepartment" value={formData.targetDepartment} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]">
                  <option value="">Any</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#5B5647]">Semester</label>
                <select name="targetSemester" value={formData.targetSemester} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]">
                  <option value="">Any</option>
                  {SEMESTERS.map((s) => <option key={s} value={`S${s}`}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Condition *</label>
            <select name="condition" value={formData.condition} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition">
              <option value="Like New">✨ Like New</option>
              <option value="Good">👍 Good</option>
              <option value="Used">📖 Used</option>
              <option value="Heavily Used">⚙️ Heavily Used</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Price (₹) *</label>
            <div className="flex gap-3 items-center">
              <input type="number" name="price" placeholder="Enter price"
                value={formData.price} onChange={handleInputChange}
                disabled={formData.isFree} min="0"
                className="flex-1 px-4 py-3 border border-[#EDE6D6] rounded-xl text-sm bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] disabled:bg-gray-100 disabled:text-gray-400" />
              <label className="flex items-center gap-2 px-3 py-3 rounded-xl border border-[#EDE6D6] bg-[#FAF6EE] cursor-pointer">
                <input type="checkbox" name="isFree" checked={formData.isFree}
                  onChange={handleInputChange} className="w-4 h-4 accent-[#1B2A4A]" />
                <span className="text-sm font-semibold text-[#1B2A4A]">Free</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[#1B2A4A]">
                Item Photos *{' '}
                <span className="font-normal text-[#8A8272] text-xs">
                  (1–5 photos. First photo is cover)
                </span>
              </label>
              {images.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5D9] text-[#1B2A4A]">
                  {images.length} / 5 photos
                </span>
              )}
            </div>

            {images.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {images.map((imgItem, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-[#EDE6D6] aspect-square group bg-[#FAF6EE]"
                    >
                      <img
                        src={imgItem.preview}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-[#1B2A4A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                          Cover
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <div className="aspect-square border-2 border-dashed border-[#EDE6D6] rounded-xl hover:border-[#1B2A4A] hover:bg-[#FAF6EE] transition flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        disabled={isCompressing}
                        className="hidden"
                        id="edit-add-more-images"
                      />
                      <label
                        htmlFor="edit-add-more-images"
                        className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-2 text-center"
                      >
                        {isCompressing ? (
                          <Loader className="w-6 h-6 text-[#1B2A4A] animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-[#8A8272] mb-1" />
                            <span className="text-xs font-medium text-[#5B5647]">+ Add photo</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {compressionProgress && (
                  <p className="text-xs text-[#27AE60] font-medium">{compressionProgress}</p>
                )}
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition border-[#EDE6D6] hover:border-[#1B2A4A] bg-[#FAF6EE]/50 hover:bg-[#FAF6EE]"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  disabled={isCompressing}
                  className="hidden"
                  id="edit-image-input"
                />
                <label
                  htmlFor="edit-image-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {isCompressing ? (
                    <>
                      <Loader className="w-8 h-8 text-[#1B2A4A] animate-spin" />
                      <span className="text-sm text-[#1B2A4A] font-medium">Compressing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#8A8272]" />
                      <span className="text-sm font-semibold text-[#1B2A4A]">
                        Tap to upload photos (1–5 photos)
                      </span>
                      <span className="text-xs text-[#8A8272]">JPG, PNG, WebP • Max 5MB each</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || isCompressing}
            className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98] shadow-xs">
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Saving Changes...</> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
