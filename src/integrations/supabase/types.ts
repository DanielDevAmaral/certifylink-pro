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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string | null
          expiry_date: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          issued_date: string
          issuer_logo_url: string | null
          issuer_name: string | null
          metadata: Json | null
          name: string
          public_link: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          issued_date: string
          issuer_logo_url?: string | null
          issuer_name?: string | null
          metadata?: Json | null
          name: string
          public_link?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          issued_date?: string
          issuer_logo_url?: string | null
          issuer_name?: string | null
          metadata?: Json | null
          name?: string
          public_link?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      certification_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      certification_platforms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      certification_types: {
        Row: {
          aliases: string[] | null
          category_id: string | null
          created_at: string
          full_name: string
          function: string | null
          id: string
          is_active: boolean
          name: string
          platform_id: string
          updated_at: string
        }
        Insert: {
          aliases?: string[] | null
          category_id?: string | null
          created_at?: string
          full_name: string
          function?: string | null
          id?: string
          is_active?: boolean
          name: string
          platform_id: string
          updated_at?: string
        }
        Update: {
          aliases?: string[] | null
          category_id?: string | null
          created_at?: string
          full_name?: string
          function?: string | null
          id?: string
          is_active?: boolean
          name?: string
          platform_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "certification_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_types_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "certification_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          ai_suggested_services: string[] | null
          approved_equivalence: boolean | null
          created_at: string
          equivalence_services: string[] | null
          function: string
          id: string
          name: string
          public_link: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          user_id: string
          validity_date: string | null
        }
        Insert: {
          ai_suggested_services?: string[] | null
          approved_equivalence?: boolean | null
          created_at?: string
          equivalence_services?: string[] | null
          function: string
          id?: string
          name: string
          public_link?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id: string
          validity_date?: string | null
        }
        Update: {
          ai_suggested_services?: string[] | null
          approved_equivalence?: boolean | null
          created_at?: string
          equivalence_services?: string[] | null
          function?: string
          id?: string
          name?: string
          public_link?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          created_at: string
          document_name: string
          document_subtype: string | null
          document_type: Database["public"]["Enums"]["legal_document_type"]
          document_url: string
          encrypted_data: string | null
          id: string
          is_sensitive: boolean | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          user_id: string
          validity_date: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_subtype?: string | null
          document_type: Database["public"]["Enums"]["legal_document_type"]
          document_url: string
          encrypted_data?: string | null
          id?: string
          is_sensitive?: boolean | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id: string
          validity_date?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_subtype?: string | null
          document_type?: Database["public"]["Enums"]["legal_document_type"]
          document_url?: string
          encrypted_data?: string | null
          id?: string
          is_sensitive?: boolean | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_retry_queue: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          max_retries: number
          next_retry_at: string
          notification_data: Json
          notification_id: string
          retry_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at: string
          notification_data: Json
          notification_id: string
          retry_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at?: string
          notification_data?: Json
          notification_id?: string
          retry_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          message: string
          notification_type: string
          read_at: string | null
          related_document_id: string | null
          related_document_type:
            | Database["public"]["Enums"]["document_category"]
            | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          notification_type: string
          read_at?: string | null
          related_document_id?: string | null
          related_document_type?:
            | Database["public"]["Enums"]["document_category"]
            | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          read_at?: string | null
          related_document_id?: string | null
          related_document_type?:
            | Database["public"]["Enums"]["document_category"]
            | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          position: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      technical_attestations: {
        Row: {
          client_name: string
          created_at: string
          document_url: string | null
          id: string
          issuer_contact: string | null
          issuer_name: string
          issuer_position: string | null
          project_object: string
          project_period_end: string | null
          project_period_start: string | null
          project_value: number | null
          related_certifications: string[] | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          user_id: string
          validity_date: string | null
        }
        Insert: {
          client_name: string
          created_at?: string
          document_url?: string | null
          id?: string
          issuer_contact?: string | null
          issuer_name: string
          issuer_position?: string | null
          project_object: string
          project_period_end?: string | null
          project_period_start?: string | null
          project_value?: number | null
          related_certifications?: string[] | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id: string
          validity_date?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string
          document_url?: string | null
          id?: string
          issuer_contact?: string | null
          issuer_name?: string
          issuer_position?: string | null
          project_object?: string
          project_period_end?: string | null
          project_period_start?: string | null
          project_value?: number | null
          related_certifications?: string[] | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_attestations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_system_notification: {
        Args: {
          expires_hours?: number
          notification_message: string
          notification_title: string
          notification_type?: string
          related_doc_id?: string
          related_doc_type?: Database["public"]["Enums"]["document_category"]
          target_user_id: string
        }
        Returns: string
      }
      create_test_data: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_alert_days: {
        Args: { document_type: string }
        Returns: number
      }
      get_full_names: {
        Args: { user_ids: string[] }
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      get_notification_metrics: {
        Args: { period_hours?: number }
        Returns: Json
      }
      get_retry_queue_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_unread_notifications_count: {
        Args: { user_uuid?: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_status_history: {
        Args: { target_user_id: string }
        Returns: {
          changed_by: string
          changed_by_name: string
          created_at: string
          id: string
          new_status: string
          old_status: string
          reason: string
        }[]
      }
      is_direct_team_leader: {
        Args: { leader_id: string; member_id: string }
        Returns: boolean
      }
      is_team_leader: {
        Args: { target_user_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_user_team_leader: {
        Args: { target_team_id: string; user_uuid: string }
        Returns: boolean
      }
      is_user_team_member: {
        Args: { target_team_id: string; user_uuid: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      update_document_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_status: {
        Args: { new_status: string; reason?: string; target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      document_category:
        | "certification"
        | "technical_attestation"
        | "legal_document"
      document_status:
        | "valid"
        | "expiring"
        | "expired"
        | "pending"
        | "deactivated"
      legal_document_type:
        | "legal_qualification"
        | "fiscal_regularity"
        | "economic_financial"
        | "common_declarations"
      user_role: "user" | "leader" | "admin"
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
      document_category: [
        "certification",
        "technical_attestation",
        "legal_document",
      ],
      document_status: [
        "valid",
        "expiring",
        "expired",
        "pending",
        "deactivated",
      ],
      legal_document_type: [
        "legal_qualification",
        "fiscal_regularity",
        "economic_financial",
        "common_declarations",
      ],
      user_role: ["user", "leader", "admin"],
    },
  },
} as const
