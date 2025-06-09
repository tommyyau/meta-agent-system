-- Database indexes and analytics tables for Meta-Agent System

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- User behavior analytics
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id),
    
    -- Event tracking
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    referrer TEXT,
    
    -- Performance
    page_load_time_ms INTEGER,
    interaction_time_ms INTEGER,
    
    -- A/B testing
    experiment_id VARCHAR(100),
    variant VARCHAR(50)
);

-- ML model performance tracking
CREATE TABLE model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Model identification
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    
    -- Performance metrics
    accuracy_score DECIMAL(5,4),
    confidence_score DECIMAL(5,4),
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    
    -- Input/output
    input_data JSONB,
    output_data JSONB,
    ground_truth JSONB,
    
    -- Feedback
    user_feedback_score INTEGER,
    was_corrected BOOLEAN DEFAULT false,
    correction_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID REFERENCES conversation_sessions(id),
    user_id UUID REFERENCES users(id)
);

-- Assumption accuracy tracking
CREATE TABLE assumption_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assumption_id UUID REFERENCES assumptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Feedback details
    is_accurate BOOLEAN NOT NULL,
    confidence_in_feedback INTEGER CHECK (confidence_in_feedback >= 1 AND confidence_in_feedback <= 5),
    feedback_text TEXT,
    suggested_correction TEXT,
    
    -- Context
    feedback_stage conversation_stage,
    time_since_generation_minutes INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- User-related indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_active ON users(is_active);

-- User profile indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_industry_role ON user_profiles(detected_industry, detected_role);
CREATE INDEX idx_user_profiles_confidence ON user_profiles(confidence_score);

-- Session-related indexes
CREATE INDEX idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_industry ON conversation_sessions(industry);
CREATE INDEX idx_conversation_sessions_stage ON conversation_sessions(current_stage);
CREATE INDEX idx_conversation_sessions_completed_at ON conversation_sessions(completed_at);
CREATE INDEX idx_conversation_sessions_started_at ON conversation_sessions(started_at);

-- Message indexes
CREATE INDEX idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX idx_conversation_messages_stage ON conversation_messages(stage);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at);
CREATE INDEX idx_conversation_messages_role ON conversation_messages(role);

-- Question bank indexes
CREATE INDEX idx_question_banks_industry_stage ON question_banks(industry, stage);
CREATE INDEX idx_question_banks_active ON question_banks(is_active);
CREATE INDEX idx_question_banks_priority ON question_banks(priority);
CREATE INDEX idx_question_banks_category ON question_banks(category);

-- Response indexes
CREATE INDEX idx_user_responses_session_question ON user_responses(session_id, question_id);
CREATE INDEX idx_user_responses_created_at ON user_responses(created_at);

-- Assumption indexes
CREATE INDEX idx_assumptions_session_id ON assumptions(session_id);
CREATE INDEX idx_assumptions_category ON assumptions(category);
CREATE INDEX idx_assumptions_confidence ON assumptions(confidence);
CREATE INDEX idx_assumptions_accepted ON assumptions(user_accepted);

-- Wireframe indexes
CREATE INDEX idx_wireframes_session_id ON wireframes(session_id);
CREATE INDEX idx_wireframes_type ON wireframes(wireframe_type);
CREATE INDEX idx_wireframes_rating ON wireframes(user_rating);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_event ON user_analytics(user_id, event_type);
CREATE INDEX idx_user_analytics_timestamp ON user_analytics(event_timestamp);
CREATE INDEX idx_user_analytics_session ON user_analytics(session_id);

-- Model performance indexes
CREATE INDEX idx_model_performance_model_task ON model_performance(model_name, task_type);
CREATE INDEX idx_model_performance_accuracy ON model_performance(accuracy_score);
CREATE INDEX idx_model_performance_created_at ON model_performance(created_at);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_banks_updated_at BEFORE UPDATE ON question_banks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_responses_updated_at BEFORE UPDATE ON user_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assumptions_updated_at BEFORE UPDATE ON assumptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wireframes_updated_at BEFORE UPDATE ON wireframes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session completion rate
CREATE OR REPLACE FUNCTION calculate_session_completion_rate(session_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_questions INTEGER;
    answered_questions INTEGER;
    completion_rate DECIMAL;
BEGIN
    -- Count total required questions for the session's industry and user sophistication
    SELECT COUNT(*) INTO total_questions
    FROM question_banks qb
    JOIN conversation_sessions cs ON cs.id = session_uuid
    JOIN user_profiles up ON up.id = cs.profile_id
    WHERE qb.industry = cs.industry 
    AND qb.is_active = true
    AND (qb.min_sophistication IS NULL OR up.sophistication_level >= qb.min_sophistication)
    AND (qb.max_sophistication IS NULL OR up.sophistication_level <= qb.max_sophistication);
    
    -- Count answered questions
    SELECT COUNT(DISTINCT ur.question_id) INTO answered_questions
    FROM user_responses ur
    WHERE ur.session_id = session_uuid;
    
    -- Calculate completion rate
    IF total_questions > 0 THEN
        completion_rate := answered_questions::DECIMAL / total_questions::DECIMAL;
    ELSE
        completion_rate := 0;
    END IF;
    
    -- Update the session
    UPDATE conversation_sessions 
    SET completion_rate = completion_rate,
        total_questions_asked = total_questions,
        total_questions_answered = answered_questions
    WHERE id = session_uuid;
    
    RETURN completion_rate;
END;
$$ LANGUAGE plpgsql; 