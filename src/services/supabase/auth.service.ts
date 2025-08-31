import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'staff' | 'student';

export const AuthService = {
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  getUserRole: async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.role || null;
  },

  isAdmin: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('is_admin', { user_id: userId });
    
    if (error) throw error;
    return !!data;
  },

  isStaff: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('is_staff', { user_id: userId });
    
    if (error) throw error;
    return !!data;
  },

  hasPermission: async (userId: string, permission: string): Promise<boolean> => {
    const role = await AuthService.getUserRole(userId);
    
    // Define role-based permissions
    const permissions = {
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

    return role ? permissions[role].includes(permission) : false;
  },

  checkPermission: (permission: string) => {
    return async (userId: string) => {
      const hasPermission = await AuthService.hasPermission(userId, permission);
      if (!hasPermission) {
        throw new Error('Unauthorized: Insufficient permissions');
      }
      return true;
    };
  }
};