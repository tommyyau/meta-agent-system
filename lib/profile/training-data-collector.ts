import { UserProfile } from '@/lib/types/agent-types';
import { Industry, IndustryClassification } from './industry-classifier';
import { UserRole, RoleClassification } from './role-detector';
import { SophisticationLevel, SophisticationScore } from './sophistication-scorer';
import { ProfileCorrection } from './profile-correction';

/**
 * Training Data Collection Framework
 * Collects, manages, and analyzes training data to improve profile detection accuracy
 */

export interface TrainingDataPoint {
  id: string;
  input: string;
  groundTruth: {
    industry: Industry;
    role: UserRole;
    sophisticationLevel: SophisticationLevel;
    keywords: string[];
    context?: string;
  };
  predictions: {
    industry: IndustryClassification;
    role: RoleClassification;
    sophistication: SophisticationScore;
  };
  source: TrainingDataSource;
  quality: DataQuality;
  metadata: {
    sessionId?: string;
    timestamp: Date;
    correctionApplied: boolean;
    userVerified: boolean;
    confidenceScore: number;
  };
}

export enum TrainingDataSource {
  USER_CORRECTION = 'user_correction',
  EXPERT_ANNOTATION = 'expert_annotation',
  AUTOMATED_COLLECTION = 'automated_collection',
  SYNTHETIC_GENERATION = 'synthetic_generation',
  CROWDSOURCING = 'crowdsourcing'
}

export enum DataQuality {
  HIGH = 'high',      // Expert verified or user corrected
  MEDIUM = 'medium',  // System confident or partially verified
  LOW = 'low',        // Automated collection only
  UNCERTAIN = 'uncertain' // Conflicting signals
}

export interface TrainingDataStats {
  totalDataPoints: number;
  sourceDistribution: Record<TrainingDataSource, number>;
  qualityDistribution: Record<DataQuality, number>;
  industryDistribution: Record<Industry, number>;
  roleDistribution: Record<UserRole, number>;
  sophisticationDistribution: Record<SophisticationLevel, number>;
  accuracyMetrics: {
    industry: number;
    role: number;
    sophistication: number;
    overall: number;
  };
  dataGaps: {
    underrepresentedIndustries: Industry[];
    underrepresentedRoles: UserRole[];
    qualityIssues: string[];
  };
}

export interface DataCollectionConfig {
  enableAutomaticCollection: boolean;
  minimumConfidenceThreshold: number;
  maxDataPointsPerSession: number;
  collectOnlyCorrections: boolean;
  anonymizeData: boolean;
  retentionPeriodDays: number;
}

/**
 * Main training data collection and management system
 */
export class TrainingDataCollector {
  private trainingData: Map<string, TrainingDataPoint> = new Map();
  private config: DataCollectionConfig;

  constructor(config: Partial<DataCollectionConfig> = {}) {
    this.config = {
      enableAutomaticCollection: true,
      minimumConfidenceThreshold: 0.7,
      maxDataPointsPerSession: 10,
      collectOnlyCorrections: false,
      anonymizeData: true,
      retentionPeriodDays: 365,
      ...config
    };
  }

  /**
   * Collect training data from profile detection results
   */
  async collectFromDetection(
    input: string,
    predictions: {
      industry: IndustryClassification;
      role: RoleClassification;
      sophistication: SophisticationScore;
    },
    sessionId?: string,
    userVerified: boolean = false
  ): Promise<TrainingDataPoint | null> {
    if (!this.config.enableAutomaticCollection && !userVerified) {
      return null;
    }

    // Check confidence threshold
    const avgConfidence = (
      predictions.industry.confidence +
      predictions.role.confidence +
      predictions.sophistication.confidence
    ) / 3;

    if (avgConfidence < this.config.minimumConfidenceThreshold && !userVerified) {
      return null;
    }

    // Create training data point
    const dataPoint: TrainingDataPoint = {
      id: `training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      input: this.config.anonymizeData ? this.anonymizeInput(input) : input,
      groundTruth: {
        industry: predictions.industry.industry,
        role: predictions.role.role,
        sophisticationLevel: predictions.sophistication.level,
        keywords: [
          ...predictions.industry.keywords,
          ...Object.values(predictions.role.indicators).flat(),
          ...Object.values(predictions.sophistication.indicators).flat()
        ].slice(0, 20),
        context: sessionId ? `Session: ${sessionId}` : undefined
      },
      predictions,
      source: userVerified ? TrainingDataSource.EXPERT_ANNOTATION : TrainingDataSource.AUTOMATED_COLLECTION,
      quality: this.determineDataQuality(predictions, userVerified, avgConfidence),
      metadata: {
        sessionId,
        timestamp: new Date(),
        correctionApplied: false,
        userVerified,
        confidenceScore: avgConfidence
      }
    };

    // Store the data point
    this.trainingData.set(dataPoint.id, dataPoint);

    return dataPoint;
  }

  /**
   * Collect training data from user corrections
   */
  async collectFromCorrection(
    input: string,
    originalPredictions: any,
    correction: ProfileCorrection,
    sessionId?: string
  ): Promise<TrainingDataPoint> {
    // Extract corrected ground truth
    const groundTruth = this.extractGroundTruthFromCorrection(
      originalPredictions,
      correction
    );

    const dataPoint: TrainingDataPoint = {
      id: `correction-${correction.id}`,
      input: this.config.anonymizeData ? this.anonymizeInput(input) : input,
      groundTruth,
      predictions: originalPredictions,
      source: TrainingDataSource.USER_CORRECTION,
      quality: DataQuality.HIGH, // User corrections are high quality
      metadata: {
        sessionId,
        timestamp: new Date(),
        correctionApplied: true,
        userVerified: true,
        confidenceScore: correction.confidence
      }
    };

    this.trainingData.set(dataPoint.id, dataPoint);

    return dataPoint;
  }

  /**
   * Generate synthetic training data for underrepresented categories
   */
  async generateSyntheticData(
    targetIndustry: Industry,
    targetRole: UserRole,
    targetSophistication: SophisticationLevel,
    count: number = 5
  ): Promise<TrainingDataPoint[]> {
    const syntheticData: TrainingDataPoint[] = [];

    // Templates for synthetic data generation
    const templates = this.getSyntheticTemplates(targetIndustry, targetRole, targetSophistication);

    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const template = templates[i];
      
      const dataPoint: TrainingDataPoint = {
        id: `synthetic-${Date.now()}-${i}`,
        input: template.input,
        groundTruth: {
          industry: targetIndustry,
          role: targetRole,
          sophisticationLevel: targetSophistication,
          keywords: template.keywords,
          context: 'Synthetic generation'
        },
        predictions: {
          industry: {
            industry: targetIndustry,
            confidence: 0.95,
            reasoning: 'Synthetic data',
            keywords: template.keywords,
            alternativeIndustries: []
          },
          role: {
            role: targetRole,
            confidence: 0.95,
            reasoning: 'Synthetic data',
            indicators: { technical: [], business: [], hybrid: [] },
            sophisticationLevel: targetSophistication,
            alternativeRoles: []
          },
          sophistication: {
            level: targetSophistication,
            score: this.sophisticationLevelToScore(targetSophistication),
            confidence: 0.95,
            reasoning: 'Synthetic data',
            factors: {
              vocabularyComplexity: 80,
              domainExpertise: 80,
              conceptualDepth: 80,
              professionalTerminology: 80,
              communicationClarity: 80
            },
            indicators: { advanced: [], intermediate: [], basic: [] },
            recommendations: []
          }
        },
        source: TrainingDataSource.SYNTHETIC_GENERATION,
        quality: DataQuality.MEDIUM,
        metadata: {
          timestamp: new Date(),
          correctionApplied: false,
          userVerified: false,
          confidenceScore: 0.95
        }
      };

      syntheticData.push(dataPoint);
      this.trainingData.set(dataPoint.id, dataPoint);
    }

    return syntheticData;
  }

  /**
   * Export training data in various formats
   */
  exportTrainingData(
    format: 'json' | 'csv' | 'jsonl' = 'json',
    filters?: {
      source?: TrainingDataSource[];
      quality?: DataQuality[];
      industry?: Industry[];
      role?: UserRole[];
      dateRange?: { start: Date; end: Date };
    }
  ): string {
    let filteredData = Array.from(this.trainingData.values());

    // Apply filters
    if (filters) {
      if (filters.source) {
        filteredData = filteredData.filter(d => filters.source!.includes(d.source));
      }
      if (filters.quality) {
        filteredData = filteredData.filter(d => filters.quality!.includes(d.quality));
      }
      if (filters.industry) {
        filteredData = filteredData.filter(d => filters.industry!.includes(d.groundTruth.industry));
      }
      if (filters.role) {
        filteredData = filteredData.filter(d => filters.role!.includes(d.groundTruth.role));
      }
      if (filters.dateRange) {
        filteredData = filteredData.filter(d => 
          d.metadata.timestamp >= filters.dateRange!.start &&
          d.metadata.timestamp <= filters.dateRange!.end
        );
      }
    }

    switch (format) {
      case 'csv':
        return this.exportAsCSV(filteredData);
      case 'jsonl':
        return this.exportAsJSONL(filteredData);
      default:
        return JSON.stringify(filteredData, null, 2);
    }
  }

  /**
   * Get training data statistics and insights
   */
  getTrainingDataStats(): TrainingDataStats {
    const data = Array.from(this.trainingData.values());
    
    // Distribution calculations
    const sourceDistribution = this.calculateDistribution(data, d => d.source);
    const qualityDistribution = this.calculateDistribution(data, d => d.quality);
    const industryDistribution = this.calculateDistribution(data, d => d.groundTruth.industry);
    const roleDistribution = this.calculateDistribution(data, d => d.groundTruth.role);
    const sophisticationDistribution = this.calculateDistribution(data, d => d.groundTruth.sophisticationLevel);

    // Accuracy metrics
    const accuracyMetrics = this.calculateAccuracyMetrics(data);

    // Data gaps analysis
    const dataGaps = this.analyzeDataGaps(data);

    return {
      totalDataPoints: data.length,
      sourceDistribution,
      qualityDistribution,
      industryDistribution,
      roleDistribution,
      sophisticationDistribution,
      accuracyMetrics,
      dataGaps
    };
  }

  /**
   * Validate training data quality
   */
  validateDataQuality(): {
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      affectedDataPoints: string[];
    }>;
    recommendations: string[];
  } {
    const issues: any[] = [];
    const recommendations: string[] = [];
    const data = Array.from(this.trainingData.values());

    // Check for imbalanced data
    const industryDistribution = this.calculateDistribution(data, d => d.groundTruth.industry);
    const maxCount = Math.max(...Object.values(industryDistribution));
    const minCount = Math.min(...Object.values(industryDistribution));
    
    if (maxCount / Math.max(minCount, 1) > 5) {
      issues.push({
        type: 'data_imbalance',
        severity: 'medium' as const,
        description: 'Significant imbalance in industry distribution',
        affectedDataPoints: []
      });
      recommendations.push('Generate more synthetic data for underrepresented industries');
    }

    // Check for low quality data
    const lowQualityCount = data.filter(d => d.quality === DataQuality.LOW).length;
    if (lowQualityCount / data.length > 0.5) {
      issues.push({
        type: 'low_quality',
        severity: 'high' as const,
        description: 'More than 50% of data points are low quality',
        affectedDataPoints: data.filter(d => d.quality === DataQuality.LOW).map(d => d.id)
      });
      recommendations.push('Increase user verification and expert annotation');
    }

    // Check for insufficient data
    if (data.length < 100) {
      issues.push({
        type: 'insufficient_data',
        severity: 'high' as const,
        description: 'Insufficient training data for reliable model training',
        affectedDataPoints: []
      });
      recommendations.push('Collect more training data across all categories');
    }

    return { issues, recommendations };
  }

  /**
   * Clean up old training data based on retention policy
   */
  cleanupOldData(): number {
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriodDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [id, dataPoint] of this.trainingData.entries()) {
      if (dataPoint.metadata.timestamp < cutoffDate && dataPoint.quality === DataQuality.LOW) {
        this.trainingData.delete(id);
        removedCount++;
      }
    }

    return removedCount;
  }

  // Helper methods

  private determineDataQuality(
    predictions: any,
    userVerified: boolean,
    avgConfidence: number
  ): DataQuality {
    if (userVerified) return DataQuality.HIGH;
    if (avgConfidence > 0.8) return DataQuality.MEDIUM;
    if (avgConfidence > 0.6) return DataQuality.LOW;
    return DataQuality.UNCERTAIN;
  }

  private anonymizeInput(input: string): string {
    // Simple anonymization - replace potential PII
    return input
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
      .replace(/\bhttps?:\/\/[^\s]+\b/g, '[URL]');
  }

  private extractGroundTruthFromCorrection(originalPredictions: any, correction: ProfileCorrection) {
    const groundTruth = {
      industry: originalPredictions.industry.industry,
      role: originalPredictions.role.role,
      sophisticationLevel: originalPredictions.sophistication.level,
      keywords: originalPredictions.industry.keywords || [],
      context: `Corrected by user: ${correction.correctionType}`
    };

    // Apply the correction
    switch (correction.correctionType) {
      case 'industry':
        groundTruth.industry = correction.correctedValue;
        break;
      case 'role':
        groundTruth.role = correction.correctedValue;
        break;
      case 'sophistication':
        groundTruth.sophisticationLevel = correction.correctedValue;
        break;
    }

    return groundTruth;
  }

  private getSyntheticTemplates(industry: Industry, role: UserRole, sophistication: SophisticationLevel) {
    // This would typically load from a template database
    // For now, returning simple templates
    const templates = [
      {
        input: `Building a ${industry} solution with ${role} perspective for ${sophistication} users`,
        keywords: [industry, role, sophistication]
      }
    ];

    return templates;
  }

  private sophisticationLevelToScore(level: SophisticationLevel): number {
    switch (level) {
      case SophisticationLevel.HIGH: return 85;
      case SophisticationLevel.MEDIUM: return 60;
      case SophisticationLevel.LOW: return 25;
      default: return 50;
    }
  }

  private calculateDistribution<T>(data: TrainingDataPoint[], extractor: (d: TrainingDataPoint) => T): Record<string, number> {
    const distribution: Record<string, number> = {};
    data.forEach(point => {
      const key = String(extractor(point));
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return distribution;
  }

  private calculateAccuracyMetrics(data: TrainingDataPoint[]) {
    let industryAccurate = 0;
    let roleAccurate = 0;
    let sophisticationAccurate = 0;

    data.forEach(point => {
      if (point.predictions.industry.industry === point.groundTruth.industry) {
        industryAccurate++;
      }
      if (point.predictions.role.role === point.groundTruth.role) {
        roleAccurate++;
      }
      if (point.predictions.sophistication.level === point.groundTruth.sophisticationLevel) {
        sophisticationAccurate++;
      }
    });

    const total = Math.max(data.length, 1);
    return {
      industry: industryAccurate / total,
      role: roleAccurate / total,
      sophistication: sophisticationAccurate / total,
      overall: (industryAccurate + roleAccurate + sophisticationAccurate) / (total * 3)
    };
  }

  private analyzeDataGaps(data: TrainingDataPoint[]) {
    const industryDistribution = this.calculateDistribution(data, d => d.groundTruth.industry);
    const roleDistribution = this.calculateDistribution(data, d => d.groundTruth.role);
    
    const avgIndustryCount = Object.values(industryDistribution).reduce((a, b) => a + b, 0) / Object.keys(industryDistribution).length;
    const avgRoleCount = Object.values(roleDistribution).reduce((a, b) => a + b, 0) / Object.keys(roleDistribution).length;

    const underrepresentedIndustries = Object.entries(industryDistribution)
      .filter(([, count]) => count < avgIndustryCount * 0.5)
      .map(([industry]) => industry as Industry);

    const underrepresentedRoles = Object.entries(roleDistribution)
      .filter(([, count]) => count < avgRoleCount * 0.5)
      .map(([role]) => role as UserRole);

    const qualityIssues: string[] = [];
    const lowQualityRatio = data.filter(d => d.quality === DataQuality.LOW).length / Math.max(data.length, 1);
    if (lowQualityRatio > 0.4) {
      qualityIssues.push('High proportion of low-quality data points');
    }

    return {
      underrepresentedIndustries,
      underrepresentedRoles,
      qualityIssues
    };
  }

  private exportAsCSV(data: TrainingDataPoint[]): string {
    const headers = [
      'id', 'input', 'industry', 'role', 'sophistication', 'source', 'quality',
      'timestamp', 'confidence', 'user_verified'
    ];

    const rows = data.map(point => [
      point.id,
      `"${point.input.replace(/"/g, '""')}"`,
      point.groundTruth.industry,
      point.groundTruth.role,
      point.groundTruth.sophisticationLevel,
      point.source,
      point.quality,
      point.metadata.timestamp.toISOString(),
      point.metadata.confidenceScore,
      point.metadata.userVerified
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private exportAsJSONL(data: TrainingDataPoint[]): string {
    return data.map(point => JSON.stringify(point)).join('\n');
  }
}

// Singleton instance for global use
export const trainingDataCollector = new TrainingDataCollector(); 