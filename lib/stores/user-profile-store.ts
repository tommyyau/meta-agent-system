import { UserProfile } from '@/lib/types/agent-types'
import { UserProfileModel } from '@/lib/models/user-profile'
import { supabase } from '@/lib/supabase/client'

/**
 * UserProfile Store
 * 
 * Handles persistence, caching, and CRUD operations for user profiles
 */
export class UserProfileStore {
  private cache: Map<string, UserProfileModel> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  /**
   * Create a new user profile
   */
  async create(data: Partial<UserProfile>): Promise<UserProfileModel> {
    const profile = new UserProfileModel(data)
    
    try {
      // Save to database
      const { error } = await supabase
        .from('user_profiles')
        .insert([this.serializeForDatabase(profile)])
      
      if (error) {
        throw new Error(`Failed to create profile: ${error.message}`)
      }
      
      // Cache the profile
      this.cache.set(profile.id, profile)
      
      return profile
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  /**
   * Get user profile by ID
   */
  async getById(id: string): Promise<UserProfileModel | null> {
    try {
      // Check cache first
      const cached = this.cache.get(id)
      if (cached && !cached.isStale(this.CACHE_TTL)) {
        return cached
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null
        }
        throw new Error(`Failed to get profile: ${error.message}`)
      }

      const profile = this.deserializeFromDatabase(data)
      
      // Update cache
      this.cache.set(id, profile)
      
      return profile
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  /**
   * Get user profile by session ID
   */
  async getBySessionId(sessionId: string): Promise<UserProfileModel | null> {
    try {
      // Check cache for session
      const cacheEntries = Array.from(this.cache.values())
      for (const profile of cacheEntries) {
        if (profile.sessionId === sessionId && !profile.isStale(this.CACHE_TTL)) {
          return profile
        }
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('session_id', sessionId)
        .order('last_updated', { ascending: false })
        .limit(1)

      if (error) {
        throw new Error(`Failed to get profile by session: ${error.message}`)
      }

      if (!data || data.length === 0) {
        return null
      }

      const profile = this.deserializeFromDatabase(data[0])
      
      // Update cache
      this.cache.set(profile.id, profile)
      
      return profile
    } catch (error) {
      console.error('Error getting user profile by session:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async update(profile: UserProfileModel): Promise<UserProfileModel> {
    try {
      profile.lastUpdated = new Date()

      // Update in database
      const { error } = await supabase
        .from('user_profiles')
        .update(this.serializeForDatabase(profile))
        .eq('id', profile.id)

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`)
      }

      // Update cache
      this.cache.set(profile.id, profile)
      
      return profile
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  /**
   * Delete user profile
   */
  async delete(id: string): Promise<void> {
    try {
      // Delete from database
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete profile: ${error.message}`)
      }

      // Remove from cache
      this.cache.delete(id)
    } catch (error) {
      console.error('Error deleting user profile:', error)
      throw error
    }
  }

  /**
   * Search profiles by industry
   */
  async findByIndustry(industry: string, limit: number = 10): Promise<UserProfileModel[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('industry', industry)
        .order('industry_confidence', { ascending: false })
        .limit(limit)

             if (error) {
         throw new Error(`Failed to find profiles by industry: ${error.message}`)
       }
 
       return data.map((row: any) => this.deserializeFromDatabase(row))
    } catch (error) {
      console.error('Error finding profiles by industry:', error)
      throw error
    }
  }

  /**
   * Find profiles with high confidence scores
   */
  async findHighConfidenceProfiles(minConfidence: number = 0.7, limit: number = 50): Promise<UserProfileModel[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .gte('industry_confidence', minConfidence)
        .gte('role_confidence', minConfidence)
        .order('last_updated', { ascending: false })
        .limit(limit)

             if (error) {
         throw new Error(`Failed to find high confidence profiles: ${error.message}`)
       }
 
       return data.map((row: any) => this.deserializeFromDatabase(row))
    } catch (error) {
      console.error('Error finding high confidence profiles:', error)
      throw error
    }
  }

  /**
   * Get profile statistics
   */
  async getStatistics(): Promise<{
    total: number
    byIndustry: Record<string, number>
    byRole: Record<string, number>
    bySophistication: Record<string, number>
    avgConfidence: number
  }> {
    try {
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw new Error(`Failed to get total count: ${countError.message}`)
      }

      // Get aggregated data
      const { data, error } = await supabase
        .from('user_profiles')
        .select('industry, role, sophistication_level, industry_confidence, role_confidence')

      if (error) {
        throw new Error(`Failed to get statistics: ${error.message}`)
      }

      // Process statistics
      const byIndustry: Record<string, number> = {}
      const byRole: Record<string, number> = {}
      const bySophistication: Record<string, number> = {}
      let totalConfidence = 0

             data.forEach((profile: any) => {
        // Count by industry
        byIndustry[profile.industry] = (byIndustry[profile.industry] || 0) + 1
        
        // Count by role
        byRole[profile.role] = (byRole[profile.role] || 0) + 1
        
        // Count by sophistication
        bySophistication[profile.sophistication_level] = (bySophistication[profile.sophistication_level] || 0) + 1
        
        // Sum confidence
        totalConfidence += (profile.industry_confidence + profile.role_confidence) / 2
      })

      return {
        total: total || 0,
        byIndustry,
        byRole,
        bySophistication,
        avgConfidence: data.length > 0 ? totalConfidence / data.length : 0
      }
    } catch (error) {
      console.error('Error getting profile statistics:', error)
      throw error
    }
  }

  /**
   * Clean up old profiles
   */
  async cleanup(maxAge: number = 90 * 24 * 60 * 60 * 1000): Promise<number> { // 90 days default
    try {
      const cutoffDate = new Date(Date.now() - maxAge).toISOString()
      
      const { data, error } = await supabase
        .from('user_profiles')
        .delete()
        .lt('last_updated', cutoffDate)
        .select('id')

      if (error) {
        throw new Error(`Failed to cleanup profiles: ${error.message}`)
      }

             // Remove from cache
       if (data) {
         data.forEach((profile: any) => this.cache.delete(profile.id))
       }

      return data?.length || 0
    } catch (error) {
      console.error('Error cleaning up profiles:', error)
      throw error
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  /**
   * Serialize profile for database storage
   */
  private serializeForDatabase(profile: UserProfileModel): any {
    return {
      id: profile.id,
      session_id: profile.sessionId,
      industry: profile.industry,
      industry_confidence: profile.industryConfidence,
      sub_industry: profile.subIndustry,
      role: profile.role,
      role_confidence: profile.roleConfidence,
      role_details: profile.roleDetails,
      sophistication_level: profile.sophisticationLevel,
      sophistication_score: profile.sophisticationScore,
      conversation_history: JSON.stringify(profile.conversationHistory),
      detected_keywords: JSON.stringify(profile.detectedKeywords),
      terminology: JSON.stringify(profile.terminology),
      preferred_communication_style: profile.preferredCommunicationStyle,
      assumption_tolerance: profile.assumptionTolerance,
      created: profile.created.toISOString(),
      last_updated: profile.lastUpdated.toISOString(),
      analysis_version: profile.analysisVersion
    }
  }

  /**
   * Deserialize profile from database
   */
  private deserializeFromDatabase(data: any): UserProfileModel {
    return UserProfileModel.fromJSON({
      id: data.id,
      sessionId: data.session_id,
      industry: data.industry,
      industryConfidence: data.industry_confidence,
      subIndustry: data.sub_industry,
      role: data.role,
      roleConfidence: data.role_confidence,
      roleDetails: data.role_details,
      sophisticationLevel: data.sophistication_level,
      sophisticationScore: data.sophistication_score,
      conversationHistory: JSON.parse(data.conversation_history || '[]'),
      detectedKeywords: JSON.parse(data.detected_keywords || '[]'),
      terminology: JSON.parse(data.terminology || '[]'),
      preferredCommunicationStyle: data.preferred_communication_style,
      assumptionTolerance: data.assumption_tolerance,
      created: data.created,
      lastUpdated: data.last_updated,
      analysisVersion: data.analysis_version
    })
  }

  /**
   * Health check for the store
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)

      return !error
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const userProfileStore = new UserProfileStore() 