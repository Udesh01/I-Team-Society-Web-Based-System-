import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/services/supabase/auth.service';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const role = await AuthService.getUserRole(user.id);
        const allPermissions = {
          admin: [
            'create_users',
            'manage_events',
            'manage_payments',
            'join_events',
            'view_reports',
            'approve_memberships',
            'manage_eid',
            'send_notifications',
            'manage_settings'
          ],
          staff: [
            'manage_events_limited',
            'join_events',
            'mark_attendance',
            'view_event_registrations'
          ],
          student: [
            'join_events',
            'view_eid',
            'mark_attendance',
            'view_payment_history',
            'view_event_history'
          ]
        };

        setPermissions(role ? allPermissions[role] : []);
      } catch (err: any) {
        console.error('Error loading permissions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  return { permissions, hasPermission, loading, error };
};