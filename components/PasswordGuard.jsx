'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PasswordGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Exempt routes
    if (pathname === '/login' || pathname?.startsWith('/api/logout')) {
      setInitialCheckDone(true);
      return;
    }

    let isMounted = true;

    const evaluateUserSession = (session) => {
      if (!isMounted) return;
      if (pathname === '/login' || pathname?.startsWith('/api/logout')) {
        return;
      }

      if (session?.user) {
        const hasPassword = session.user.user_metadata?.has_password === true;
        if (!hasPassword) {
          router.replace('/login?view=set-password');
        }
      }
    };

    // Initial session load: do not redirect until getSession resolves
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setInitialCheckDone(true);
      evaluateUserSession(session);
    }).catch((err) => {
      console.error('PasswordGuard session error:', err);
      if (isMounted) setInitialCheckDone(true);
    });

    // Listen for auth state changes (SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      evaluateUserSession(session);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}

