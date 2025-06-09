-- Meta-Agent System Database Schema
-- PostgreSQL/Supabase Schema for sophisticated meta-agent system
-- Version: 1.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS AND TYPES
-- =============================================

-- User sophistication levels
CREATE TYPE user_sophistication AS ENUM (
    'novice',
    'intermediate', 
    'advanced',
    'expert'
);

-- User roles in organization
CREATE TYPE user_role AS ENUM (
    'technical',
    'business',
    'hybrid',
    'consultant',
    'founder',
    'executive'
);

-- Industry verticals
CREATE TYPE industry_type AS ENUM (
    'fintech',
    'healthcare',
    'ecommerce',
    'saas',
    'consumer_apps',
    'enterprise_software',
    'general',
    'other'
);

-- Conversation stages
CREATE TYPE conversation_stage AS ENUM (
    'idea_clarity',
    'user_workflow',
    'technical_specs',
    'wireframes',
    'completed'
);

-- Assumption confidence levels
CREATE TYPE confidence_level AS ENUM (
    'low',
    'medium',
    'high',
    'very_high'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table (authentication and basic info)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    signup_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer TEXT
);

-- User profiles (AI-generated profile data)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile detection results
    detected_industry industry_type NOT NULL,
    detected_role user_role NOT NULL,
    sophistication_level user_sophistication NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Analysis metadata
    analysis_text TEXT NOT NULL,
    keywords_extracted JSONB,
    terminology_patterns JSONB,
    
    -- Manual corrections
    corrected_industry industry_type,
    corrected_role user_role,
    corrected_sophistication user_sophistication,
    correction_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Learning data
    accuracy_feedback BOOLEAN,
    improvement_suggestions TEXT
);

-- Conversation sessions
CREATE TABLE conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES user_profiles(id),
    
    -- Session metadata
    current_stage conversation_stage DEFAULT 'idea_clarity',
    industry industry_type NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Progress tracking
    stage_progress JSONB DEFAULT '{}',
    total_questions_asked INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    escape_hatch_used BOOLEAN DEFAULT false,
    escape_hatch_stage conversation_stage,
    
    -- Session outcomes
    completion_rate DECIMAL(3,2),
    user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
    time_to_completion_minutes INTEGER,
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    session_metadata JSONB DEFAULT '{}'
);
