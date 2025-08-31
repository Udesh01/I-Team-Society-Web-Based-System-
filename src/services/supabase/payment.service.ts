import { supabase } from "@/integrations/supabase/client";

export const PaymentService = {
  getUserPayments: async (userId: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        memberships(
          tier,
          status
        ),
        verified_by_profile:profiles!payments_verified_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getAllPayments: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        profiles!payments_user_id_fkey(
          first_name,
          last_name,
          role
        ),
        memberships(
          tier,
          status
        ),
        verified_by_profile:profiles!payments_verified_by_fkey(
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  verifyPayment: async (paymentId: string, verifierId: string) => {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'verified',
        verified_by: verifierId,
        verified_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};