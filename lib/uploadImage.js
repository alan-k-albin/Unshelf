import { supabase } from './supabaseClient'

export async function uploadListingImage(file, listingId) {
  if (!file) return null // Image is optional

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${listingId}-${Date.now()}.${fileExt}`

    const { error: uploadError, data } = await supabase.storage
      .from('listings')
      .upload(`public/${fileName}`, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('listings')
      .getPublicUrl(`public/${fileName}`)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
      }
