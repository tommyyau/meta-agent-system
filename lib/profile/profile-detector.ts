import { industryClassifier, Industry, IndustryClassification } from './industry-classifier';
import { roleDetector, UserRole, RoleClassification } from './role-detector';
import { sophisticationScorer, SophisticationLevel, SophisticationScore } from './sophistication-scorer';
import { UserProfile } from '@/lib/types/agent-types';

/**
 * Comprehensive User Profile Detection System
 * Combines industry classification, role detection, and sophistication scoring
 */

export interface ProfileDetectionResult {
  profile: UserProfile;
  confidence: number;
  analysis: {
    industry: IndustryClassification;
    role: RoleClassification;
    sophistication: SophisticationScore;
  };
  recommendations: {
    agentType: string;
    communicationStyle: string;
    questioningDepth: string;
    assumptionTolerance: string;
  };
  uncertainties: string[];
}

export interface ProfileDetectionOptions {
  sessionId?: string;
  conversationHistory?: string[];
  previousProfile?: UserProfile;
  requireMinimumConfidence?: number;
  enableLearning?: boolean;
}

/**
 * Main profile detection orchestrator
 */
export class ProfileDetector {
  /**
   * Perform comprehensive profile detection
   */
  async detectProfile(
    input: string,
    options: ProfileDetectionOptions = {}
  ): Promise<ProfileDetectionResult> {
    const {
      sessionId,
      conversationHistory = [],
      previousProfile,
      requireMinimumConfidence = 0.6,
      enableLearning = true
    } = options;

    try {
      // Run all analyses in parallel for efficiency
      const [industryResult, roleResult] = await Promise.all([
        industryClassifier.classifyIndustry(input),
        roleDetector.detectRole(input, conversationHistory)
      ]);

      // Run sophistication scoring with context from previous analyses
      const sophisticationResult = await sophisticationScorer.scoreSophistication(input, {
        userRole: roleResult.role,
        industry: industryResult.industry,
        conversationHistory,
        previousScores: previousProfile ? [this.extractPreviousSophisticationScore(previousProfile)] : undefined
      });

      // Create comprehensive user profile
      const profile = this.buildUserProfile(
        industryResult,
        roleResult,
        sophisticationResult,
        sessionId,
        conversationHistory
      );

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(
        industryResult,
        roleResult,
        sophisticationResult
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        profile,
        industryResult,
        roleResult,
        sophisticationResult
      );

      // Identify uncertainties
      const uncertainties = this.identifyUncertainties(
        industryResult,
        roleResult,
        sophisticationResult,
        requireMinimumConfidence
      );

      // Update profile with learning if enabled
      if (enableLearning && previousProfile) {
        this.updateProfileWithLearning(profile, previousProfile, overallConfidence);
      }

      return {
        profile,
        confidence: overallConfidence,
        analysis: {
          industry: industryResult,
          role: roleResult,
          sophistication: sophisticationResult
        },
        recommendations,
        uncertainties
      };

    } catch (error) {
      console.error('Profile detection failed:', error);
      throw new Error(`Profile detection failed: ${error}`);
    }
  }

  /**
   * Build comprehensive user profile from individual analyses
   */
  private buildUserProfile(
    industry: IndustryClassification,
    role: RoleClassification,
    sophistication: SophisticationScore,
    sessionId?: string,
    conversationHistory: string[] = []
  ): UserProfile {
    const now = new Date();

    return {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      
      // Industry Classification
      industry: industry.industry,
      industryConfidence: industry.confidence,
      subIndustry: industry.subIndustry,
      
      // Role Classification
      role: role.role,
      roleConfidence: role.confidence,
      roleDetails: this.extractRoleDetails(role),
      
      // Sophistication Level
      sophisticationLevel: sophistication.level,
      sophisticationScore: sophistication.score,
      
      // Context and History
      conversationHistory: conversationHistory.map((content, index) => ({
        id: `msg-${index}`,
        content,
        timestamp: new Date(now.getTime() - (conversationHistory.length - index) * 60000), // Approximate timestamps
        type: 'user',
        metadata: {}
      })),
      detectedKeywords: this.extractAllKeywords(industry, role, sophistication),
      terminology: this.extractTerminology(industry, role, sophistication),
      
      // Preferences
      preferredCommunicationStyle: this.determineCommunicationStyle(role, sophistication),
      assumptionTolerance: this.determineAssumptionTolerance(sophistication, role),
      
      // Metadata
      created: now,
      lastUpdated: now,
      analysisVersion: '1.0'
    };
  }

  /**
   * Calculate overall confidence from individual analysis confidences
   */
  private calculateOverallConfidence(
    industry: IndustryClassification,
    role: RoleClassification,
    sophistication: SophisticationScore
  ): number {
    // Weighted average of confidences
    const weights = {
      industry: 0.35,
      role: 0.35,
      sophistication: 0.30
    };

    const weightedSum = 
      industry.confidence * weights.industry +
      role.confidence * weights.role +
      sophistication.confidence * weights.sophistication;

    // Apply bonus for agreement between analyses
    let agreementBonus = 0;
    
    // Bonus if role and industry make sense together
    if (this.isRoleIndustryMatch(role.role, industry.industry)) {
      agreementBonus += 0.05;
    }
    
    // Bonus if sophistication matches role expectations
    if (this.isSophisticationRoleMatch(sophistication.level, role.role)) {
      agreementBonus += 0.05;
    }

    // Penalty for very low individual confidences
    const minConfidence = Math.min(industry.confidence, role.confidence, sophistication.confidence);
    let confidencePenalty = 0;
    if (minConfidence < 0.3) {
      confidencePenalty = 0.1;
    }

    return Math.max(0, Math.min(1, weightedSum + agreementBonus - confidencePenalty));
  }

  /**
   * Generate actionable recommendations based on profile
   */
  private generateRecommendations(
    profile: UserProfile,
    industry: IndustryClassification,
    role: RoleClassification,
    sophistication: SophisticationScore
  ) {
    const recommendations = {
      agentType: this.recommendAgentType(profile),
      communicationStyle: this.recommendCommunicationStyle(profile),
      questioningDepth: this.recommendQuestioningDepth(profile),
      assumptionTolerance: this.recommendAssumptionTolerance(profile)
    };

    return recommendations;
  }

  /**
   * Identify areas of uncertainty in the profile
   */
  private identifyUncertainties(
    industry: IndustryClassification,
    role: RoleClassification,
    sophistication: SophisticationScore,
    minimumConfidence: number
  ): string[] {
    const uncertainties: string[] = [];

    if (industry.confidence < minimumConfidence) {
      uncertainties.push(`Industry classification uncertain (${(industry.confidence * 100).toFixed(1)}% confidence)`);
    }

    if (role.confidence < minimumConfidence) {
      uncertainties.push(`Role classification uncertain (${(role.confidence * 100).toFixed(1)}% confidence)`);
    }

    if (sophistication.confidence < minimumConfidence) {
      uncertainties.push(`Sophistication assessment uncertain (${(sophistication.confidence * 100).toFixed(1)}% confidence)`);
    }

    // Check for conflicting signals
    if (!this.isRoleIndustryMatch(role.role, industry.industry)) {
      uncertainties.push('Role and industry combination seems unusual');
    }

    if (role.alternativeRoles.length > 0 && role.alternativeRoles[0].confidence > 0.4) {
      uncertainties.push(`Alternative role possible: ${role.alternativeRoles[0].role} (${(role.alternativeRoles[0].confidence * 100).toFixed(1)}%)`);
    }

    if (industry.alternativeIndustries.length > 0 && industry.alternativeIndustries[0].confidence > 0.3) {
      uncertainties.push(`Alternative industry possible: ${industry.alternativeIndustries[0].industry} (${(industry.alternativeIndustries[0].confidence * 100).toFixed(1)}%)`);
    }

    return uncertainties;
  }

  /**
   * Update profile with learning from previous interactions
   */
  private updateProfileWithLearning(
    newProfile: UserProfile,
    previousProfile: UserProfile,
    newConfidence: number
  ): void {
    // If new confidence is lower, blend with previous profile
    if (newConfidence < 0.8 && previousProfile.sophisticationScore) {
      // Weighted average of sophistication scores
      const weight = newConfidence;
      newProfile.sophisticationScore = Math.round(
        newProfile.sophisticationScore * weight + 
        previousProfile.sophisticationScore * (1 - weight)
      );
    }

    // Accumulate terminology from previous sessions
    const combinedTerminology = new Set([...newProfile.terminology, ...previousProfile.terminology]);
    newProfile.terminology = Array.from(combinedTerminology).slice(0, 50); // Keep top 50 terms

    // Update conversation history
    newProfile.conversationHistory = [
      ...(previousProfile.conversationHistory || []).slice(-10), // Keep last 10 messages
      ...newProfile.conversationHistory
    ];
  }

  // Helper methods for profile building

  private extractRoleDetails(role: RoleClassification): string {
    const reasoning = role.reasoning || 'No reasoning provided';
    return `${role.role} (${(role.confidence * 100).toFixed(1)}% confidence) - ${reasoning.slice(0, 100)}...`;
  }

  private extractAllKeywords(
    industry: IndustryClassification,
    role: RoleClassification,
    sophistication: SophisticationScore
  ): string[] {
    return [
      ...industry.keywords,
      ...Object.values(role.indicators).flat(),
      ...Object.values(sophistication.indicators).flat()
    ].slice(0, 30); // Keep top 30 keywords
  }

  private extractTerminology(
    industry: IndustryClassification,
    role: RoleClassification,
    sophistication: SophisticationScore
  ): string[] {
    const terminology = new Set<string>();

    // Add industry-specific terms
    industry.keywords.forEach(keyword => terminology.add(keyword));
    
    // Add role-specific terms
    Object.values(role.indicators).flat().forEach(term => terminology.add(term));
    
    // Add sophistication indicators
    sophistication.indicators.advanced.forEach(term => terminology.add(term));
    sophistication.indicators.intermediate.forEach(term => terminology.add(term));

    return Array.from(terminology).slice(0, 25);
  }

  private determineCommunicationStyle(
    role: RoleClassification,
    sophistication: SophisticationScore
  ): 'formal' | 'casual' | 'technical' {
    if (role.role === UserRole.TECHNICAL && sophistication.level === SophisticationLevel.HIGH) {
      return 'technical';
    }
    
    if (sophistication.level === SophisticationLevel.HIGH) {
      return 'formal';
    }
    
    return 'casual';
  }

  private determineAssumptionTolerance(
    sophistication: SophisticationScore,
    role: RoleClassification
  ): 'low' | 'medium' | 'high' {
    // High sophistication users typically prefer fewer assumptions
    if (sophistication.level === SophisticationLevel.HIGH) {
      return 'low';
    }
    
    // Business users often accept more assumptions for speed
    if (role.role === UserRole.BUSINESS && sophistication.level === SophisticationLevel.MEDIUM) {
      return 'high';
    }
    
    return 'medium';
  }

  private recommendAgentType(profile: UserProfile): string {
    if (profile.industry === Industry.FINTECH) {
      return profile.role === UserRole.TECHNICAL ? 'fintech-technical' : 'fintech-business';
    }
    
    if (profile.industry === Industry.HEALTHCARE) {
      return profile.role === UserRole.TECHNICAL ? 'healthcare-technical' : 'healthcare-business';
    }
    
    if (profile.sophisticationLevel === SophisticationLevel.HIGH) {
      return `${profile.industry}-expert`;
    }
    
    return `${profile.industry}-general`;
  }

  private recommendCommunicationStyle(profile: UserProfile): string {
    return `Use ${profile.preferredCommunicationStyle} tone with ${profile.sophisticationLevel} complexity terminology`;
  }

  private recommendQuestioningDepth(profile: UserProfile): string {
    if (profile.sophisticationLevel === SophisticationLevel.HIGH) {
      return 'detailed';
    } else if (profile.sophisticationLevel === SophisticationLevel.MEDIUM) {
      return 'moderate';
    }
    return 'basic';
  }

  private recommendAssumptionTolerance(profile: UserProfile): string {
    return `${profile.assumptionTolerance} tolerance for assumptions`;
  }

  private isRoleIndustryMatch(role: UserRole, industry: Industry): boolean {
    // Define expected role-industry combinations
    const expectedCombinations = {
      [Industry.FINTECH]: [UserRole.TECHNICAL, UserRole.BUSINESS, UserRole.HYBRID],
      [Industry.HEALTHCARE]: [UserRole.BUSINESS, UserRole.TECHNICAL, UserRole.HYBRID],
      [Industry.SAAS]: [UserRole.TECHNICAL, UserRole.HYBRID],
      [Industry.ECOMMERCE]: [UserRole.BUSINESS, UserRole.HYBRID],
      [Industry.CONSUMER]: [UserRole.BUSINESS, UserRole.HYBRID, UserRole.TECHNICAL],
      [Industry.ENTERPRISE]: [UserRole.BUSINESS, UserRole.TECHNICAL],
      [Industry.GENERAL]: [UserRole.BUSINESS, UserRole.TECHNICAL, UserRole.HYBRID]
    };

    return expectedCombinations[industry]?.includes(role) ?? true;
  }

  private isSophisticationRoleMatch(sophistication: SophisticationLevel, role: UserRole): boolean {
    // Technical roles typically have higher sophistication
    if (role === UserRole.TECHNICAL && sophistication === SophisticationLevel.LOW) {
      return false;
    }
    
    // Generally expect some minimum sophistication for professional roles
    return true;
  }

  private extractPreviousSophisticationScore(profile: UserProfile): SophisticationScore {
    return {
      level: profile.sophisticationLevel as SophisticationLevel,
      score: profile.sophisticationScore,
      confidence: 0.8, // Assume reasonable confidence for previous assessment
      reasoning: 'Previous session assessment',
      factors: {
        vocabularyComplexity: profile.sophisticationScore,
        domainExpertise: profile.sophisticationScore,
        conceptualDepth: profile.sophisticationScore,
        professionalTerminology: profile.sophisticationScore,
        communicationClarity: profile.sophisticationScore
      },
      indicators: {
        advanced: profile.terminology.slice(0, 5),
        intermediate: profile.terminology.slice(5, 10),
        basic: []
      },
      recommendations: []
    };
  }

  /**
   * Batch profile detection for multiple inputs
   */
  async batchDetectProfiles(
    inputs: Array<{ text: string; options?: ProfileDetectionOptions }>
  ): Promise<ProfileDetectionResult[]> {
    const results: ProfileDetectionResult[] = [];
    
    for (const input of inputs) {
      try {
        const result = await this.detectProfile(input.text, input.options);
        results.push(result);
        
        // Small delay for rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Batch profile detection failed for input: ${input.text}`, error);
      }
    }
    
    return results;
  }

  /**
   * Quick profile validation
   */
  validateProfile(profile: UserProfile, minimumConfidence: number = 0.6): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check confidence levels
    if (profile.industryConfidence < minimumConfidence) {
      issues.push('Low industry classification confidence');
      suggestions.push('Gather more industry-specific information');
    }

    if (profile.roleConfidence < minimumConfidence) {
      issues.push('Low role classification confidence');
      suggestions.push('Ask about technical vs business background');
    }

    // Check for consistency
    if (!this.isRoleIndustryMatch(profile.role as UserRole, profile.industry as Industry)) {
      issues.push('Role-industry combination seems unusual');
      suggestions.push('Verify role and industry classification');
    }

    // Check for sufficient terminology
    if (profile.terminology.length < 5) {
      issues.push('Limited terminology detected');
      suggestions.push('Encourage more detailed descriptions');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Singleton instance for global use
export const profileDetector = new ProfileDetector(); 