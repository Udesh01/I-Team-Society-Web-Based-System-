export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      event_registrations: {
        Row: {
          attended: boolean | null;
          attended_at: string | null;
          event_id: string;
          id: string;
          registered_at: string | null;
          user_id: string;
        };
        Insert: {
          attended?: boolean | null;
          attended_at?: string | null;
          event_id: string;
          id?: string;
          registered_at?: string | null;
          user_id: string;
        };
        Update: {
          attended?: boolean | null;
          attended_at?: string | null;
          event_id?: string;
          id?: string;
          registered_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          event_date: string;
          id: string;
          location: string | null;
          max_participants: number | null;
          name: string;
          poster_url: string | null;
          registration_deadline: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          event_date: string;
          id?: string;
          location?: string | null;
          max_participants?: number | null;
          name: string;
          poster_url?: string | null;
          registration_deadline?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          event_date?: string;
          id?: string;
          location?: string | null;
          max_participants?: number | null;
          name?: string;
          poster_url?: string | null;
          registration_deadline?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          amount: number;
          created_at: string | null;
          eid: string | null;
          end_date: string | null;
          id: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["membership_status"];
          tier: Database["public"]["Enums"]["membership_tier"];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          eid?: string | null;
          end_date?: string | null;
          id?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["membership_status"];
          tier: Database["public"]["Enums"]["membership_tier"];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          eid?: string | null;
          end_date?: string | null;
          id?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["membership_status"];
          tier?: Database["public"]["Enums"]["membership_tier"];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          title: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          title: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          bank_slip_url: string;
          created_at: string | null;
          id: string;
          membership_id: string;
          notes: string | null;
          payment_date: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          amount: number;
          bank_slip_url: string;
          created_at?: string | null;
          id?: string;
          membership_id: string;
          notes?: string | null;
          payment_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          amount?: number;
          bank_slip_url?: string;
          created_at?: string | null;
          id?: string;
          membership_id?: string;
          notes?: string | null;
          payment_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          created_at: string | null;
          first_name: string;
          id: string;
          last_name: string;
          phone_number: string | null;
          photo_url: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          first_name: string;
          id: string;
          last_name: string;
          phone_number?: string | null;
          photo_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          phone_number?: string | null;
          photo_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      staff_details: {
        Row: {
          department: string | null;
          id: string;
          position: string | null;
          regional_centre: string | null;
          staff_id: string;
        };
        Insert: {
          department?: string | null;
          id: string;
          position?: string | null;
          regional_centre?: string | null;
          staff_id: string;
        };
        Update: {
          department?: string | null;
          id?: string;
          position?: string | null;
          regional_centre?: string | null;
          staff_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_details_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      student_details: {
        Row: {
          degree: string | null;
          department: string | null;
          faculty: string | null;
          id: string;
          level: number | null;
          regional_centre: string | null;
          student_id: string;
        };
        Insert: {
          degree?: string | null;
          department?: string | null;
          faculty?: string | null;
          id: string;
          level?: number | null;
          regional_centre?: string | null;
          student_id: string;
        };
        Update: {
          degree?: string | null;
          department?: string | null;
          faculty?: string | null;
          id?: string;
          level?: number | null;
          regional_centre?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_details_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_active_membership: {
        Args: { user_id: string };
        Returns: boolean;
      };
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      is_staff: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      membership_status:
        | "pending_payment"
        | "pending_approval"
        | "active"
        | "expired"
        | "rejected";
      membership_tier: "bronze" | "silver" | "gold";
      user_role: "admin" | "staff" | "student";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      membership_status: [
        "pending_payment",
        "pending_approval",
        "active",
        "expired",
        "rejected",
      ],
      membership_tier: ["bronze", "silver", "gold"],
      user_role: ["admin", "staff", "student"],
    },
  },
} as const;
