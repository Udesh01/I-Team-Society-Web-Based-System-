import { supabase } from "@/integrations/supabase/client";

export const MembershipService = {
  getCurrentMembership: async (userId: string) => {
    try {
      console.log("Fetching current membership for user:", userId);

      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching current membership:", error);

        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No rows found - user has no membership
          console.log("No membership found for user");
          return null;
        } else if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error("Permission denied. Please check your login status.");
        } else if (error.message.includes('406')) {
          throw new Error("Request format error. Please refresh the page and try again.");
        }

        throw error;
      }

      console.log("Current membership found:", data);
      return data;
    } catch (error) {
      console.error("getCurrentMembership failed:", error);
      throw error;
    }
  },

  hasActiveMembership: async (userId: string) => {
    const { data, error } = await supabase
      .rpc('has_active_membership', { user_id: userId });
    
    if (error) throw error;
    return data;
  },

  getAllMemberships: async () => {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        profiles!memberships_user_id_fkey(
          first_name,
          last_name,
          role
        ),
        payments(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  updateMembershipStatus: async (membershipId: string, status: string) => {
    const { data, error } = await supabase
      .from('memberships')
      .update({ status })
      .eq('id', membershipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  createMembership: async (membershipData: {
    user_id: string;
    tier: string;
    status: string;
    start_date: string;
    end_date: string;
    amount: number;
    eid: string;
  }) => {
    try {
      console.log("Creating membership with data:", membershipData);

      const { data, error } = await supabase
        .from('memberships')
        .insert(membershipData)
        .select()
        .single();

      if (error) {
        console.error("Membership creation error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Handle specific error types
        if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error("Permission denied. Please try logging out and back in.");
        } else if (error.code === '23505') {
          throw new Error("You already have a membership application pending.");
        }

        throw error;
      }

      console.log("Membership created successfully:", data);
      return data;
    } catch (error) {
      console.error("Membership creation failed:", error);
      throw error;
    }
  },

  createPayment: async (paymentData: {
    user_id: string;
    membership_id?: string;
    amount: number;
    notes?: string;
    payment_date?: string;
    bank_slip_url?: string | null;
    status: string;
  }) => {
    try {
      console.log("Creating payment with data:", paymentData);

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        console.error("Payment creation error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Handle specific error types
        if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error("Permission denied. Please try logging out and back in.");
        }

        throw error;
      }

      console.log("Payment created successfully:", data);
      return data;
    } catch (error) {
      console.error("Payment creation failed:", error);
      throw error;
    }
  },

  // Renew membership
  renewMembership: async (userId: string, tier: string, paymentMethod: string) => {
    try {
      console.log("Renewing membership for user:", userId);

      // Get current membership
      const currentMembership = await MembershipService.getCurrentMembership(userId);

      if (!currentMembership) {
        throw new Error("No current membership found");
      }

      // Calculate new dates (extend by 1 year from current end date or today, whichever is later)
      const currentEndDate = new Date(currentMembership.end_date);
      const today = new Date();
      const startDate = currentEndDate > today ? currentEndDate : today;
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Calculate amount based on tier
      const tierPricing = {
        bronze: 2500,
        silver: 5000,
        gold: 10000
      };
      const amount = tierPricing[tier as keyof typeof tierPricing] || 2500;

      // Create renewal record
      const renewalData = {
        user_id: userId,
        tier,
        status: 'pending_payment',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount,
        eid: currentMembership.eid, // Keep the same E-ID
        payment_method: paymentMethod,
        is_renewal: true
      };

      const { data, error } = await supabase
        .from('memberships')
        .insert(renewalData)
        .select()
        .single();

      if (error) throw error;

      console.log("Membership renewal created:", data);
      return data;
    } catch (error) {
      console.error("Error renewing membership:", error);
      throw error;
    }
  },

  // Get membership renewal options
  getRenewalOptions: (currentTier: string) => {
    const tiers = [
      {
        id: 'bronze',
        name: 'Bronze',
        price: 2500,
        duration: '1 Year',
        features: [
          'Access to all events',
          'Basic networking opportunities',
          'Digital E-ID card',
          'Monthly newsletter'
        ],
        color: 'from-amber-500 to-orange-600',
        popular: false
      },
      {
        id: 'silver',
        name: 'Silver',
        price: 5000,
        duration: '1 Year',
        features: [
          'All Bronze benefits',
          'Priority event registration',
          'Exclusive workshops',
          'Career guidance sessions',
          'Industry mentorship program'
        ],
        color: 'from-gray-400 to-gray-600',
        popular: true
      },
      {
        id: 'gold',
        name: 'Gold',
        price: 10000,
        duration: '1 Year',
        features: [
          'All Silver benefits',
          'VIP event access',
          'One-on-one career counseling',
          'Industry placement assistance',
          'Leadership development program',
          'Alumni network access'
        ],
        color: 'from-yellow-400 to-yellow-600',
        popular: false
      }
    ];

    return tiers;
  },

  // Check if membership is eligible for renewal
  isEligibleForRenewal: (membership: any) => {
    if (!membership) return false;

    const endDate = new Date(membership.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Allow renewal if membership expires within 60 days or has already expired
    return daysUntilExpiry <= 60;
  },

  // Get renewal status message
  getRenewalStatusMessage: (membership: any) => {
    if (!membership) return "No active membership found";

    const endDate = new Date(membership.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return `Your membership expired ${Math.abs(daysUntilExpiry)} days ago`;
    } else if (daysUntilExpiry <= 30) {
      return `Your membership expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 60) {
      return `Your membership expires in ${daysUntilExpiry} days - renewal available`;
    } else {
      return `Your membership is active until ${endDate.toLocaleDateString()}`;
    }
  }
};