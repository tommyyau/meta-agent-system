import { NextRequest, NextResponse } from 'next/server';
import { profileDetector } from '@/lib/profile/profile-detector';

// POST: Analyze user input and detect comprehensive profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      input, 
      sessionId, 
      conversationHistory, 
      previousProfile,
      requireMinimumConfidence = 0.6,
      enableLearning = true 
    } = body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid input text is required' },
        { status: 400 }
      );
    }

    // Perform comprehensive profile detection
    const result = await profileDetector.detectProfile(input.trim(), {
      sessionId,
      conversationHistory: conversationHistory || [],
      previousProfile,
      requireMinimumConfidence,
      enableLearning
    });

    // Validate the profile quality
    const validation = profileDetector.validateProfile(result.profile, requireMinimumConfidence);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        // Convert Map-like objects to plain objects for JSON serialization
        profile: {
          ...result.profile,
          conversationHistory: result.profile.conversationHistory.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          })),
          created: result.profile.created.toISOString(),
          lastUpdated: result.profile.lastUpdated.toISOString()
        }
      },
      validation,
      metadata: {
        processingTime: Date.now(),
        analysisVersion: '1.0'
      }
    });

  } catch (error) {
    console.error('Profile detection failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Profile detection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// GET: Get profile detection capabilities and supported features
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      capabilities: {
        industries: [
          'fintech',
          'healthcare', 
          'ecommerce',
          'saas',
          'consumer',
          'enterprise',
          'general'
        ],
        roles: [
          'technical',
          'business',
          'hybrid',
          'unknown'
        ],
        sophisticationLevels: [
          'low',
          'medium',
          'high'
        ],
        features: {
          industryClassification: {
            description: 'Classifies user into industry verticals',
            accuracy: '70%+',
            supportedIndustries: 7
          },
          roleDetection: {
            description: 'Determines if user is technical, business, or hybrid',
            accuracy: '75%+',
            indicators: ['terminology', 'problem_framing', 'solution_approach']
          },
          sophisticationScoring: {
            description: 'Analyzes language complexity and domain expertise',
            factors: ['vocabulary', 'domain_expertise', 'conceptual_depth', 'professional_terminology', 'communication_clarity']
          },
          profileValidation: {
            description: 'Validates profile consistency and quality',
            checks: ['confidence_levels', 'role_industry_match', 'terminology_sufficiency']
          }
        }
      },
      examples: {
        technicalFounder: {
          input: "I'm building a fintech API that handles high-frequency trading data with microsecond latency requirements. We need to implement a distributed architecture using Kubernetes and ensure PCI DSS compliance.",
          expectedOutput: {
            industry: 'fintech',
            role: 'technical',
            sophisticationLevel: 'high'
          }
        },
        businessFounder: {
          input: "I want to create a healthcare marketplace that connects patients with specialists. Our go-to-market strategy focuses on customer acquisition and we're looking at Series A funding.",
          expectedOutput: {
            industry: 'healthcare',
            role: 'business', 
            sophisticationLevel: 'medium'
          }
        },
        hybridProductManager: {
          input: "We're developing a SaaS product with API integrations and need to balance technical feasibility with business requirements. I'm analyzing user analytics to inform our product roadmap.",
          expectedOutput: {
            industry: 'saas',
            role: 'hybrid',
            sophisticationLevel: 'high'
          }
        }
      }
    });

  } catch (error) {
    console.error('Failed to get profile detection capabilities:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get capabilities',
        success: false
      },
      { status: 500 }
    );
  }
}

// PUT: Batch profile detection for multiple inputs
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputs, options = {} } = body;

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json(
        { error: 'Array of inputs is required' },
        { status: 400 }
      );
    }

    if (inputs.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 inputs allowed per batch request' },
        { status: 400 }
      );
    }

    // Validate each input
    for (const input of inputs) {
      if (!input.text || typeof input.text !== 'string' || input.text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Each input must have valid text field' },
          { status: 400 }
        );
      }
    }

    // Process batch
    const startTime = Date.now();
    const results = await profileDetector.batchDetectProfiles(inputs.map(input => ({
      text: input.text.trim(),
      options: { ...options, ...input.options }
    })));

    // Convert dates to ISO strings for JSON serialization
    const serializedResults = results.map(result => ({
      ...result,
      profile: {
        ...result.profile,
        conversationHistory: result.profile.conversationHistory.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        created: result.profile.created.toISOString(),
        lastUpdated: result.profile.lastUpdated.toISOString()
      }
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      results: serializedResults,
      metadata: {
        totalInputs: inputs.length,
        successfulAnalyses: results.length,
        processingTimeMs: processingTime,
        averageTimePerInput: Math.round(processingTime / inputs.length)
      }
    });

  } catch (error) {
    console.error('Batch profile detection failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Batch profile detection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
} 