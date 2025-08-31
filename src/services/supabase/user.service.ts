import { supabase } from "@/integrations/supabase/client";

export const UserService = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

    if (error) throw error;
    return data;
  },

  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .maybeSingle(); // Use maybeSingle() for consistency

    if (error) throw error;
    return data;
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};
