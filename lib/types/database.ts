/**
 * Database types for Meta-Agent System
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserSophistication = 'novice' | 'intermediate' | 'advanced' | 'expert'
export type UserRole = 'technical' | 'business' | 'hybrid' | 'consultant' | 'founder' | 'executive'
export type IndustryType = 'fintech' | 'healthcare' | 'ecommerce' | 'saas' | 'consumer_apps' | 'enterprise_software' | 'general' | 'other'
export type ConversationStage = 'idea_clarity' | 'user_workflow' | 'technical_specs' | 'wireframes' | 'completed'
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high'

// Database interface (simplified)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          last_seen_at: string
          is_active: boolean
          signup_source: string | null
          utm_campaign: string | null
          referrer: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_seen_at?: string
          is_active?: boolean
          signup_source?: string | null
          utm_campaign?: string | null
          referrer?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_seen_at?: string
          is_active?: boolean
          signup_source?: string | null
          utm_campaign?: string | null
          referrer?: string | null
        }
      }
      conversation_sessions: {
        Row: {
          id: string
          user_id: string
          profile_id: string | null
          current_stage: ConversationStage
          industry: IndustryType
          started_at: string
          completed_at: string | null
          last_activity_at: string
          stage_progress: Json
          total_questions_asked: number
          total_questions_answered: number
          escape_hatch_used: boolean
          escape_hatch_stage: ConversationStage | null
          completion_rate: number | null
          user_satisfaction_score: number | null
          time_to_completion_minutes: number | null
          user_agent: string | null
          ip_address: string | null
          session_metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          profile_id?: string | null
          current_stage?: ConversationStage
          industry: IndustryType
          started_at?: string
          completed_at?: string | null
          last_activity_at?: string
          stage_progress?: Json
          total_questions_asked?: number
          total_questions_answered?: number
          escape_hatch_used?: boolean
          escape_hatch_stage?: ConversationStage | null
          completion_rate?: number | null
          user_satisfaction_score?: number | null
          time_to_completion_minutes?: number | null
          user_agent?: string | null
          ip_address?: string | null
          session_metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string | null
          current_stage?: ConversationStage
          industry?: IndustryType
          started_at?: string
          completed_at?: string | null
          last_activity_at?: string
          stage_progress?: Json
          total_questions_asked?: number
          total_questions_answered?: number
          escape_hatch_used?: boolean
          escape_hatch_stage?: ConversationStage | null
          completion_rate?: number | null
          user_satisfaction_score?: number | null
          time_to_completion_minutes?: number | null
          user_agent?: string | null
          ip_address?: string | null
          session_metadata?: Json
        }
      }
      question_banks: {
        Row: {
          id: string
          question_id: string
          industry: IndustryType
          stage: ConversationStage
          question_text: string
          follow_up_questions: Json | null
          help_text: string | null
          is_required: boolean
          min_sophistication: UserSophistication | null
          max_sophistication: UserSophistication | null
          depends_on_questions: string[] | null
          category: string | null
          tags: string[] | null
          priority: number
          estimated_time_seconds: number | null
          version: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          industry: IndustryType
          stage: ConversationStage
          question_text: string
          follow_up_questions?: Json | null
          help_text?: string | null
          is_required?: boolean
          min_sophistication?: UserSophistication | null
          max_sophistication?: UserSophistication | null
          depends_on_questions?: string[] | null
          category?: string | null
          tags?: string[] | null
          priority?: number
          estimated_time_seconds?: number | null
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          industry?: IndustryType
          stage?: ConversationStage
          question_text?: string
          follow_up_questions?: Json | null
          help_text?: string | null
          is_required?: boolean
          min_sophistication?: UserSophistication | null
          max_sophistication?: UserSophistication | null
          depends_on_questions?: string[] | null
          category?: string | null
          tags?: string[] | null
          priority?: number
          estimated_time_seconds?: number | null
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          industry: IndustryType
          role: UserRole
          sophistication_level: UserSophistication
          confidence_score: number
          progress_data: Json
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          industry: IndustryType
          role?: UserRole
          sophistication_level?: UserSophistication
          confidence_score?: number
          progress_data?: Json
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          industry?: IndustryType
          role?: UserRole
          sophistication_level?: UserSophistication
          confidence_score?: number
          progress_data?: Json
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_responses: {
        Row: {
          id: string
          session_id: string
          question_id: string
          response_text: string
          response_data: Json
          response_time_seconds: number | null
          is_follow_up: boolean
          parent_response_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          response_text: string
          response_data?: Json
          response_time_seconds?: number | null
          is_follow_up?: boolean
          parent_response_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          response_text?: string
          response_data?: Json
          response_time_seconds?: number | null
          is_follow_up?: boolean
          parent_response_id?: string | null
          created_at?: string
        }
      }
      assumptions: {
        Row: {
          id: string
          session_id: string
          assumption_text: string
          confidence_level: ConfidenceLevel
          category: string | null
          reasoning: string | null
          user_accepted: boolean | null
          user_feedback: string | null
          generated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          assumption_text: string
          confidence_level: ConfidenceLevel
          category?: string | null
          reasoning?: string | null
          user_accepted?: boolean | null
          user_feedback?: string | null
          generated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          assumption_text?: string
          confidence_level?: ConfidenceLevel
          category?: string | null
          reasoning?: string | null
          user_accepted?: boolean | null
          user_feedback?: string | null
          generated_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      model_performance: {
        Row: {
          id: string
          session_id: string | null
          model_name: string
          operation_type: string
          input_tokens: number | null
          output_tokens: number | null
          latency_ms: number | null
          success: boolean
          error_message: string | null
          performance_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          model_name: string
          operation_type: string
          input_tokens?: number | null
          output_tokens?: number | null
          latency_ms?: number | null
          success?: boolean
          error_message?: string | null
          performance_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          model_name?: string
          operation_type?: string
          input_tokens?: number | null
          output_tokens?: number | null
          latency_ms?: number | null
          success?: boolean
          error_message?: string | null
          performance_data?: Json
          created_at?: string
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          event_type: string
          event_data: Json
          event_timestamp: string
          page_url: string | null
          user_agent: string | null
          referrer: string | null
          page_load_time_ms: number | null
          interaction_time_ms: number | null
          experiment_id: string | null
          variant: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_type: string
          event_data: Json
          event_timestamp?: string
          page_url?: string | null
          user_agent?: string | null
          referrer?: string | null
          page_load_time_ms?: number | null
          interaction_time_ms?: number | null
          experiment_id?: string | null
          variant?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_type?: string
          event_data?: Json
          event_timestamp?: string
          page_url?: string | null
          user_agent?: string | null
          referrer?: string | null
          page_load_time_ms?: number | null
          interaction_time_ms?: number | null
          experiment_id?: string | null
          variant?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_sophistication: UserSophistication
      user_role: UserRole
      industry_type: IndustryType
      conversation_stage: ConversationStage
      confidence_level: ConfidenceLevel
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
