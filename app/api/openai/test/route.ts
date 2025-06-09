import { NextRequest, NextResponse } from 'next/server'
import { openaiService } from '@/lib/openai/client'
import { env } from '@/lib/config/environment'

export async function GET(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        message: 'Please run: npm run setup:env to configure your environment',
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }

    // Test the OpenAI connection
    const testResult = await openaiService.testConnection()
    
    // Get current usage statistics
    const usageStats = openaiService.getUsageStats()
    
    return NextResponse.json({
      success: true,
      connection: testResult,
      usage: usageStats,
      config: {
        model: env.OPENAI_MODEL_PRIMARY,
        fallbackModel: env.OPENAI_MODEL_FALLBACK,
        hasOrgId: !!env.OPENAI_ORG_ID,
        rateLimit: env.OPENAI_RATE_LIMIT_PER_MINUTE,
        dailyQuota: env.OPENAI_DAILY_QUOTA,
        monthlyBudget: env.OPENAI_MONTHLY_BUDGET,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('OpenAI test error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          statusCode: error.statusCode,
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message = 'Hello, can you respond with a brief test message?' } = body
    
    // Test with custom message
    const response = await openaiService.createCompletion({
      messages: [
        { role: 'user', content: message }
      ],
      options: {
        maxTokens: 100,
        temperature: 0.7,
      }
    })
    
    return NextResponse.json({
      success: true,
      response: {
        content: response.choices[0]?.message?.content,
        model: response.model,
        usage: response.usage,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('OpenAI completion error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          statusCode: error.statusCode,
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode || 500 }
    )
  }
} 