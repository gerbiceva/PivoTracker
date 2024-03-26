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
      customers: {
        Row: {
          fullname: string;
          id: number;
        };
        Insert: {
          fullname: string;
          id?: number;
        };
        Update: {
          fullname?: string;
          id?: number;
        };
        Relationships: [];
      };
      nabava: {
        Row: {
          cena: number;
          created_at: string;
          id: string;
          minister: string;
          stevilo_piv: number;
        };
        Insert: {
          cena: number;
          created_at?: string;
          id?: string;
          minister?: string;
          stevilo_piv: number;
        };
        Update: {
          cena?: number;
          created_at?: string;
          id?: string;
          minister?: string;
          stevilo_piv?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'public_nabava_minister_fkey';
            columns: ['minister'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          customer_id: number;
          id: number;
          minister: string | null;
          ordered: number;
          ordered_at: string;
          paid: number;
        };
        Insert: {
          customer_id: number;
          id?: number;
          minister?: string | null;
          ordered?: number;
          ordered_at?: string;
          paid: number;
        };
        Update: {
          customer_id?: number;
          id?: number;
          minister?: string | null;
          ordered?: number;
          ordered_at?: string;
          paid?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'public_transactions_minister_fkey';
            columns: ['minister'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'everything_sum';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      everything: {
        Row: {
          fullname: string | null;
          ordered: number | null;
          ordered_at: string | null;
          paid: number | null;
        };
        Relationships: [];
      };
      everything_sum: {
        Row: {
          fullname: string | null;
          id: number | null;
          total_ordered: number | null;
          total_owed: number | null;
          total_paid: number | null;
        };
        Relationships: [];
      };
      named_transactions: {
        Row: {
          customer_id: number | null;
          fullname: string | null;
          id: number | null;
          ordered: number | null;
          ordered_at: string | null;
          paid: number | null;
          owed: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'everything_sum';
            referencedColumns: ['id'];
          },
        ];
      };
      total_summary: {
        Row: {
          total_cena: number | null;
          total_ordered: number | null;
          total_paid: number | null;
          total_stevilo_piv: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      pivo_v_gajba: {
        Args: {
          ordered: number;
          paid: number;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never;
