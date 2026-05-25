import { supabase } from './supabaseClient'

// Get current logged-in user
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Try to get from localStorage
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Get user profile from database
export async function getUserProfile(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Logout user
export async function logoutUser() {
  try {
    await supabase.auth.signOut()
    localStorage.removeItem('user')
    return true
  } catch (error) {
    console.error('Error logging out:', error)
    return false
  }
}

// Check if user is verified
export function isUserVerified() {
  const user = localStorage.getItem('user')
  return user ? true : false
           }
