import { supabase } from './supabaseClient';

const SESSION_TIMEOUT_DAYS = 7;

export const initializeSessionTimeout = () => {
  // Check if session is expired
  checkSessionExpiry();

  // Set activity listeners
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

  events.forEach((event) => {
    document.addEventListener(event, updateLastActivity, true);
  });

  // Check every hour
  setInterval(checkSessionExpiry, 60 * 60 * 1000);
};

const updateLastActivity = () => {
  try {
    localStorage.setItem('lastActivity', Date.now().toString());
  } catch (err) {
    console.error('Failed to update activity:', err);
  }
};

export const checkSessionExpiry = async () => {
  try {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return;

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    const sevenDaysInMs = SESSION_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;

    if (timeSinceLastActivity > sevenDaysInMs) {
      // Session expired - logout
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      window.location.href = '/login?session=expired';
    }
  } catch (err) {
    console.error('Session check error:', err);
  }
};

export const logoutUser = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
  } catch (err) {
    console.error('Logout error:', err);
  }
};
