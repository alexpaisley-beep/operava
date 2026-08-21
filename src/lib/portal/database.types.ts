/**
 * Generated from the live Supabase schema (project Operava) via
 * `supabase gen types typescript` / the Supabase MCP `generate_typescript_types`.
 *
 * Do not edit by hand — regenerate after every migration.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor_id: string | null;
          actor_label: string;
          actor_type: Database["public"]["Enums"]["actor_type"];
          company_id: string | null;
          created_at: string;
          data: Json;
          description: string;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          project_id: string | null;
          visibility: Database["public"]["Enums"]["visibility"];
        };
        Insert: {
          actor_id?: string | null;
          actor_label?: string;
          actor_type?: Database["public"]["Enums"]["actor_type"];
          company_id?: string | null;
          created_at?: string;
          data?: Json;
          description: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type: string;
          id?: string;
          project_id?: string | null;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Update: {
          actor_id?: string | null;
          actor_label?: string;
          actor_type?: Database["public"]["Enums"]["actor_type"];
          company_id?: string | null;
          created_at?: string;
          data?: Json;
          description?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: string;
          project_id?: string | null;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_records: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          due_date: string | null;
          external_url: string | null;
          id: string;
          label: string;
          notes: string;
          paid_at: string | null;
          project_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["billing_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          external_url?: string | null;
          id?: string;
          label: string;
          notes?: string;
          paid_at?: string | null;
          project_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["billing_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          external_url?: string | null;
          id?: string;
          label?: string;
          notes?: string;
          paid_at?: string | null;
          project_id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["billing_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_records_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      client_requests: {
        Row: {
          acknowledged_at: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          created_by: string | null;
          description: string;
          due_date: string | null;
          id: string;
          project_id: string;
          status: Database["public"]["Enums"]["client_request_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          due_date?: string | null;
          id?: string;
          project_id: string;
          status?: Database["public"]["Enums"]["client_request_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          acknowledged_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          due_date?: string | null;
          id?: string;
          project_id?: string;
          status?: Database["public"]["Enums"]["client_request_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_requests_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_requests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_requests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          contact_email: string;
          contact_phone: string;
          created_at: string;
          id: string;
          internal_notes: string;
          name: string;
          primary_contact_name: string;
          slug: string;
          status: Database["public"]["Enums"]["company_status"];
          updated_at: string;
        };
        Insert: {
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          id?: string;
          internal_notes?: string;
          name: string;
          primary_contact_name?: string;
          slug: string;
          status?: Database["public"]["Enums"]["company_status"];
          updated_at?: string;
        };
        Update: {
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          id?: string;
          internal_notes?: string;
          name?: string;
          primary_contact_name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["company_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      mcp_ops: {
        Row: {
          created_at: string;
          id: string;
          idempotency_key: string;
          result: Json;
          tool: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          idempotency_key: string;
          result: Json;
          tool: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          result?: Json;
          tool?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string;
          due_date: string | null;
          id: string;
          name: string;
          project_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["milestone_status"];
          updated_at: string;
          visibility: Database["public"]["Enums"]["visibility"];
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string | null;
          id?: string;
          name: string;
          project_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["milestone_status"];
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string | null;
          id?: string;
          name?: string;
          project_id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["milestone_status"];
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          auth_user_id: string;
          company_id: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["portal_role"];
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          company_id?: string | null;
          created_at?: string;
          email: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["portal_role"];
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          company_id?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["portal_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      project_blockers: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          project_id: string;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["blocker_status"];
          title: string;
          waiting_on: Database["public"]["Enums"]["blocker_waiting_on"];
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          project_id: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["blocker_status"];
          title: string;
          waiting_on?: Database["public"]["Enums"]["blocker_waiting_on"];
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          project_id?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["blocker_status"];
          title?: string;
          waiting_on?: Database["public"]["Enums"]["blocker_waiting_on"];
        };
        Relationships: [
          {
            foreignKeyName: "project_blockers_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_files: {
        Row: {
          category: Database["public"]["Enums"]["file_category"];
          created_at: string;
          id: string;
          mime_type: string;
          name: string;
          path: string;
          project_id: string;
          request_id: string | null;
          size_bytes: number;
          uploaded_by: string | null;
          visibility: Database["public"]["Enums"]["visibility"];
        };
        Insert: {
          category?: Database["public"]["Enums"]["file_category"];
          created_at?: string;
          id?: string;
          mime_type?: string;
          name: string;
          path: string;
          project_id: string;
          request_id?: string | null;
          size_bytes?: number;
          uploaded_by?: string | null;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Update: {
          category?: Database["public"]["Enums"]["file_category"];
          created_at?: string;
          id?: string;
          mime_type?: string;
          name?: string;
          path?: string;
          project_id?: string;
          request_id?: string | null;
          size_bytes?: number;
          uploaded_by?: string | null;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_files_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_links: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          kind: Database["public"]["Enums"]["link_kind"];
          label: string;
          project_id: string;
          sort_order: number;
          updated_at: string;
          url: string;
          visibility: Database["public"]["Enums"]["visibility"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["link_kind"];
          label: string;
          project_id: string;
          sort_order?: number;
          updated_at?: string;
          url: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["link_kind"];
          label?: string;
          project_id?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "project_links_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_links_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          created_at: string;
          profile_id: string;
          project_id: string;
        };
        Insert: {
          created_at?: string;
          profile_id: string;
          project_id: string;
        };
        Update: {
          created_at?: string;
          profile_id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_updates: {
        Row: {
          body: string;
          category: string;
          created_at: string;
          created_by: string | null;
          id: string;
          milestone_id: string | null;
          project_id: string;
          title: string;
          visibility: Database["public"]["Enums"]["visibility"];
        };
        Insert: {
          body?: string;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          milestone_id?: string | null;
          project_id: string;
          title: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Update: {
          body?: string;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          milestone_id?: string | null;
          project_id?: string;
          title?: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "project_updates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_updates_milestone_id_fkey";
            columns: ["milestone_id"];
            isOneToOne: false;
            referencedRelation: "milestones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_updates_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          actual_completion_date: string | null;
          company_id: string;
          created_at: string;
          current_work: string;
          description: string;
          health: Database["public"]["Enums"]["project_health"];
          id: string;
          internal_notes: string;
          is_archived: boolean;
          name: string;
          owner_profile_id: string | null;
          phase: string;
          progress_percent: number;
          start_date: string | null;
          status: Database["public"]["Enums"]["project_status"];
          summary: string;
          target_date: string | null;
          updated_at: string;
        };
        Insert: {
          actual_completion_date?: string | null;
          company_id: string;
          created_at?: string;
          current_work?: string;
          description?: string;
          health?: Database["public"]["Enums"]["project_health"];
          id?: string;
          internal_notes?: string;
          is_archived?: boolean;
          name: string;
          owner_profile_id?: string | null;
          phase?: string;
          progress_percent?: number;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          summary?: string;
          target_date?: string | null;
          updated_at?: string;
        };
        Update: {
          actual_completion_date?: string | null;
          company_id?: string;
          created_at?: string;
          current_work?: string;
          description?: string;
          health?: Database["public"]["Enums"]["project_health"];
          id?: string;
          internal_notes?: string;
          is_archived?: boolean;
          name?: string;
          owner_profile_id?: string | null;
          phase?: string;
          progress_percent?: number;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          summary?: string;
          target_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_owner_profile_id_fkey";
            columns: ["owner_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      request_comments: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          request_id: string;
          visibility: Database["public"]["Enums"]["visibility"];
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          request_id: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          request_id?: string;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "request_comments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "request_comments_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      requests: {
        Row: {
          approval_status: string | null;
          created_at: string;
          created_by: string | null;
          description: string;
          estimated_cost: number | null;
          estimated_timeline_impact: string;
          expected_result: string;
          id: string;
          priority: Database["public"]["Enums"]["request_priority"];
          project_id: string;
          severity: Database["public"]["Enums"]["bug_severity"] | null;
          status: Database["public"]["Enums"]["request_status"];
          steps_to_reproduce: string;
          title: string;
          type: Database["public"]["Enums"]["request_type"];
          updated_at: string;
        };
        Insert: {
          approval_status?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          estimated_cost?: number | null;
          estimated_timeline_impact?: string;
          expected_result?: string;
          id?: string;
          priority?: Database["public"]["Enums"]["request_priority"];
          project_id: string;
          severity?: Database["public"]["Enums"]["bug_severity"] | null;
          status?: Database["public"]["Enums"]["request_status"];
          steps_to_reproduce?: string;
          title: string;
          type: Database["public"]["Enums"]["request_type"];
          updated_at?: string;
        };
        Update: {
          approval_status?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          estimated_cost?: number | null;
          estimated_timeline_impact?: string;
          expected_result?: string;
          id?: string;
          priority?: Database["public"]["Enums"]["request_priority"];
          project_id?: string;
          severity?: Database["public"]["Enums"]["bug_severity"] | null;
          status?: Database["public"]["Enums"]["request_status"];
          steps_to_reproduce?: string;
          title?: string;
          type?: Database["public"]["Enums"]["request_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      actor_type: "internal" | "customer" | "mcp" | "system";
      billing_status: "pending" | "due" | "paid" | "overdue" | "cancelled";
      blocker_status: "open" | "resolved";
      blocker_waiting_on: "client" | "operava" | "third_party";
      bug_severity: "minor" | "moderate" | "major" | "critical";
      client_request_status: "open" | "acknowledged" | "completed" | "cancelled";
      company_status: "prospect" | "active" | "paused" | "archived";
      file_category:
        | "contract"
        | "specification"
        | "deliverable"
        | "documentation"
        | "screenshot"
        | "other";
      link_kind: "staging" | "production" | "repo" | "docs" | "design" | "other";
      milestone_status: "upcoming" | "in_progress" | "blocked" | "complete";
      portal_role: "admin" | "client";
      project_health: "on_track" | "at_risk" | "off_track";
      project_status:
        | "planning"
        | "in_progress"
        | "testing"
        | "waiting_on_client"
        | "blocked"
        | "ready_for_review"
        | "launching"
        | "complete"
        | "on_hold";
      request_priority: "low" | "normal" | "high" | "urgent";
      request_status:
        | "submitted"
        | "reviewing"
        | "approved"
        | "in_progress"
        | "waiting_on_client"
        | "done"
        | "declined";
      request_type: "bug" | "change_request" | "question" | "support" | "feature_idea";
      visibility: "customer" | "internal";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      actor_type: ["internal", "customer", "mcp", "system"],
      billing_status: ["pending", "due", "paid", "overdue", "cancelled"],
      blocker_status: ["open", "resolved"],
      blocker_waiting_on: ["client", "operava", "third_party"],
      bug_severity: ["minor", "moderate", "major", "critical"],
      client_request_status: ["open", "acknowledged", "completed", "cancelled"],
      company_status: ["prospect", "active", "paused", "archived"],
      file_category: [
        "contract",
        "specification",
        "deliverable",
        "documentation",
        "screenshot",
        "other",
      ],
      link_kind: ["staging", "production", "repo", "docs", "design", "other"],
      milestone_status: ["upcoming", "in_progress", "blocked", "complete"],
      portal_role: ["admin", "client"],
      project_health: ["on_track", "at_risk", "off_track"],
      project_status: [
        "planning",
        "in_progress",
        "testing",
        "waiting_on_client",
        "blocked",
        "ready_for_review",
        "launching",
        "complete",
        "on_hold",
      ],
      request_priority: ["low", "normal", "high", "urgent"],
      request_status: [
        "submitted",
        "reviewing",
        "approved",
        "in_progress",
        "waiting_on_client",
        "done",
        "declined",
      ],
      request_type: ["bug", "change_request", "question", "support", "feature_idea"],
      visibility: ["customer", "internal"],
    },
  },
} as const;
