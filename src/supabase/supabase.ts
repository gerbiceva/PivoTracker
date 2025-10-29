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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      base_users: {
        Row: {
          auth: string | null
          created_at: string
          id: number
          name: string
          resident: number | null
          surname: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          id?: number
          name: string
          resident?: number | null
          surname: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          id?: number
          name?: string
          resident?: number | null
          surname?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_users_resident_fkey"
            columns: ["resident"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_users_resident_fkey"
            columns: ["resident"]
            isOneToOne: false
            referencedRelation: "user_view"
            referencedColumns: ["resident_id"]
          },
        ]
      }
      gerba_storage: {
        Row: {
          beer_count: number
          created_at: string
          id: string
          minister: string
          notes: string | null
          price: number
        }
        Insert: {
          beer_count: number
          created_at?: string
          id?: string
          minister?: string
          notes?: string | null
          price: number
        }
        Update: {
          beer_count?: number
          created_at?: string
          id?: string
          minister?: string
          notes?: string | null
          price?: number
        }
        Relationships: []
      }
      items: {
        Row: {
          beer_count: number
          created_at: string
          id: string
          name: string
          price: number
          visible: boolean
        }
        Insert: {
          beer_count: number
          created_at?: string
          id?: string
          name: string
          price: number
          visible?: boolean
        }
        Update: {
          beer_count?: number
          created_at?: string
          id?: string
          name?: string
          price?: number
          visible?: boolean
        }
        Relationships: []
      }
      permission_types: {
        Row: {
          display_name: string
          id: number
          name: string
        }
        Insert: {
          display_name?: string
          id?: number
          name: string
        }
        Update: {
          display_name?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          id: number
          permission_creator: number | null
          permission_type: number | null
          user_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          permission_creator?: number | null
          permission_type?: number | null
          user_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          permission_creator?: number | null
          permission_type?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_permission_type_fkey"
            columns: ["permission_type"]
            isOneToOne: false
            referencedRelation: "permission_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string | null
          id: number
          machine_id: number
          note: string | null
          slot: unknown
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          machine_id: number
          note?: string | null
          slot: unknown
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          machine_id?: number
          note?: string | null
          slot?: unknown
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "washing_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "base_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "everything"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "everything_sum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_view"
            referencedColumns: ["base_user_id"]
          },
        ]
      }
      residents: {
        Row: {
          birth_date: string | null
          created_at: string
          id: number
          phone_number: string | null
          room: number
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: number
          phone_number?: string | null
          room: number
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: number
          phone_number?: string | null
          room?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          customer_id: number
          id: number
          item: string | null
          minister: string
          ordered: number
          ordered_at: string
          paid: number
        }
        Insert: {
          customer_id: number
          id?: number
          item?: string | null
          minister?: string
          ordered?: number
          ordered_at?: string
          paid: number
        }
        Update: {
          customer_id?: number
          id?: number
          item?: string | null
          minister?: string
          ordered?: number
          ordered_at?: string
          paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "base_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "everything"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "everything_sum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_view"
            referencedColumns: ["base_user_id"]
          },
          {
            foreignKeyName: "transactions_item_fkey"
            columns: ["item"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      washing_machines: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      everything: {
        Row: {
          fullname: string | null
          item_name: string | null
          item_price: number | null
          ordered: number | null
          ordered_at: string | null
          paid: number | null
          user_id: number | null
        }
        Relationships: []
      }
      everything_sum: {
        Row: {
          id: number | null
          name: string | null
          surname: string | null
          total_difference: number | null
          total_ordered: number | null
          total_paid: number | null
          total_value: number | null
        }
        Relationships: []
      }
      monthly_summary: {
        Row: {
          month_start: string | null
          total_ordered: number | null
          total_paid: number | null
          total_value: number | null
        }
        Relationships: []
      }
      named_transactions: {
        Row: {
          customer_id: number | null
          fullname: string | null
          id: number | null
          item_beer_count: number | null
          item_name: string | null
          item_price: number | null
          ordered: number | null
          ordered_at: string | null
          owed: number | null
          paid: number | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "base_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "everything"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "everything_sum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_view"
            referencedColumns: ["base_user_id"]
          },
        ]
      }
      total_summary: {
        Row: {
          total_beer_count: number | null
          total_debt: number | null
          total_ordered: number | null
          total_paid: number | null
          total_value: number | null
        }
        Relationships: []
      }
      user_view: {
        Row: {
          auth_email: string | null
          auth_user_id: string | null
          base_user_id: number | null
          birth_date: string | null
          created_at: string | null
          name: string | null
          phone_number: string | null
          resident_id: number | null
          room: number | null
          surname: string | null
        }
        Relationships: []
      }
      weekly_summary: {
        Row: {
          total_ordered: number | null
          total_paid: number | null
          total_value: number | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_reservation_with_range: {
        Args: {
          p_machine_id: number
          p_note?: string
          p_slot_end: string
          p_slot_start: string
        }
        Returns: number
      }
      current_user_has_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      get_reservations_for_user: {
        Args: { p_base_user_id: number }
        Returns: {
          machine_id: number
          machine_name: string
          note: string
          reservation_id: number
          slot_end_utc: string
          slot_start_utc: string
        }[]
      }
      get_reservations_week: {
        Args: { p_date: string }
        Returns: {
          auth_user_id: string
          created_at: string
          date_of_birth: string
          machine_id: number
          machine_name: string
          name: string
          note: string
          phone_number: string
          reservation_id: number
          room: number
          slot_end_utc: string
          slot_index_local: number
          slot_start_utc: string
          surname: string
          user_id: string
        }[]
      }
      get_slots_for_day: {
        Args: { p_date: string }
        Returns: {
          auth_user_id: string
          created_at: string
          date_of_birth: string
          first_name: string
          is_empty: boolean
          machine_id: number
          machine_name: string
          note: string
          phone_number: string
          reservation_id: number
          room: number
          slot_end_utc: string
          slot_index_local: number
          slot_start_utc: string
          surname: string
          user_id: string
        }[]
      }
      get_total_summary: {
        Args: { datefrom: string; dateto: string }
        Returns: {
          total_beer_count: number
          total_debt: number
          total_ordered: number
          total_paid: number
          total_value: number
        }[]
      }
      get_user_expanded: {
        Args: { p_base_user_id: number }
        Returns: {
          auth_email: string
          auth_user_id: string
          base_user_id: number
          created_at: string
          date_of_birth: string
          name: string
          phone_number: string
          room: number
          surname: string
        }[]
      }
      get_user_expanded_from_auth: {
        Args: never
        Returns: {
          auth_created_at: string
          auth_email: string
          auth_user_id: string
          base_data_of_birth: string
          base_name: string
          base_phone_number: string
          base_room: number
          base_surname: string
          base_user_id: number
        }[]
      }
      slot_range_from_date_index: {
        Args: { p_date: string; p_slot_index: number; p_tz?: string }
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      machine_info: {
        id: number | null
        name: string | null
        slots: Database["public"]["CompositeTypes"]["slot_info"][] | null
      }
      reservation_info: {
        reservation_id: number | null
        user_id: string | null
        user_email: string | null
        note: string | null
      }
      slot_info: {
        time_start_utc: string | null
        time_end_utc: string | null
        is_empty: boolean | null
        reservation:
          | Database["public"]["CompositeTypes"]["reservation_info"]
          | null
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const
