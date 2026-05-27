'use client';

import { useEffect } from 'react';
import { initializeSessionTimeout } from '@/lib/sessionTimeout';

export default function SessionInitializer() {
  useEffect(() => {
    initializeSessionTimeout();
  }, []);

  return null;
}
