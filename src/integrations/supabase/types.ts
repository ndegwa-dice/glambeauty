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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          client_name: string
          client_phone: string
          client_user_id: string | null
          created_at: string
          deposit_amount: number
          end_time: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          salon_id: string
          service_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          stylist_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_date: string
          client_name: string
          client_phone: string
          client_user_id?: string | null
          created_at?: string
          deposit_amount?: number
          end_time: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salon_id: string
          service_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          stylist_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          booking_date?: string
          client_name?: string
          client_phone?: string
          client_user_id?: string | null
          created_at?: string
          deposit_amount?: number
          end_time?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salon_id?: string
          service_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stylist_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_text: string
          recipient_user_id: string
          sender_user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text: string
          recipient_user_id: string
          sender_user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text?: string
          recipient_user_id?: string
          sender_user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          checkout_request_id: string | null
          created_at: string
          id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          mpesa_transaction_date: string | null
          phone_number: string
          result_code: string | null
          result_desc: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          mpesa_transaction_date?: string | null
          phone_number: string
          result_code?: string | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          mpesa_transaction_date?: string | null
          phone_number?: string
          result_code?: string | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_likes: {
        Row: {
          created_at: string
          id: string
          portfolio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_likes_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "stylist_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      salons: {
        Row: {
          ad_tier: string | null
          address: string | null
          category: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          featured_image_url: string | null
          featured_until: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          phone_number: string | null
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          ad_tier?: string | null
          address?: string | null
          category?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured_image_url?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone_number?: string | null
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          ad_tier?: string | null
          address?: string | null
          category?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured_image_url?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone_number?: string | null
          primary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          deposit_amount: number
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          salon_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          salon_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          salon_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_follows: {
        Row: {
          created_at: string
          follower_user_id: string
          id: string
          stylist_id: string
        }
        Insert: {
          created_at?: string
          follower_user_id: string
          id?: string
          stylist_id: string
        }
        Update: {
          created_at?: string
          follower_user_id?: string
          id?: string
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_follows_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_portfolios: {
        Row: {
          before_image_url: string | null
          caption: string | null
          category: string | null
          created_at: string
          id: string
          image_url: string
          is_before_after: boolean | null
          likes_count: number | null
          stylist_id: string
          updated_at: string
        }
        Insert: {
          before_image_url?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_before_after?: boolean | null
          likes_count?: number | null
          stylist_id: string
          updated_at?: string
        }
        Update: {
          before_image_url?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_before_after?: boolean | null
          likes_count?: number | null
          stylist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_portfolios_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_reviews: {
        Row: {
          booking_id: string | null
          client_user_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          stylist_id: string
        }
        Insert: {
          booking_id?: string | null
          client_user_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          stylist_id: string
        }
        Update: {
          booking_id?: string | null
          client_user_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_reviews_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_services: {
        Row: {
          created_at: string
          id: string
          service_id: string
          stylist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          stylist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_services_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylists: {
        Row: {
          availability_status:
            | Database["public"]["Enums"]["availability_status"]
            | null
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          email: string | null
          followers_count: number | null
          id: string
          instagram_handle: string | null
          invitation_status: string | null
          invited_at: string | null
          is_active: boolean | null
          name: string
          phone_number: string | null
          rating_avg: number | null
          rating_count: number | null
          salon_id: string
          specialty: string | null
          total_clients_served: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          id?: string
          instagram_handle?: string | null
          invitation_status?: string | null
          invited_at?: string | null
          is_active?: boolean | null
          name: string
          phone_number?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          salon_id: string
          specialty?: string | null
          total_clients_served?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          id?: string
          instagram_handle?: string | null
          invitation_status?: string | null
          invited_at?: string | null
          is_active?: boolean | null
          name?: string
          phone_number?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          salon_id?: string
          specialty?: string | null
          total_clients_served?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylists_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calendar_sync: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          emoji: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_salon: {
        Args: { _salon_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "salon_owner" | "stylist" | "client"
      availability_status: "available" | "busy" | "away"
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
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
    Enums: {
      app_role: ["salon_owner", "stylist", "client"],
      availability_status: ["available", "busy", "away"],
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
    },
  },
} as const
