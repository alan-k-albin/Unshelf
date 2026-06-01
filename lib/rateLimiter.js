import { supabase } from './supabaseClient';

// Rate limit configurations
const RATE_LIMITS = {
  CREATE_LISTING: { maxAttempts: 100, windowHours: 24 },
  CREATE_REVIEW: { maxAttempts: 1, windowHours: 8760 }, // 1 year (lifetime per seller)
  CREATE_REPORT: { maxAttempts: 3, windowHours: 24 },
};

export const checkRateLimit = async (userId, action) => {
  if (!userId) {
    return { allowed: false, message: 'User not authenticated' };
  }

  const config = RATE_LIMITS[action];
  if (!config) {
    return { allowed: true }; // No limit for unknown actions
  }

  try {
    // Get timestamp for rate limit window
    const hoursAgo = new Date(Date.now() - config.windowHours * 60 * 60 * 1000);

    // Count attempts in time window
    const { data: attempts, error: queryError } = await supabase
      .from('rate_limits')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('action', action)
      .gt('timestamp', hoursAgo.toISOString());

    if (queryError) {
      console.error('Rate limit check error:', queryError);
      return { allowed: true }; // Allow on error (fail open)
    }

    const attemptCount = attempts?.length || 0;

    // Check if limit exceeded
    if (attemptCount >= config.maxAttempts) {
      return {
        allowed: false,
        message: `Rate limit exceeded. Max ${config.maxAttempts} ${action} per ${config.windowHours} hours.`,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - attemptCount - 1,
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    return { allowed: true }; // Allow on error
  }
};

export const recordAction = async (userId, action, metadata = null) => {
  if (!userId) return;

  try {
    await supabase.from('rate_limits').insert([
      {
        user_id: userId,
        action,
        metadata,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error('Failed to record action:', err);
  }
};
