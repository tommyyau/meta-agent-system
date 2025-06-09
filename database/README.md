# Meta-Agent System Database

Comprehensive PostgreSQL database schema for the sophisticated meta-agent system with user profiling, conversation management, assumption tracking, and wireframe generation.

## 🏗️ Architecture Overview

The database is designed to support a sophisticated meta-agent system that:
- Detects user profiles with 95% accuracy
- Manages 4-stage conversations (Idea Clarity → User Workflow → Technical Specs → Wireframes)
- Generates and tracks assumptions with dependency management
- Creates professional-quality wireframes
- Learns from user feedback to improve over time

## 📋 Database Schema

### Core Tables

#### `users`
- **Purpose**: Authentication and basic user information
- **Key Fields**: email, name, signup tracking
- **Features**: Supabase Auth integration, usage analytics

#### `user_profiles`
- **Purpose**: AI-generated user profile analysis
- **Key Fields**: industry detection, role classification, sophistication level
- **Features**: Confidence scoring, manual corrections, learning feedback

#### `conversation_sessions`
- **Purpose**: Track individual user conversations through 4 stages
- **Key Fields**: current_stage, industry, progress tracking, completion metrics
- **Features**: Escape hatch tracking, satisfaction scoring

#### `conversation_messages`
- **Purpose**: Store all conversation messages and AI responses
- **Key Fields**: role (system/assistant/user), content, stage, processing metadata
- **Features**: Token usage tracking, model performance metrics

### Domain-Specific Tables

#### `question_banks`
- **Purpose**: Store domain-specific questions for 7+ industries
- **Key Fields**: industry, stage, question_text, sophistication requirements
- **Features**: Adaptive questioning, dependency tracking, versioning

#### `user_responses`
- **Purpose**: User answers to questions with analysis
- **Key Fields**: response_text, structured extraction, sentiment analysis
- **Features**: Entity extraction, confidence indicators

### Assumption & Deliverable Tables

#### `assumptions`
- **Purpose**: AI-generated assumptions with dependency tracking
- **Key Fields**: category, assumption_text, confidence, source tracking
- **Features**: Cascade updates, user feedback, correction tracking

#### `wireframes`
- **Purpose**: Generated wireframes and design deliverables
- **Key Fields**: wireframe_data (JSONB), components, quality scores
- **Features**: Multiple export formats, user ratings, revision tracking

#### `technical_specs`
- **Purpose**: Generated technical documentation
- **Key Fields**: spec_type, structured_data, technology recommendations
- **Features**: API specifications, security requirements

### Analytics Tables

#### `user_analytics`
- **Purpose**: User behavior tracking and A/B testing
- **Key Fields**: event_type, event_data, performance metrics
- **Features**: Experiment tracking, interaction analytics

#### `model_performance`
- **Purpose**: AI model performance monitoring
- **Key Fields**: model_name, accuracy_score, processing_time, cost tracking
- **Features**: Ground truth comparison, user feedback correlation

#### `assumption_feedback`
- **Purpose**: Track assumption accuracy over time
- **Key Fields**: is_accurate, confidence_in_feedback, correction suggestions
- **Features**: Learning system input, accuracy improvement

## 🔧 Setup Instructions

### Prerequisites
- PostgreSQL 12+ or Supabase account
- Admin database access
- Environment variables configured

### Quick Setup

1. **Clone and navigate to database directory**:
   ```bash
   cd database/
   ```

2. **Make setup script executable**:
   ```bash
   chmod +x setup.sh
   ```

3. **For Supabase setup**:
   ```bash
   export SUPABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   export SUPABASE_ANON_KEY="your-anon-key"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ./setup.sh
   ```

4. **For local PostgreSQL**:
   ```bash
   export DATABASE_NAME="meta_agent_system"
   export DATABASE_USER="postgres"
   export DATABASE_HOST="localhost"
   ./setup.sh
   ```

### Manual Setup

If you prefer to run SQL files manually:

```bash
# 1. Create core schema
psql -f schema.sql

# 2. Create additional tables  
psql -f tables.sql

# 3. Create indexes and analytics
psql -f indexes.sql

# 4. Load seed data
psql -f seed_data.sql
```

## 📊 Question Bank Structure

The system includes comprehensive question banks for multiple industries:

### Fintech Questions (15 questions)
- **Idea Clarity**: Business model, compliance requirements, target users
- **User Workflow**: KYC/AML, payment flows, security requirements
- **Technical Specs**: Payment processors, fraud detection, reporting
- **Wireframes**: Critical screens, authentication flows

### Healthcare Questions (15 questions)
- **Idea Clarity**: Target audience, HIPAA compliance, healthcare settings
- **User Workflow**: Patient/provider workflows, scheduling, emergency handling
- **Technical Specs**: EHR integration, security, telemedicine
- **Wireframes**: Critical screens, medical forms

### General Business Questions (15 questions)
- **Idea Clarity**: Target users, problem definition, business model
- **User Workflow**: Core actions, user journey, data flow
- **Technical Specs**: Platforms, authentication, integrations
- **Wireframes**: Key screens, design preferences

## 🔐 Security Features

### Row Level Security (RLS)
- All user data protected by RLS policies
- Users can only access their own conversations and data
- Admin functions require service role access

### Data Protection
- Sensitive data encrypted at rest and in transit
- API keys and credentials stored securely
- Audit trails for all data modifications

### GDPR/Privacy Compliance
- User data deletion cascades properly
- Data retention policies configurable
- Consent tracking available

## ⚡ Performance Optimizations

### Indexes
- Optimized indexes for all common query patterns
- Composite indexes for complex filtering
- Partial indexes for frequently filtered data

### Query Optimization
- Efficient joins using proper foreign keys
- JSONB indexes for structured data queries
- Function-based indexes for computed values

### Scalability Features
- Horizontal scaling support via proper partitioning keys
- Connection pooling optimization
- Efficient pagination support

## 📈 Analytics & Monitoring

### Key Metrics Tracked
- User profile detection accuracy
- Conversation completion rates
- Assumption acceptance rates
- Wireframe quality scores
- Model performance metrics

### Health Monitoring
```sql
-- Run database health check
SELECT * FROM database_health_check();
```

### Performance Monitoring
```sql
-- Check session completion rates
SELECT 
    industry,
    AVG(completion_rate) as avg_completion,
    COUNT(*) as total_sessions
FROM conversation_sessions 
WHERE completed_at IS NOT NULL
GROUP BY industry;

-- Monitor assumption accuracy
SELECT 
    category,
    AVG(CASE WHEN is_accurate THEN 1.0 ELSE 0.0 END) as accuracy_rate,
    COUNT(*) as total_feedback
FROM assumption_feedback af
JOIN assumptions a ON af.assumption_id = a.id
GROUP BY category;
```

## 🔄 Data Flow

### Typical User Journey
1. **User Registration**: Record created in `users` table
2. **Profile Analysis**: AI analysis stored in `user_profiles`
3. **Session Start**: New `conversation_sessions` record
4. **Question Flow**: Messages stored in `conversation_messages`
5. **Response Collection**: Answers in `user_responses`
6. **Assumption Generation**: Smart defaults in `assumptions`
7. **Wireframe Creation**: Deliverables in `wireframes`
8. **Feedback Collection**: Analytics in `user_analytics`

### Data Dependencies
```
users → user_profiles → conversation_sessions
                     ↓
conversation_messages ← question_banks
                     ↓
user_responses → assumptions → wireframes
                           ↓
                  assumption_feedback
```

## 🛠️ Maintenance

### Regular Tasks
- **Weekly**: Review model performance metrics
- **Monthly**: Analyze question bank effectiveness
- **Quarterly**: Update assumption templates based on feedback

### Database Cleanup
```sql
-- Clean old incomplete sessions (older than 7 days)
DELETE FROM conversation_sessions 
WHERE started_at < NOW() - INTERVAL '7 days' 
AND completed_at IS NULL;

-- Archive old analytics data (older than 1 year)
-- Implementation depends on archival strategy
```

### Backup Strategy
- **Daily**: Automated backups of all user data
- **Weekly**: Full schema and seed data backup
- **Monthly**: Disaster recovery testing

## 🚀 Next Steps

After database setup:

1. **Environment Configuration**: Update `.env` with database credentials
2. **API Integration**: Connect Next.js application to database
3. **Testing**: Run integration tests with sample data
4. **Monitoring**: Set up alerting for key metrics
5. **Scaling**: Configure connection pooling and caching

## 📞 Support

For database-related issues:
- Check setup logs for error details
- Verify all environment variables are set
- Ensure PostgreSQL version compatibility (12+)
- Review RLS policies if access issues occur

---

*This database schema supports the sophisticated meta-agent system outlined in the project PRD, designed for 95% profile detection accuracy and professional-quality wireframe generation.* 