/**
 * Database connection and utilities for Meta-Agent System
 * Supabase PostgreSQL integration with TypeScript support
 */

import { createClient } from '@supabase/supabase-js'
import { Database, IndustryType, ConversationStage, UserSophistication } from './types/database'

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for browser/frontend use (Row Level Security enabled)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Admin client for server-side operations (bypasses RLS when needed)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Database connection health check
export async function checkDatabaseConnection(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  try {
    const start = Date.now()
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()
    
    const latency = Date.now() - start
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
      return { connected: false, error: error.message }
    }
    
    return { connected: true, latency }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Real-time subscription helper
export function createRealtimeSubscription(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table,
        filter 
      },
      callback || (() => {})
    )
    .subscribe()

  return channel
}

// Query builders for common operations
export const queries = {
  // User operations
  users: {
    create: (userData: Database['public']['Tables']['users']['Insert']) =>
      supabase.from('users').insert(userData).select().single(),
    
    findByEmail: (email: string) =>
      supabase.from('users').select('*').eq('email', email).single(),
    
    updateLastSeen: (userId: string) =>
      supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', userId),
  },

  // User profile operations
  profiles: {
    create: (profileData: Partial<Database['public']['Tables']['user_profiles']['Insert']>) =>
      supabase.from('user_profiles').insert(profileData).select().single(),
    
    findByUserId: (userId: string) =>
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    
    updateConfidence: (profileId: string, confidence: number) =>
      supabase.from('user_profiles').update({ confidence_score: confidence }).eq('id', profileId),
  },

  // Session operations
  sessions: {
    create: (sessionData: Database['public']['Tables']['conversation_sessions']['Insert']) =>
      supabase.from('conversation_sessions').insert(sessionData).select().single(),
    
    findByUserId: (userId: string) =>
      supabase.from('conversation_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }),
    
    updateStage: (sessionId: string, stage: ConversationStage) =>
      supabase.from('conversation_sessions').update({ 
        current_stage: stage, 
        last_activity_at: new Date().toISOString() 
      }).eq('id', sessionId),
    
    complete: (sessionId: string, completionData: { completion_rate?: number; user_satisfaction_score?: number }) =>
      supabase.from('conversation_sessions').update({ 
        ...completionData,
        completed_at: new Date().toISOString(),
        current_stage: 'completed' as const
      }).eq('id', sessionId),
  },

  // Question bank operations
  questions: {
    getByIndustryAndStage: (industry: IndustryType, stage: ConversationStage) =>
      supabase.from('question_banks')
        .select('*')
        .eq('industry', industry)
        .eq('stage', stage)
        .eq('is_active', true)
        .order('priority', { ascending: false }),
    
    getAdaptiveQuestions: (industry: IndustryType, stage: ConversationStage, sophistication: UserSophistication) =>
      supabase.from('question_banks')
        .select('*')
        .eq('industry', industry)
        .eq('stage', stage)
        .eq('is_active', true)
        .order('priority', { ascending: false }),
  },

  // User response operations
  responses: {
    create: (responseData: Partial<Database['public']['Tables']['user_responses']['Insert']>) =>
      supabase.from('user_responses').insert(responseData).select().single(),
    
    getBySession: (sessionId: string) =>
      supabase.from('user_responses').select('*').eq('session_id', sessionId).order('created_at'),
  },

  // Assumption operations
  assumptions: {
    create: (assumptionData: Partial<Database['public']['Tables']['assumptions']['Insert']>) =>
      supabase.from('assumptions').insert(assumptionData).select().single(),
    
    getBySession: (sessionId: string) =>
      supabase.from('assumptions').select('*').eq('session_id', sessionId).order('created_at'),
    
    updateAcceptance: (assumptionId: string, accepted: boolean, feedback?: string) =>
      supabase.from('assumptions').update({ 
        user_accepted: accepted,
        user_feedback: feedback 
      }).eq('id', assumptionId),
  },

  // Analytics operations
  analytics: {
    recordEvent: (eventData: Database['public']['Tables']['user_analytics']['Insert']) =>
      supabase.from('user_analytics').insert(eventData),
    
    recordModelPerformance: (performanceData: Partial<Database['public']['Tables']['model_performance']['Insert']>) =>
      supabase.from('model_performance').insert(performanceData),
  },
}

export default supabase 