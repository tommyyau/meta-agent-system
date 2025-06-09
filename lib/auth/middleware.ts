import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { securityConfig } from '@/lib/config/environment'

// Authentication error types
export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
  }
}

// User context interface
export interface UserContext {
  id: string
  email?: string
  role?: string
  permissions?: string[]
}

// Request with user context
export interface AuthenticatedRequest extends NextRequest {
  user: UserContext
}

/**
 * JWT token verification
 */
export async function verifyToken(token: string): Promise<UserContext> {
  try {
    const decoded = verify(token, securityConfig.jwtSecret) as any
    
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    }
  } catch (error) {
    throw new AuthError('Invalid or expired token')
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

/**
 * API Key authentication for service-to-service communication
 */
export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.INTERNAL_API_KEY
  
  if (!expectedApiKey) {
    return false // API key auth not configured
  }
  
  return apiKey === expectedApiKey
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Get or create rate limit entry
  let rateLimit = rateLimitMap.get(identifier)
  
  if (!rateLimit || rateLimit.resetTime < windowStart) {
    rateLimit = { count: 0, resetTime: now + windowMs }
    rateLimitMap.set(identifier, rateLimit)
  }
  
  // Check if limit exceeded
  if (rateLimit.count >= limit) {
    return false
  }
  
  // Increment count
  rateLimit.count++
  return true
}

/**
 * Authentication middleware factory
 */
export function withAuth(options: {
  requireAuth?: boolean
  allowApiKey?: boolean
  requiredPermissions?: string[]
  rateLimit?: { requests: number; windowMs: number }
} = {}) {
  return function authMiddleware(
    handler: (request: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      try {
        const {
          requireAuth = true,
          allowApiKey = false,
          requiredPermissions = [],
          rateLimit,
        } = options

        let user: UserContext | null = null
        let identifier = 'anonymous'

        // Try API key authentication first if allowed
        if (allowApiKey && verifyApiKey(request)) {
          user = { id: 'system', role: 'system', permissions: ['*'] }
          identifier = 'system'
        }
        
        // Try JWT authentication if no API key or API key failed
        if (!user) {
          const token = extractBearerToken(request)
          
          if (token) {
            try {
              user = await verifyToken(token)
              identifier = user.id
            } catch (error) {
              if (requireAuth) {
                return NextResponse.json(
                  { error: 'Invalid authentication token' },
                  { status: 401 }
                )
              }
            }
          } else if (requireAuth) {
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            )
          }
        }

        // Check permissions
        if (user && requiredPermissions.length > 0) {
          const hasPermission = requiredPermissions.some(permission =>
            user!.permissions?.includes(permission) || user!.permissions?.includes('*')
          )
          
          if (!hasPermission) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        // Check rate limit
        if (rateLimit) {
          const allowed = checkRateLimit(
            identifier,
            rateLimit.requests,
            rateLimit.windowMs
          )
          
          if (!allowed) {
            return NextResponse.json(
              { error: 'Rate limit exceeded' },
              { status: 429 }
            )
          }
        }

        // Add user to request
        const authenticatedRequest = request as AuthenticatedRequest
        authenticatedRequest.user = user || { id: 'anonymous' }

        // Call the handler
        return await handler(authenticatedRequest)

      } catch (error: any) {
        console.error('Auth middleware error:', error)
        
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: error.statusCode || 500 }
        )
      }
    }
  }
}

/**
 * CORS middleware
 */
export function withCors(origins: string[] = securityConfig.corsOrigins) {
  return function corsMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const origin = request.headers.get('origin')
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 })
        
        if (origin && origins.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin)
        }
        
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
        response.headers.set('Access-Control-Max-Age', '86400')
        
        return response
      }
      
      // Handle regular requests
      const response = await handler(request)
      
      if (origin && origins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      
      return response
    }
  }
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders() {
  return function securityMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const response = await handler(request)
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      
      // Remove sensitive headers
      response.headers.delete('X-Powered-By')
      
      return response
    }
  }
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: any) => any>) {
  return function(handler: any) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
} 