/**
 * Database types for Supabase
 * Based on the Ideas Taxonomy system entities
 */

export type IdeaStatus = "planned" | "active" | "completed" | "archived";
export type StoryStatus = "backlog" | "planned" | "in-progress" | "done";
export type StoryPriority = "low" | "medium" | "high" | "critical";
export type SprintStatus = "planned" | "active" | "completed";
export type UpdateType = "progress" | "completion" | "blocker" | "note";
export type FigureStatus = "active" | "archived";

export interface Database {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: number;
          idea_number: number;
          title: string;
          description: string;
          status: IdeaStatus;
          created: string;
          tags: string[] | null;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          idea_number: number;
          title: string;
          description: string;
          status: IdeaStatus;
          created: string;
          tags?: string[] | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          idea_number?: number;
          title?: string;
          description?: string;
          status?: IdeaStatus;
          created?: string;
          tags?: string[] | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stories: {
        Row: {
          id: number;
          story_number: number;
          title: string;
          description: string;
          status: StoryStatus;
          priority: StoryPriority;
          created: string;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          story_number: number;
          title: string;
          description: string;
          status: StoryStatus;
          priority: StoryPriority;
          created: string;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          story_number?: number;
          title?: string;
          description?: string;
          status?: StoryStatus;
          priority?: StoryPriority;
          created?: string;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sprints: {
        Row: {
          id: number;
          sprint_id: string;
          year: number;
          sprint_number: number;
          start_date: string;
          end_date: string;
          status: SprintStatus;
          goals: string[] | null;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          sprint_id: string;
          year: number;
          sprint_number: number;
          start_date: string;
          end_date: string;
          status: SprintStatus;
          goals?: string[] | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          sprint_id?: string;
          year?: number;
          sprint_number?: number;
          start_date?: string;
          end_date?: string;
          status?: SprintStatus;
          goals?: string[] | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      updates: {
        Row: {
          id: number;
          sprint_id: string;
          idea_number: number;
          story_number: number;
          notation: string;
          date: string;
          type: UpdateType;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          sprint_id: string;
          idea_number: number;
          story_number: number;
          notation: string;
          date: string;
          type: UpdateType;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          sprint_id?: string;
          idea_number?: number;
          story_number?: number;
          notation?: string;
          date?: string;
          type?: UpdateType;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      figures: {
        Row: {
          id: number;
          figure_number: number;
          title: string;
          description: string | null;
          image_path: string;
          alt_text: string | null;
          created: string;
          uploaded_date: string | null;
          file_type: string | null;
          status: FigureStatus;
          tags: string[] | null;
          dimensions: string | null;
          file_size: string | null;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          figure_number: number;
          title: string;
          description?: string | null;
          image_path: string;
          alt_text?: string | null;
          created: string;
          uploaded_date?: string | null;
          file_type?: string | null;
          status: FigureStatus;
          tags?: string[] | null;
          dimensions?: string | null;
          file_size?: string | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          figure_number?: number;
          title?: string;
          description?: string | null;
          image_path?: string;
          alt_text?: string | null;
          created?: string;
          uploaded_date?: string | null;
          file_type?: string | null;
          status?: FigureStatus;
          tags?: string[] | null;
          dimensions?: string | null;
          file_size?: string | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: number;
          title: string;
          slug: string;
          date: string;
          author: string | null;
          tags: string[] | null;
          excerpt: string | null;
          canonical_source_url: string | null;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          slug: string;
          date: string;
          author?: string | null;
          tags?: string[] | null;
          excerpt?: string | null;
          canonical_source_url?: string | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          slug?: string;
          date?: string;
          author?: string | null;
          tags?: string[] | null;
          excerpt?: string | null;
          canonical_source_url?: string | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Junction tables for many-to-many relationships
      idea_stories: {
        Row: {
          idea_id: number;
          story_id: number;
        };
        Insert: {
          idea_id: number;
          story_id: number;
        };
        Update: {
          idea_id?: number;
          story_id?: number;
        };
      };
      idea_sprints: {
        Row: {
          idea_id: number;
          sprint_id: number;
        };
        Insert: {
          idea_id: number;
          sprint_id: number;
        };
        Update: {
          idea_id?: number;
          sprint_id?: number;
        };
      };
      idea_figures: {
        Row: {
          idea_id: number;
          figure_id: number;
        };
        Insert: {
          idea_id: number;
          figure_id: number;
        };
        Update: {
          idea_id?: number;
          figure_id?: number;
        };
      };
      idea_materials: {
        Row: {
          idea_id: number;
          material_id: number;
        };
        Insert: {
          idea_id: number;
          material_id: number;
        };
        Update: {
          idea_id?: number;
          material_id?: number;
        };
      };
      story_sprints: {
        Row: {
          story_id: number;
          sprint_id: number;
        };
        Insert: {
          story_id: number;
          sprint_id: number;
        };
        Update: {
          story_id?: number;
          sprint_id?: number;
        };
      };
      story_figures: {
        Row: {
          story_id: number;
          figure_id: number;
        };
        Insert: {
          story_id: number;
          figure_id: number;
        };
        Update: {
          story_id?: number;
          figure_id?: number;
        };
      };
      story_materials: {
        Row: {
          story_id: number;
          material_id: number;
        };
        Insert: {
          story_id: number;
          material_id: number;
        };
        Update: {
          story_id?: number;
          material_id?: number;
        };
      };
      sprint_figures: {
        Row: {
          sprint_id: number;
          figure_id: number;
        };
        Insert: {
          sprint_id: number;
          figure_id: number;
        };
        Update: {
          sprint_id?: number;
          figure_id?: number;
        };
      };
      sprint_materials: {
        Row: {
          sprint_id: number;
          material_id: number;
        };
        Insert: {
          sprint_id: number;
          material_id: number;
        };
        Update: {
          sprint_id?: number;
          material_id?: number;
        };
      };
      figure_materials: {
        Row: {
          figure_id: number;
          material_id: number;
        };
        Insert: {
          figure_id: number;
          material_id: number;
        };
        Update: {
          figure_id?: number;
          material_id?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      idea_status: IdeaStatus;
      story_status: StoryStatus;
      story_priority: StoryPriority;
      sprint_status: SprintStatus;
      update_type: UpdateType;
      figure_status: FigureStatus;
    };
  };
}

// Helper types for easier use
export type Idea = Database["public"]["Tables"]["ideas"]["Row"];
export type Story = Database["public"]["Tables"]["stories"]["Row"];
export type Sprint = Database["public"]["Tables"]["sprints"]["Row"];
export type Update = Database["public"]["Tables"]["updates"]["Row"];
export type Figure = Database["public"]["Tables"]["figures"]["Row"];
export type Material = Database["public"]["Tables"]["materials"]["Row"];

export type IdeaInsert = Database["public"]["Tables"]["ideas"]["Insert"];
export type StoryInsert = Database["public"]["Tables"]["stories"]["Insert"];
export type SprintInsert = Database["public"]["Tables"]["sprints"]["Insert"];
export type UpdateInsert = Database["public"]["Tables"]["updates"]["Insert"];
export type FigureInsert = Database["public"]["Tables"]["figures"]["Insert"];
export type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"];
