import { supabase } from "@/integrations/supabase/client";

export const EIDService = {
  generateEID: async (userId: string, userRole: string) => {
    try {
      // Get user profile to determine role and count
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get count of existing members for this role to generate sequence number
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', profile.role);

      if (countError) throw countError;

      // Generate E-ID based on role
      const year = new Date().getFullYear();
      const rolePrefix = profile.role === 'student' ? 'STU' : 'STF';
      const sequence = String((count || 0) + 1).padStart(4, '0');
      
      const eid = `ITS/${year}/${rolePrefix}/${sequence}`;

      return eid;
    } catch (error) {
      console.error('Error generating E-ID:', error);
      throw error;
    }
  },

  updateMembershipEID: async (membershipId: string, eid: string) => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .update({ eid })
        .eq('id', membershipId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating membership E-ID:', error);
      throw error;
    }
  },

  getMembershipByEID: async (eid: string) => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          profiles!memberships_user_id_fkey(
            first_name,
            last_name,
            role,
            photo_url,
            student_details(*),
            staff_details(*)
          )
        `)
        .eq('eid', eid)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching membership by E-ID:', error);
      throw error;
    }
  },

  generateQRCodeData: (eid: string) => {
    // Generate QR code data that links to member profile
    const baseUrl = window.location.origin;
    return `${baseUrl}/member/${eid}`;
  }
};
