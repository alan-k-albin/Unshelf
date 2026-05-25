import { supabase } from './supabaseClient'

export async function addContact(userId, contactUserId, contactName, contactWhatsapp, contactType = 'seller') {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .upsert([
        {
          user_id: userId,
          contact_user_id: contactUserId,
          contact_name: contactName,
          contact_whatsapp: contactWhatsapp,
          contact_type: contactType,
        }
      ], { onConflict: 'user_id,contact_user_id' })
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding contact:', error)
    return null
  }
}
