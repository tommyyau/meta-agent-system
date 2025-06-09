# Meta-Agent System API Gateway

Comprehensive API documentation for the sophisticated meta-agent system with microservices architecture.

## 🏗️ Architecture Overview

The API gateway provides a unified interface for all meta-agent system operations:

- **Profile Analysis**: AI-powered user profiling with 95% accuracy
- **Conversation Management**: 4-stage conversation orchestration
- **Question Banking**: Adaptive domain-specific questioning
- **Assumption Generation**: Smart default generation with dependency tracking
- **Wireframe Creation**: Professional-quality wireframe generation
- **Analytics**: Real-time performance monitoring and learning

## 📡 API Endpoints

### Core System Endpoints

#### Health Check
```
GET /api/health
```
**Purpose**: System health and connectivity check  
**Response**: Health status, latency metrics, service availability

#### Authentication
```
POST /api/auth/session
GET /api/auth/user
DELETE /api/auth/logout
```
**Purpose**: User authentication and session management

### Profile Analysis Endpoints

#### Analyze User Profile
```
POST /api/profile/analyze
Content-Type: application/json

{
  "text": "I'm building a fintech app for small businesses...",
  "context": {
    "source": "onboarding",
    "previous_answers": []
  }
}
```
**Purpose**: Analyze user input to detect industry, role, and sophistication  
**Returns**: Profile classification with confidence scores

#### Update Profile
```
PUT /api/profile/{profileId}
Content-Type: application/json

{
  "corrected_industry": "fintech",
  "corrected_role": "technical",
  "correction_feedback": "Actually, I'm a technical founder"
}
```
**Purpose**: Allow users to correct AI profile analysis  
**Returns**: Updated profile with learning data

### Conversation Management Endpoints

#### Start Conversation
```
POST /api/conversation/start
Content-Type: application/json

{
  "profile_id": "uuid",
  "industry": "fintech",
  "user_context": {
    "source": "web",
    "referrer": "https://example.com"
  }
}
```
**Purpose**: Initialize new conversation session  
**Returns**: Session ID and first stage questions

#### Get Questions
```
GET /api/conversation/{sessionId}/questions
?stage=idea_clarity&sophistication=advanced
```
**Purpose**: Retrieve adaptive questions for current stage  
**Returns**: Prioritized question list with context

#### Submit Response
```
POST /api/conversation/{sessionId}/responses
Content-Type: application/json

{
  "question_id": "fintech_001",
  "response_text": "We're building B2B payment processing...",
  "response_time_seconds": 45,
  "stage": "idea_clarity"
}
```
**Purpose**: Submit user answer to question  
**Returns**: Response analysis and next question

#### Progress to Next Stage
```
POST /api/conversation/{sessionId}/progress
Content-Type: application/json

{
  "current_stage": "idea_clarity",
  "completion_data": {
    "answered_questions": 5,
    "stage_confidence": 0.85
  }
}
```
**Purpose**: Move conversation to next stage  
**Returns**: Next stage information and questions

### Assumption Generation Endpoints

#### Generate Assumptions
```
POST /api/assumptions/generate
Content-Type: application/json

{
  "session_id": "uuid",
  "trigger": "escape_hatch",
  "context": {
    "stage": "user_workflow",
    "answered_questions": ["fintech_001", "fintech_002"],
    "user_responses": []
  }
}
```
**Purpose**: Generate smart assumptions when users escape questioning  
**Returns**: Categorized assumptions with confidence scores

#### Accept/Reject Assumptions
```
PUT /api/assumptions/{assumptionId}
Content-Type: application/json

{
  "user_accepted": true,
  "user_feedback": "Accurate assumption",
  "corrections": null
}
```
**Purpose**: Collect user feedback on assumption accuracy  
**Returns**: Updated assumption with learning data

#### Get Session Assumptions
```
GET /api/assumptions/session/{sessionId}
?category=target_users&confidence=high
```
**Purpose**: Retrieve all assumptions for a session  
**Returns**: Filtered assumptions with dependency tracking

### Wireframe Generation Endpoints

#### Generate Wireframes
```
POST /api/wireframes/generate
Content-Type: application/json

{
  "session_id": "uuid",
  "wireframe_types": ["dashboard", "onboarding", "main_flow"],
  "design_preferences": {
    "style": "modern",
    "complexity": "medium",
    "responsive": true
  }
}
```
**Purpose**: Generate professional wireframes from session data  
**Returns**: Wireframe data with preview URLs

#### Export Wireframes
```
GET /api/wireframes/{wireframeId}/export
?format=pdf&quality=high
```
**Purpose**: Export wireframes in various formats  
**Returns**: Download URL for requested format

#### Rate Wireframes
```
POST /api/wireframes/{wireframeId}/feedback
Content-Type: application/json

{
  "user_rating": 4,
  "feedback": "Great design, but needs more detail on mobile flow",
  "revision_requests": "Add mobile-specific screens"
}
```
**Purpose**: Collect user feedback for wireframe quality  
**Returns**: Updated wireframe with feedback data

### Analytics Endpoints

#### Record User Event
```
POST /api/analytics/events
Content-Type: application/json

{
  "event_type": "question_answered",
  "event_data": {
    "question_id": "fintech_001",
    "response_length": 150,
    "time_spent": 45
  },
  "session_id": "uuid",
  "page_url": "/conversation"
}
```
**Purpose**: Track user behavior for system improvement  
**Returns**: Event confirmation

#### Model Performance
```
POST /api/analytics/model-performance
Content-Type: application/json

{
  "model_name": "profile_detector_v1",
  "task_type": "industry_classification",
  "accuracy_score": 0.94,
  "processing_time_ms": 1200,
  "input_data": {},
  "output_data": {},
  "user_feedback_score": 5
}
```
**Purpose**: Track AI model performance metrics  
**Returns**: Performance record confirmation

## 🔐 Authentication & Security

### API Key Authentication
```
Authorization: Bearer YOUR_API_KEY
```

### Rate Limiting
- **Profile Analysis**: 10 requests/minute
- **Conversation Management**: 5 new sessions/minute
- **Assumption Generation**: 20 requests/minute  
- **Wireframe Generation**: 3 requests/5 minutes
- **Other Endpoints**: 100 requests/minute

### Security Headers
All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📊 Response Formats

### Standard Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-01-09T12:00:00Z",
    "request_id": "req_uuid",
    "processing_time_ms": 150
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "industry",
      "reason": "must be valid industry type"
    }
  },
  "metadata": {
    "timestamp": "2025-01-09T12:00:00Z",
    "request_id": "req_uuid"
  }
}
```

### Rate Limit Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

## 📈 Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily down

## 🔄 Real-time Features

### WebSocket Connections
```
WSS /api/realtime/conversation/{sessionId}
```
**Purpose**: Real-time conversation updates  
**Events**: question_received, response_analyzed, stage_progressed

### Server-Sent Events
```
GET /api/stream/wireframe-generation/{sessionId}
```
**Purpose**: Live wireframe generation progress  
**Events**: generation_started, components_created, export_ready

## 🧪 Testing & Development

### Health Check
```bash
curl -X GET https://your-app.vercel.app/api/health
```

### Example API Calls
```bash
# Start a conversation
curl -X POST https://your-app.vercel.app/api/conversation/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "profile_id": "uuid",
    "industry": "fintech"
  }'

# Generate assumptions
curl -X POST https://your-app.vercel.app/api/assumptions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "session_id": "uuid",
    "trigger": "escape_hatch"
  }'
```

## 📚 Integration Examples

### JavaScript/TypeScript
```typescript
// Initialize API client
const apiClient = new MetaAgentAPI({
  baseUrl: 'https://your-app.vercel.app',
  apiKey: 'your-api-key'
})

// Start conversation
const session = await apiClient.conversation.start({
  profileId: 'user-profile-uuid',
  industry: 'fintech'
})

// Generate wireframes
const wireframes = await apiClient.wireframes.generate({
  sessionId: session.id,
  types: ['dashboard', 'onboarding']
})
```

### Python
```python
import requests

# API configuration
API_BASE = "https://your-app.vercel.app"
API_KEY = "your-api-key"

# Start conversation
response = requests.post(
    f"{API_BASE}/api/conversation/start",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "profile_id": "user-profile-uuid",
        "industry": "fintech"
    }
)
session = response.json()
```

## 🚀 Performance Optimization

### Caching Strategy
- **Question Banks**: Cached for 1 hour
- **User Profiles**: Cached for session duration
- **Assumptions**: Cached for 5 minutes
- **Wireframes**: Cached permanently with versioning

### Response Time Targets
- **Profile Analysis**: < 2 seconds
- **Question Retrieval**: < 1 second  
- **Assumption Generation**: < 3 seconds
- **Wireframe Generation**: < 10 seconds

---

*This API gateway provides the foundation for the sophisticated meta-agent system, designed for 95% profile detection accuracy and professional-quality deliverable generation.* 