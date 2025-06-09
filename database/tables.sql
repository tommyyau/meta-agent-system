-- Additional tables for Meta-Agent System

-- Conversation messages
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    
    -- Message content
    role VARCHAR(20) NOT NULL CHECK (role IN ('system', 'assistant', 'user')),
    content TEXT NOT NULL,
    stage conversation_stage NOT NULL,
    
    -- Message metadata
    question_id VARCHAR(100),
    message_type VARCHAR(50),
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI model info
    model_used VARCHAR(50),
    prompt_template_id VARCHAR(100)
);

-- Domain-specific question banks
CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id VARCHAR(100) UNIQUE NOT NULL,
    industry industry_type NOT NULL,
    stage conversation_stage NOT NULL,
    
    -- Question content
    question_text TEXT NOT NULL,
    follow_up_questions JSONB,
    help_text TEXT,
    
    -- Question behavior
    is_required BOOLEAN DEFAULT false,
    min_sophistication user_sophistication,
    max_sophistication user_sophistication,
    depends_on_questions VARCHAR(100)[],
    
    -- Metadata
    category VARCHAR(100),
    tags VARCHAR(50)[],
    priority INTEGER DEFAULT 5,
    estimated_time_seconds INTEGER,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User responses to questions
CREATE TABLE user_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) REFERENCES question_banks(question_id),
    
    -- Response content
    response_text TEXT NOT NULL,
    response_structured JSONB,
    
    -- Response analysis
    sentiment_score DECIMAL(3,2),
    confidence_indicators JSONB,
    extracted_entities JSONB,
    
    -- Metadata
    response_time_seconds INTEGER,
    edit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated assumptions
CREATE TABLE assumptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    
    -- Assumption content
    category VARCHAR(100) NOT NULL,
    assumption_text TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    confidence confidence_level NOT NULL,
    
    -- Source tracking
    source_questions VARCHAR(100)[],
    source_responses UUID[],
    generation_method VARCHAR(50),
    
    -- User interaction
    user_accepted BOOLEAN,
    user_feedback TEXT,
    correction_text TEXT,
    
    -- Dependencies
    depends_on_assumptions UUID[],
    affects_assumptions UUID[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI generation metadata
    model_used VARCHAR(50),
    prompt_version VARCHAR(20),
    generation_tokens INTEGER
);

-- Wireframes and deliverables
CREATE TABLE wireframes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    
    -- Wireframe metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    wireframe_type VARCHAR(50),
    
    -- Content
    wireframe_data JSONB NOT NULL,
    components_used JSONB,
    user_flows JSONB,
    
    -- Visual specifications
    responsive_breakpoints JSONB,
    design_system_tokens JSONB,
    accessibility_features JSONB,
    
    -- Files and exports
    preview_image_url TEXT,
    export_urls JSONB,
    version INTEGER DEFAULT 1,
    
    -- Quality metrics
    design_complexity_score DECIMAL(3,2),
    user_experience_score DECIMAL(3,2),
    professional_quality_score DECIMAL(3,2),
    
    -- User feedback
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    revision_requests TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Generation metadata
    generation_time_seconds INTEGER,
    ai_model_used VARCHAR(50),
    template_used VARCHAR(100)
);

-- Technical specifications
CREATE TABLE technical_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    
    -- Specification content
    spec_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    structured_data JSONB,
    
    -- Technical details
    technology_stack JSONB,
    integrations_required JSONB,
    security_requirements JSONB,
    performance_requirements JSONB,
    
    -- Documentation
    code_examples JSONB,
    api_endpoints JSONB,
    database_schema JSONB,
    deployment_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false
); 