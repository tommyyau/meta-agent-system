import { NextRequest, NextResponse } from 'next/server';
import { profileCorrectionManager } from '@/lib/profile/profile-correction';
import { trainingDataCollector } from '@/lib/profile/training-data-collector';

// POST: Apply user corrections to a profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, corrections, sessionId, feedback, confidence } = body;

    if (!profile || !corrections) {
      return NextResponse.json(
        { error: 'Profile and corrections are required' },
        { status: 400 }
      );
    }

    if (!profile.id) {
      return NextResponse.json(
        { error: 'Profile must have an ID' },
        { status: 400 }
      );
    }

    // Validate corrections
    const validation = profileCorrectionManager.validateCorrections(profile, {
      sessionId,
      profileId: profile.id,
      corrections,
      feedback,
      confidence
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid corrections',
          issues: validation.issues,
          suggestions: validation.suggestions
        },
        { status: 400 }
      );
    }

    // Apply corrections
    const result = await profileCorrectionManager.applyCorrections(profile, {
      sessionId,
      profileId: profile.id,
      corrections,
      feedback,
      confidence
    });

    // Collect training data from corrections
    const trainingDataPromises = result.corrections.map(async correction => {
      // We need the original input and predictions for training data
      // For now, we'll use placeholder data - in a real system this would come from the session
      const originalPredictions = {
        industry: {
          industry: profile.industry,
          confidence: profile.industryConfidence,
          reasoning: 'Original classification',
          keywords: profile.detectedKeywords || [],
          alternativeIndustries: []
        },
        role: {
          role: profile.role,
          confidence: profile.roleConfidence,
          reasoning: 'Original classification',
          indicators: { technical: [], business: [], hybrid: [] },
          sophisticationLevel: profile.sophisticationLevel,
          alternativeRoles: []
        },
        sophistication: {
          level: profile.sophisticationLevel,
          score: profile.sophisticationScore,
          confidence: 0.8,
          reasoning: 'Original assessment',
          factors: {
            vocabularyComplexity: profile.sophisticationScore,
            domainExpertise: profile.sophisticationScore,
            conceptualDepth: profile.sophisticationScore,
            professionalTerminology: profile.sophisticationScore,
            communicationClarity: profile.sophisticationScore
          },
          indicators: { advanced: [], intermediate: [], basic: [] },
          recommendations: []
        }
      };

      return trainingDataCollector.collectFromCorrection(
        feedback || 'User correction',
        originalPredictions,
        correction,
        sessionId
      );
    });

    await Promise.all(trainingDataPromises);

    return NextResponse.json({
      success: true,
      result: {
        updatedProfile: {
          ...result.updatedProfile,
          created: result.updatedProfile.created.toISOString(),
          lastUpdated: result.updatedProfile.lastUpdated.toISOString(),
          conversationHistory: result.updatedProfile.conversationHistory.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          }))
        },
        corrections: result.corrections.map(correction => ({
          ...correction,
          timestamp: correction.timestamp.toISOString()
        })),
        impact: result.impact
      },
      validation,
      metadata: {
        correctionsApplied: result.corrections.length,
        trainingDataCollected: result.corrections.length,
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('Profile correction failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Profile correction failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// GET: Get correction suggestions for a profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileData = searchParams.get('profile');
    const sessionId = searchParams.get('sessionId');

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required as query parameter' },
        { status: 400 }
      );
    }

    let profile;
    try {
      profile = JSON.parse(profileData);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid profile JSON format' },
        { status: 400 }
      );
    }

    // Get correction suggestions
    const suggestions = profileCorrectionManager.getCorrectionSuggestions(profile);

    // Get correction history if sessionId provided
    let correctionHistory: any[] = [];
    if (sessionId) {
      correctionHistory = profileCorrectionManager.getCorrectionHistory(sessionId);
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions.suggestions,
      correctionHistory: correctionHistory.map(correction => ({
        ...correction,
        timestamp: correction.timestamp.toISOString()
      })),
      metadata: {
        totalSuggestions: suggestions.suggestions.length,
        totalPreviousCorrections: correctionHistory.length
      }
    });

  } catch (error) {
    console.error('Failed to get correction suggestions:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// PUT: Get learning insights from correction history
export async function PUT(request: NextRequest) {
  try {
    const insights = profileCorrectionManager.getLearningInsights();

    return NextResponse.json({
      success: true,
      insights,
      recommendations: [
        insights.totalCorrections > 10 ? 
          'Sufficient correction data for improving model accuracy' : 
          'More user corrections needed for reliable learning',
        
        insights.accuracyTrends.industry < 0.7 ? 
          'Industry classification needs improvement' : 
          'Industry classification performing well',
        
        insights.accuracyTrends.role < 0.7 ? 
          'Role detection needs improvement' : 
          'Role detection performing well',
        
        insights.accuracyTrends.sophistication < 0.7 ? 
          'Sophistication scoring needs improvement' : 
          'Sophistication scoring performing well'
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPointsAnalyzed: insights.totalCorrections
      }
    });

  } catch (error) {
    console.error('Failed to get learning insights:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get insights',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
} 