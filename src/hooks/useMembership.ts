import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MembershipService } from '@/services/supabase/membership.service';

export const useMembership = () => {
  const { user } = useAuth();
  const [membership, setMembership] = useState(null);
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMembershipData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [membershipData, activeCheck] = await Promise.all([
          MembershipService.getCurrentMembership(user.id),
          MembershipService.hasActiveMembership(user.id)
        ]);

        setMembership(membershipData);
        setHasActive(activeCheck);
      } catch (err: any) {
        console.error('Error loading membership data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMembershipData();
  }, [user]);

  return { membership, hasActive, loading, error };
};