export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      channel_tasks: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          is_active: boolean
          reward: number
          updated_at: string
        }
        Insert: {
          channel_id: string
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reward?: number
          updated_at?: string
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reward?: number
          updated_at?: string
        }
        Relationships: []
      }
      channel_tasks_completed: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          user_telegram_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          user_telegram_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          user_telegram_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          amount_uzs: number
          card_last4: string
          card_number: string
          created_at: string
          expected_date: string | null
          first_name: string
          id: string
          paid_date: string | null
          payment_level_id: number
          payment_level_name: string
          phone: string
          photo_url: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_telegram_id: string
          username: string
        }
        Insert: {
          amount: number
          amount_uzs?: number
          card_last4?: string
          card_number?: string
          created_at?: string
          expected_date?: string | null
          first_name?: string
          id?: string
          paid_date?: string | null
          payment_level_id?: number
          payment_level_name?: string
          phone?: string
          photo_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_telegram_id: string
          username?: string
        }
        Update: {
          amount?: number
          amount_uzs?: number
          card_last4?: string
          card_number?: string
          created_at?: string
          expected_date?: string | null
          first_name?: string
          id?: string
          paid_date?: string | null
          payment_level_id?: number
          payment_level_name?: string
          phone?: string
          photo_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_telegram_id?: string
          username?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_telegram_id: string
          referrer_telegram_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_telegram_id: string
          referrer_telegram_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_telegram_id?: string
          referrer_telegram_id?: string
        }
        Relationships: []
      }
      telegram_user_states: {
        Row: {
          channel_verified_at: string | null
          completed_at: string | null
          created_at: string
          first_name: string
          id: string
          phone: string | null
          referral_code: string | null
          step: string
          telegram_id: string
          terms_accepted_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          channel_verified_at?: string | null
          completed_at?: string | null
          created_at?: string
          first_name?: string
          id?: string
          phone?: string | null
          referral_code?: string | null
          step?: string
          telegram_id: string
          terms_accepted_at?: string | null
          updated_at?: string
          username?: string
        }
        Update: {
          channel_verified_at?: string | null
          completed_at?: string | null
          created_at?: string
          first_name?: string
          id?: string
          phone?: string | null
          referral_code?: string | null
          step?: string
          telegram_id?: string
          terms_accepted_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      trees: {
        Row: {
          created_at: string
          harvested: boolean
          id: string
          last_watered_at: string | null
          planted_at: string
          tree_type: string
          user_telegram_id: string
          waterings_completed: number
        }
        Insert: {
          created_at?: string
          harvested?: boolean
          id?: string
          last_watered_at?: string | null
          planted_at?: string
          tree_type?: string
          user_telegram_id: string
          waterings_completed?: number
        }
        Update: {
          created_at?: string
          harvested?: boolean
          id?: string
          last_watered_at?: string | null
          planted_at?: string
          tree_type?: string
          user_telegram_id?: string
          waterings_completed?: number
        }
        Relationships: [
          {
            foreignKeyName: "trees_user_telegram_id_fkey"
            columns: ["user_telegram_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      users: {
        Row: {
          ad_task_ads_watched: number
          ad_task_last_reset_date: string
          ad_task_total_ads_watched: number
          coins: number
          created_at: string
          first_name: string
          fruits_apple: number
          fruits_fig: number
          fruits_grape: number
          fruits_pear: number
          has_claimed_free_sapling: boolean
          id: string
          phone: string | null
          photo_url: string | null
          referral_code: string
          referral_earnings: number
          referred_by: string | null
          telegram_id: string
          total_ads_watched: number
          total_fruits_harvested: number
          total_trees_grown: number
          updated_at: string
          username: string
        }
        Insert: {
          ad_task_ads_watched?: number
          ad_task_last_reset_date?: string
          ad_task_total_ads_watched?: number
          coins?: number
          created_at?: string
          first_name?: string
          fruits_apple?: number
          fruits_fig?: number
          fruits_grape?: number
          fruits_pear?: number
          has_claimed_free_sapling?: boolean
          id?: string
          phone?: string | null
          photo_url?: string | null
          referral_code?: string
          referral_earnings?: number
          referred_by?: string | null
          telegram_id: string
          total_ads_watched?: number
          total_fruits_harvested?: number
          total_trees_grown?: number
          updated_at?: string
          username?: string
        }
        Update: {
          ad_task_ads_watched?: number
          ad_task_last_reset_date?: string
          ad_task_total_ads_watched?: number
          coins?: number
          created_at?: string
          first_name?: string
          fruits_apple?: number
          fruits_fig?: number
          fruits_grape?: number
          fruits_pear?: number
          has_claimed_free_sapling?: boolean
          id?: string
          phone?: string | null
          photo_url?: string | null
          referral_code?: string
          referral_earnings?: number
          referred_by?: string | null
          telegram_id?: string
          total_ads_watched?: number
          total_fruits_harvested?: number
          total_trees_grown?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_stats: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
