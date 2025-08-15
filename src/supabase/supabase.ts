
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
      customers: {
        Row: {
          created_at: string | null
          fullname: string
          id: number
          user_link: string | null
        }
        Insert: {
          created_at?: string | null
          fullname: string
          id?: number
          user_link?: string | null
        }
        Update: {
          created_at?: string | null
          fullname?: string
          id?: number
          user_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_link_fkey"
            columns: ["user_link"]
            isOneToOne: false
            referencedRelation: "named_minister_transactions"
            referencedColumns: ["minister_id"]
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
        Relationships: [
          {
            foreignKeyName: "public_nabava_minister_fkey"
            columns: ["minister"]
            isOneToOne: false
            referencedRelation: "named_minister_transactions"
            referencedColumns: ["minister_id"]
          },
        ]
      }
      gerba_user: {
        Row: {
          auth_user_id: string | null
          created_at: string
          data_of_birth: string | null
          first_name: string
          id: number
          phone_number: string | null
          room: number
          surname: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          data_of_birth?: string | null
          first_name: string
          id?: number
          phone_number?: string | null
          room: number
          surname: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          data_of_birth?: string | null
          first_name?: string
          id?: number
          phone_number?: string | null
          room?: number
          surname?: string
        }
        Relationships: [
          {
            foreignKeyName: "gerba_user_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "named_minister_transactions"
            referencedColumns: ["minister_id"]
          },
        ]
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
      minister_storage_transactions: {
        Row: {
          beer_count: number
          created_at: string
          id: number
          to_minister: string
        }
        Insert: {
          beer_count: number
          created_at?: string
          id?: number
          to_minister: string
        }
        Update: {
          beer_count?: number
          created_at?: string
          id?: number
          to_minister?: string
        }
        Relationships: [
          {
            foreignKeyName: "minister_storage_to_minister_fkey"
            columns: ["to_minister"]
            isOneToOne: false
            referencedRelation: "named_minister_transactions"
            referencedColumns: ["minister_id"]
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
            referencedRelation: "gerba_user"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "public_transactions_minister_fkey"
            columns: ["minister"]
            isOneToOne: false
            referencedRelation: "named_minister_transactions"
            referencedColumns: ["minister_id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "everything_sum"
            referencedColumns: ["id"]
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
        }
        Relationships: []
      }
      everything_sum: {
        Row: {
          fullname: string | null
          id: number | null
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
      named_minister_transactions: {
        Row: {
          beer_count: number | null
          created_at: string | null
          email: string | null
          id: number | null
          minister_id: string | null
          to_minister: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minister_storage_to_minister_fkey"
            columns: ["to_minister"]
            isOneToOne: false
            referencedRelation: "named_minister_transactions"
            referencedColumns: ["minister_id"]
          },
        ]
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
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "everything_sum"
            referencedColumns: ["id"]
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
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      get_reservations_for_user: {
        Args: { p_gerba_user_id: number }
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
        Args: { p_gerba_user_id: number }
        Returns: {
          auth_email: string
          auth_user_id: string
          created_at: string
          date_of_birth: string
          gerba_user_id: number
          name: string
          phone_number: string
          room: number
          surname: string
        }[]
      }
      get_user_expanded_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_created_at: string
          auth_email: string
          auth_user_id: string
          gerba_data_of_birth: string
          gerba_name: string
          gerba_phone_number: string
          gerba_room: number
          gerba_surname: string
          gerba_user_id: number
        }[]
      }
      pivo_v_gajba: {
        Args: { ordered: number; paid: number }
        Returns: number
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
          updated_at?: string | null
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
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
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
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const
