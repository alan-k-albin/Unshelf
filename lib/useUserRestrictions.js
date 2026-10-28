'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useUserRestrictions() {
  const [restrictions, setRestrictions] = useState({
    loading: true,
    is_banned: false,
    can_sell: true,
    can_request_material: true,
    can_offer_service: true,
    can_request_service: true,
    can_chat: true,
    is_admin: false,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          if (mounted) {
            setRestrictions((prev) => ({ ...prev, loading: false }));
          }
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('is_banned, can_sell, can_request_material, can_offer_service, can_request_service, can_chat, is_admin')
          .eq('id', authData.user.id)
          .single();

        if (mounted && data) {
          setRestrictions({
            loading: false,
            is_banned: data.is_banned ?? false,
            can_sell: data.can_sell ?? true,
            can_request_material: data.can_request_material ?? true,
            can_offer_service: data.can_offer_service ?? true,
            can_request_service: data.can_request_service ?? true,
            can_chat: data.can_chat ?? true,
            is_admin: data.is_admin ?? false,
          });
        } else if (mounted) {
          setRestrictions((prev) => ({ ...prev, loading: false }));
        }
      } catch (e) {
        console.error('Error fetching user restrictions:', e);
        if (mounted) {
          setRestrictions((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return restrictions;
}
