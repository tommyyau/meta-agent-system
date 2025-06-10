import { UserProfile } from '@/lib/types/agent-types';
import { Industry } from './industry-classifier';
import { UserRole } from './role-detector';
import { SophisticationLevel } from './sophistication-scorer';

/**
 * Profile Correction System
 * Allows users to provide feedback and corrections to improve profile accuracy
 */

export enum CorrectionType {
  INDUSTRY = 'industry',
  ROLE = 'role',
  SOPHISTICATION = 'sophistication',
  TERMINOLOGY = 'terminology',
  COMMUNICATION_STYLE = 'communication_style',
  ASSUMPTION_TOLERANCE = 'assumption_tolerance'
}

export interface ProfileCorrection {
  id: string;
  sessionId: string;
  profileId: string;
  correctionType: CorrectionType;
  originalValue: any;
  correctedValue: any;
  userFeedback?: string;
  confidence: number; // User's confidence in the correction (0-1)
  timestamp: Date;
  applied: boolean;
  impact?: CorrectionImpact;
}

export interface CorrectionImpact {
  agentBehaviorChanges: string[];
  questioningAdjustments: string[];
  communicationStyleChanges: string[];
  assumptionAdjustments: string[];
}

export interface ProfileCorrectionRequest {
  sessionId: string;
  profileId: string;
  corrections: {
    industry?: Industry;
    role?: UserRole;
    sophisticationLevel?: SophisticationLevel;
    terminology?: string[];
    communicationStyle?: 'formal' | 'casual' | 'technical';
    assumptionTolerance?: 'low' | 'medium' | 'high';
  };
  feedback?: string;
  confidence?: number;
}

export interface CorrectionValidation {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  confidence: number;
}

/**
 * Profile correction manager
 */
export class ProfileCorrectionManager {
  private corrections: Map<string, ProfileCorrection[]> = new Map();
  private learningData: Map<string, any[]> = new Map();

  /**
   * Apply user corrections to a profile
   */
  async applyCorrections(
    profile: UserProfile,
    correctionRequest: ProfileCorrectionRequest
  ): Promise<{
    updatedProfile: UserProfile;
    corrections: ProfileCorrection[];
    impact: CorrectionImpact;
  }> {
    const corrections: ProfileCorrection[] = [];
    const updatedProfile = { ...profile };
    let overallImpact: CorrectionImpact = {
      agentBehaviorChanges: [],
      questioningAdjustments: [],
      communicationStyleChanges: [],
      assumptionAdjustments: []
    };

    // Process each correction
    for (const [field, newValue] of Object.entries(correctionRequest.corrections)) {
      if (newValue !== undefined) {
        const correction = await this.createCorrection(
          profile,
          field as keyof typeof correctionRequest.corrections,
          newValue,
          correctionRequest
        );

        if (correction) {
          corrections.push(correction);
          
          // Apply the correction
          const { updatedField, impact } = this.applySingleCorrection(
            updatedProfile,
            correction
          );
          
          // Merge impacts
          overallImpact = this.mergeImpacts(overallImpact, impact);
          
          // Store for learning
          this.storeCorrectionForLearning(correction);
        }
      }
    }

    // Update profile metadata
    updatedProfile.lastUpdated = new Date();
    
    // Store corrections
    this.storeCorrections(profile.sessionId || 'default', corrections);

    return {
      updatedProfile,
      corrections,
      impact: overallImpact
    };
  }

  /**
   * Create a correction record
   */
  private async createCorrection(
    profile: UserProfile,
    field: keyof ProfileCorrectionRequest['corrections'],
    newValue: any,
    request: ProfileCorrectionRequest
  ): Promise<ProfileCorrection | null> {
    let originalValue: any;
    let correctionType: CorrectionType;

    // Map field to correction type and get original value
    switch (field) {
      case 'industry':
        originalValue = profile.industry;
        correctionType = CorrectionType.INDUSTRY;
        break;
      case 'role':
        originalValue = profile.role;
        correctionType = CorrectionType.ROLE;
        break;
      case 'sophisticationLevel':
        originalValue = profile.sophisticationLevel;
        correctionType = CorrectionType.SOPHISTICATION;
        break;
      case 'terminology':
        originalValue = profile.terminology;
        correctionType = CorrectionType.TERMINOLOGY;
        break;
      case 'communicationStyle':
        originalValue = profile.preferredCommunicationStyle;
        correctionType = CorrectionType.COMMUNICATION_STYLE;
        break;
      case 'assumptionTolerance':
        originalValue = profile.assumptionTolerance;
        correctionType = CorrectionType.ASSUMPTION_TOLERANCE;
        break;
      default:
        return null;
    }

    // Skip if no change
    if (this.valuesEqual(originalValue, newValue)) {
      return null;
    }

    const correction: ProfileCorrection = {
      id: `correction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: request.sessionId,
      profileId: request.profileId,
      correctionType,
      originalValue,
      correctedValue: newValue,
      userFeedback: request.feedback,
      confidence: request.confidence || 0.8,
      timestamp: new Date(),
      applied: false
    };

    // Calculate impact
    correction.impact = await this.calculateCorrectionImpact(correction, profile);

    return correction;
  }

  /**
   * Apply a single correction to a profile
   */
  private applySingleCorrection(
    profile: UserProfile,
    correction: ProfileCorrection
  ): { updatedField: any; impact: CorrectionImpact } {
    let impact: CorrectionImpact = {
      agentBehaviorChanges: [],
      questioningAdjustments: [],
      communicationStyleChanges: [],
      assumptionAdjustments: []
    };

    switch (correction.correctionType) {
      case CorrectionType.INDUSTRY:
        profile.industry = correction.correctedValue;
        profile.industryConfidence = Math.min(1.0, profile.industryConfidence + 0.2);
        impact.agentBehaviorChanges.push(`Switched to ${correction.correctedValue}-specific agent behavior`);
        impact.questioningAdjustments.push(`Adapted questions for ${correction.correctedValue} domain`);
        break;

      case CorrectionType.ROLE:
        profile.role = correction.correctedValue;
        profile.roleConfidence = Math.min(1.0, profile.roleConfidence + 0.2);
        impact.communicationStyleChanges.push(`Adjusted for ${correction.correctedValue} role perspective`);
        impact.questioningAdjustments.push(`Tailored questions for ${correction.correctedValue} background`);
        break;

      case CorrectionType.SOPHISTICATION:
        profile.sophisticationLevel = correction.correctedValue;
        const scoreMapping = { low: 25, medium: 60, high: 85 };
        profile.sophisticationScore = scoreMapping[correction.correctedValue as keyof typeof scoreMapping];
        impact.communicationStyleChanges.push(`Adjusted complexity for ${correction.correctedValue} sophistication`);
        impact.assumptionAdjustments.push(`Modified assumption tolerance for ${correction.correctedValue} level`);
        break;

      case CorrectionType.TERMINOLOGY:
        profile.terminology = correction.correctedValue;
        impact.agentBehaviorChanges.push('Updated domain terminology recognition');
        break;

      case CorrectionType.COMMUNICATION_STYLE:
        profile.preferredCommunicationStyle = correction.correctedValue;
        impact.communicationStyleChanges.push(`Switched to ${correction.correctedValue} communication style`);
        break;

      case CorrectionType.ASSUMPTION_TOLERANCE:
        profile.assumptionTolerance = correction.correctedValue;
        impact.assumptionAdjustments.push(`Adjusted assumption-making to ${correction.correctedValue} tolerance`);
        break;
    }

    correction.applied = true;
    return { updatedField: correction.correctedValue, impact };
  }

  /**
   * Calculate the impact of a correction
   */
  private async calculateCorrectionImpact(
    correction: ProfileCorrection,
    profile: UserProfile
  ): Promise<CorrectionImpact> {
    const impact: CorrectionImpact = {
      agentBehaviorChanges: [],
      questioningAdjustments: [],
      communicationStyleChanges: [],
      assumptionAdjustments: []
    };

    switch (correction.correctionType) {
      case CorrectionType.INDUSTRY:
        impact.agentBehaviorChanges.push(
          `Agent will use ${correction.correctedValue}-specific terminology and examples`,
          `Question banks will focus on ${correction.correctedValue} use cases`,
          `Assumption generation will align with ${correction.correctedValue} best practices`
        );
        break;

      case CorrectionType.ROLE:
        impact.questioningAdjustments.push(
          `Questions will target ${correction.correctedValue} perspective`,
          `Technical depth will be adjusted for ${correction.correctedValue} background`
        );
        impact.communicationStyleChanges.push(
          `Language will be tailored for ${correction.correctedValue} audience`
        );
        break;

      case CorrectionType.SOPHISTICATION:
        const level = correction.correctedValue;
        if (level === 'high') {
          impact.communicationStyleChanges.push('Will use advanced terminology and concepts');
          impact.assumptionAdjustments.push('Will make fewer assumptions, ask for specifics');
        } else if (level === 'low') {
          impact.communicationStyleChanges.push('Will use simpler language and provide more explanations');
          impact.assumptionAdjustments.push('Will make reasonable assumptions to speed up process');
        }
        break;

      case CorrectionType.COMMUNICATION_STYLE:
        impact.communicationStyleChanges.push(
          `All responses will use ${correction.correctedValue} tone and structure`
        );
        break;

      case CorrectionType.ASSUMPTION_TOLERANCE:
        const tolerance = correction.correctedValue;
        if (tolerance === 'high') {
          impact.assumptionAdjustments.push('Will make more assumptions to accelerate wireframe creation');
        } else if (tolerance === 'low') {
          impact.assumptionAdjustments.push('Will ask detailed questions before making any assumptions');
        }
        break;
    }

    return impact;
  }

  /**
   * Validate corrections before applying
   */
  validateCorrections(
    profile: UserProfile,
    request: ProfileCorrectionRequest
  ): CorrectionValidation {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    // Validate industry correction
    if (request.corrections.industry) {
      if (!Object.values(Industry).includes(request.corrections.industry)) {
        issues.push('Invalid industry value');
      }
    }

    // Validate role correction
    if (request.corrections.role) {
      if (!Object.values(UserRole).includes(request.corrections.role)) {
        issues.push('Invalid role value');
      }
    }

    // Validate sophistication level
    if (request.corrections.sophisticationLevel) {
      if (!Object.values(SophisticationLevel).includes(request.corrections.sophisticationLevel)) {
        issues.push('Invalid sophistication level');
      }
    }

    // Check for conflicting corrections
    if (request.corrections.role === UserRole.TECHNICAL && 
        request.corrections.sophisticationLevel === SophisticationLevel.LOW) {
      suggestions.push('Technical roles typically have medium to high sophistication levels');
      confidence *= 0.8;
    }

    // Validate terminology
    if (request.corrections.terminology) {
      if (!Array.isArray(request.corrections.terminology)) {
        issues.push('Terminology must be an array of strings');
      } else if (request.corrections.terminology.length > 50) {
        suggestions.push('Large terminology lists may affect performance');
        confidence *= 0.9;
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      confidence
    };
  }

  /**
   * Get correction suggestions based on profile analysis
   */
  getCorrectionSuggestions(profile: UserProfile): {
    suggestions: Array<{
      field: CorrectionType;
      currentValue: any;
      suggestedValue: any;
      reasoning: string;
      confidence: number;
    }>;
  } {
    const suggestions: any[] = [];

    // Suggest industry correction if confidence is low
    if (profile.industryConfidence < 0.6) {
      suggestions.push({
        field: CorrectionType.INDUSTRY,
        currentValue: profile.industry,
        suggestedValue: 'Please specify your industry',
        reasoning: 'Industry classification has low confidence',
        confidence: 0.3
      });
    }

    // Suggest role correction if confidence is low
    if (profile.roleConfidence < 0.6) {
      suggestions.push({
        field: CorrectionType.ROLE,
        currentValue: profile.role,
        suggestedValue: 'Please specify if you are technical, business, or hybrid',
        reasoning: 'Role classification has low confidence',
        confidence: 0.3
      });
    }

    // Suggest sophistication adjustment based on terminology
    if (profile.terminology.length < 5 && profile.sophisticationLevel === SophisticationLevel.HIGH) {
      suggestions.push({
        field: CorrectionType.SOPHISTICATION,
        currentValue: profile.sophisticationLevel,
        suggestedValue: SophisticationLevel.MEDIUM,
        reasoning: 'Limited terminology detected for high sophistication level',
        confidence: 0.7
      });
    }

    return { suggestions };
  }

  /**
   * Get correction history for a session
   */
  getCorrectionHistory(sessionId: string): ProfileCorrection[] {
    return this.corrections.get(sessionId) || [];
  }

  /**
   * Get learning insights from corrections
   */
  getLearningInsights(): {
    totalCorrections: number;
    mostCorrectedField: CorrectionType;
    commonMisclassifications: Array<{
      original: any;
      corrected: any;
      frequency: number;
    }>;
    accuracyTrends: {
      industry: number;
      role: number;
      sophistication: number;
    };
  } {
    const allCorrections = Array.from(this.corrections.values()).flat();
    
    // Count corrections by type
    const correctionCounts = new Map<CorrectionType, number>();
    allCorrections.forEach(correction => {
      correctionCounts.set(
        correction.correctionType,
        (correctionCounts.get(correction.correctionType) || 0) + 1
      );
    });

    const mostCorrectedField = Array.from(correctionCounts.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || CorrectionType.INDUSTRY;

    // Find common misclassifications
    const misclassifications = new Map<string, number>();
    allCorrections.forEach(correction => {
      const key = `${correction.originalValue}->${correction.correctedValue}`;
      misclassifications.set(key, (misclassifications.get(key) || 0) + 1);
    });

    const commonMisclassifications = Array.from(misclassifications.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, frequency]) => {
        const [original, corrected] = key.split('->');
        return { original, corrected, frequency };
      });

    // Calculate accuracy trends (simplified)
    const industryCorrections = allCorrections.filter(c => c.correctionType === CorrectionType.INDUSTRY).length;
    const roleCorrections = allCorrections.filter(c => c.correctionType === CorrectionType.ROLE).length;
    const sophisticationCorrections = allCorrections.filter(c => c.correctionType === CorrectionType.SOPHISTICATION).length;

    const totalSessions = this.corrections.size || 1;
    const accuracyTrends = {
      industry: Math.max(0, 1 - (industryCorrections / totalSessions)),
      role: Math.max(0, 1 - (roleCorrections / totalSessions)),
      sophistication: Math.max(0, 1 - (sophisticationCorrections / totalSessions))
    };

    return {
      totalCorrections: allCorrections.length,
      mostCorrectedField,
      commonMisclassifications,
      accuracyTrends
    };
  }

  // Helper methods

  private valuesEqual(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((val, i) => val === b[i]);
    }
    return a === b;
  }

  private mergeImpacts(impact1: CorrectionImpact, impact2: CorrectionImpact): CorrectionImpact {
    return {
      agentBehaviorChanges: [...impact1.agentBehaviorChanges, ...impact2.agentBehaviorChanges],
      questioningAdjustments: [...impact1.questioningAdjustments, ...impact2.questioningAdjustments],
      communicationStyleChanges: [...impact1.communicationStyleChanges, ...impact2.communicationStyleChanges],
      assumptionAdjustments: [...impact1.assumptionAdjustments, ...impact2.assumptionAdjustments]
    };
  }

  private storeCorrections(sessionId: string, corrections: ProfileCorrection[]): void {
    const existing = this.corrections.get(sessionId) || [];
    this.corrections.set(sessionId, [...existing, ...corrections]);
  }

  private storeCorrectionForLearning(correction: ProfileCorrection): void {
    const key = correction.correctionType;
    const existing = this.learningData.get(key) || [];
    this.learningData.set(key, [...existing, {
      from: correction.originalValue,
      to: correction.correctedValue,
      confidence: correction.confidence,
      timestamp: correction.timestamp
    }]);
  }
}

// Singleton instance for global use
export const profileCorrectionManager = new ProfileCorrectionManager(); 