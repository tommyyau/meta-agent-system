/**
 * Middleware for Meta-Agent System
 * Handles authentication, rate limiting, and request validation
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/profile/analyze': { requests: 10, window: 60000 }, // 10 requests per minute
  '/api/conversation/start': { requests: 5, window: 60000 }, // 5 requests per minute
  '/api/assumptions/generate': { requests: 20, window: 60000 }, // 20 requests per minute
  '/api/wireframes/generate': { requests: 3, window: 300000 }, // 3 requests per 5 minutes
  default: { requests: 100, window: 60000 } // 100 requests per minute for other endpoints
}

// Simple in-memory rate limiting (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimit(pathname: string): { requests: number; window: number } {
  return RATE_LIMITS[pathname as keyof typeof RATE_LIMITS] || RATE_LIMITS.default
}

function checkRateLimit(clientId: string, pathname: string): boolean {
  const limit = getRateLimit(pathname)
  const now = Date.now()
  const key = `${clientId}:${pathname}`
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.window })
    return true
  }
  
  if (current.count >= limit.requests) {
    return false
  }
  
  current.count++
  return true
}

function getClientId(request: NextRequest): string {
  // Use IP address as client identifier (enhance with user ID when available)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || request.ip || 'unknown'
  return ip
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for non-API routes and static files
  if (!pathname.startsWith('/api') || 
      pathname.includes('/_next') || 
      pathname.includes('/favicon')) {
    return NextResponse.next()
  }
  
  // Health check endpoint - always allow
  if (pathname === '/api/health') {
    return NextResponse.next()
  }
  
  // Get client identifier
  const clientId = getClientId(request)
  
  // Check rate limit
  if (!checkRateLimit(clientId, pathname)) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded', 
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(getRateLimit(pathname).window / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(getRateLimit(pathname).window / 1000).toString(),
          'X-RateLimit-Limit': getRateLimit(pathname).requests.toString(),
          'X-RateLimit-Remaining': '0'
        }
      }
    )
  }
  
  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  // Add rate limit headers
  const limit = getRateLimit(pathname)
  const key = `${clientId}:${pathname}`
  const current = rateLimitStore.get(key)
  
  if (current) {
    response.headers.set('X-RateLimit-Limit', limit.requests.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, limit.requests - current.count).toString())
    response.headers.set('X-RateLimit-Reset', current.resetTime.toString())
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 