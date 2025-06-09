-- Initial seed data for Meta-Agent System
-- Question banks for Fintech, Healthcare, and General domains

-- =============================================
-- FINTECH QUESTION BANK
-- =============================================

-- Fintech - Idea Clarity Stage
INSERT INTO question_banks (question_id, industry, stage, question_text, is_required, category, priority, help_text) VALUES

('fintech_001', 'fintech', 'idea_clarity', 'What type of financial service are you building? (B2B, B2C, B2B2C, or marketplace)', true, 'business_model', 10, 'Understanding your business model helps us tailor security and compliance requirements'),

('fintech_002', 'fintech', 'idea_clarity', 'Which financial regulations will you need to comply with? (PCI DSS, SOC2, GDPR, etc.)', true, 'compliance', 9, 'Regulatory compliance is critical in fintech and affects architecture decisions'),

('fintech_003', 'fintech', 'idea_clarity', 'Who are your primary target users? (Individual consumers, small businesses, enterprises, financial institutions)', true, 'target_users', 10, 'User type determines UX complexity and feature priorities'),

('fintech_004', 'fintech', 'idea_clarity', 'What is the core financial problem you are solving?', true, 'problem_definition', 10, 'Clear problem definition helps us recommend appropriate fintech patterns'),

('fintech_005', 'fintech', 'idea_clarity', 'Will you handle actual money movement or just financial data?', true, 'money_handling', 9, 'Money movement requires additional security measures and compliance'),

-- Fintech - User Workflow Stage
('fintech_006', 'fintech', 'user_workflow', 'Describe the user onboarding process, including KYC/AML requirements', true, 'onboarding', 8, 'Fintech onboarding typically requires identity verification'),

('fintech_007', 'fintech', 'user_workflow', 'What are the key actions users take after onboarding?', true, 'core_workflow', 9, 'Understanding user flow helps design optimal UX'),

('fintech_008', 'fintech', 'user_workflow', 'How do users fund their accounts or make payments?', true, 'payment_flow', 8, 'Payment methods affect integration requirements'),

('fintech_009', 'fintech', 'user_workflow', 'What notifications and alerts do users need?', false, 'notifications', 6, 'Financial apps require careful notification design for compliance'),

-- Fintech - Technical Specs Stage
('fintech_010', 'fintech', 'technical_specs', 'Which payment processors will you integrate with? (Stripe, Plaid, etc.)', false, 'integrations', 7, 'Payment processor choice affects technical architecture'),

('fintech_011', 'fintech', 'technical_specs', 'What are your data security and encryption requirements?', true, 'security', 10, 'Financial data requires highest security standards'),

('fintech_012', 'fintech', 'technical_specs', 'Do you need real-time transaction monitoring and fraud detection?', false, 'fraud_detection', 7, 'Fraud detection is critical for money movement'),

('fintech_013', 'fintech', 'technical_specs', 'What reporting and analytics capabilities do you need?', false, 'analytics', 6, 'Financial apps often need detailed reporting for compliance'),

-- Fintech - Wireframes Stage
('fintech_014', 'fintech', 'wireframes', 'What are the most critical screens users will interact with?', true, 'key_screens', 8, 'Helps prioritize wireframe creation'),

('fintech_015', 'fintech', 'wireframes', 'Do you need multi-factor authentication flows?', true, 'auth_flows', 9, 'Security flows are essential in fintech wireframes');

-- =============================================
-- HEALTHCARE QUESTION BANK
-- =============================================

-- Healthcare - Idea Clarity Stage
INSERT INTO question_banks (question_id, industry, stage, question_text, is_required, category, priority, help_text) VALUES

('healthcare_001', 'healthcare', 'idea_clarity', 'Are you targeting healthcare providers, patients, or administrators?', true, 'target_audience', 10, 'Different audiences have vastly different needs and workflows'),

('healthcare_002', 'healthcare', 'idea_clarity', 'Will you need to handle PHI (Protected Health Information) and comply with HIPAA?', true, 'compliance', 10, 'HIPAA compliance is mandatory for most healthcare applications'),

('healthcare_003', 'healthcare', 'idea_clarity', 'What specific healthcare problem are you solving?', true, 'problem_definition', 10, 'Healthcare problems often require domain expertise'),

('healthcare_004', 'healthcare', 'idea_clarity', 'What type of healthcare setting will use your product? (hospital, clinic, telehealth, etc.)', true, 'healthcare_setting', 9, 'Different settings have different workflows and constraints'),

('healthcare_005', 'healthcare', 'idea_clarity', 'Do you need to support multiple user roles with different permissions?', false, 'user_roles', 7, 'Healthcare apps often have complex role-based access'),

-- Healthcare - User Workflow Stage
('healthcare_006', 'healthcare', 'user_workflow', 'Describe the typical patient or provider workflow in your app', true, 'core_workflow', 9, 'Healthcare workflows are highly regulated and specific'),

('healthcare_007', 'healthcare', 'user_workflow', 'How do users schedule appointments or access care?', false, 'scheduling', 7, 'Scheduling is a common healthcare app feature'),

('healthcare_008', 'healthcare', 'user_workflow', 'What patient data needs to be collected and displayed?', true, 'data_collection', 8, 'Data requirements affect UI design and security'),

('healthcare_009', 'healthcare', 'user_workflow', 'How do you handle emergency situations or urgent notifications?', false, 'emergency_flows', 6, 'Emergency handling is critical in healthcare'),

-- Healthcare - Technical Specs Stage
('healthcare_010', 'healthcare', 'technical_specs', 'Do you need to integrate with existing EHR systems? If so, which ones?', false, 'ehr_integration', 7, 'EHR integration is complex but often required'),

('healthcare_011', 'healthcare', 'technical_specs', 'What level of data encryption and security do you need?', true, 'security', 10, 'Healthcare data requires highest security standards'),

('healthcare_012', 'healthcare', 'technical_specs', 'Do you need telemedicine or video call capabilities?', false, 'telemedicine', 6, 'Video calls have specific technical requirements'),

('healthcare_013', 'healthcare', 'technical_specs', 'What reporting and analytics are required for compliance?', false, 'compliance_reporting', 7, 'Healthcare reporting is often mandated'),

-- Healthcare - Wireframes Stage
('healthcare_014', 'healthcare', 'wireframes', 'What are the most critical patient or provider screens?', true, 'key_screens', 8, 'Helps prioritize wireframe creation'),

('healthcare_015', 'healthcare', 'wireframes', 'Do you need specialized medical forms or data entry screens?', false, 'medical_forms', 7, 'Medical forms have specific design requirements');

-- =============================================
-- GENERAL BUSINESS QUESTION BANK
-- =============================================

-- General - Idea Clarity Stage
INSERT INTO question_banks (question_id, industry, stage, question_text, is_required, category, priority, help_text) VALUES

('general_001', 'general', 'idea_clarity', 'Who is your primary target user? Describe them in detail.', true, 'target_users', 10, 'Understanding your users is fundamental to good product design'),

('general_002', 'general', 'idea_clarity', 'What is the core problem your product solves?', true, 'problem_definition', 10, 'Clear problem definition guides all design decisions'),

('general_003', 'general', 'idea_clarity', 'Is this a B2B, B2C, or B2B2C product?', true, 'business_model', 9, 'Business model affects user experience and feature priorities'),

('general_004', 'general', 'idea_clarity', 'What makes your solution unique compared to existing alternatives?', false, 'value_proposition', 7, 'Unique value helps prioritize features'),

('general_005', 'general', 'idea_clarity', 'What is the primary way users will discover and access your product?', false, 'acquisition', 6, 'Acquisition method affects onboarding design'),

-- General - User Workflow Stage
('general_006', 'general', 'user_workflow', 'What are the 3-5 most important actions users will take in your product?', true, 'core_workflow', 9, 'Core actions should be prominent in the design'),

('general_007', 'general', 'user_workflow', 'Describe the ideal user journey from first visit to becoming a power user', true, 'user_journey', 8, 'User journey mapping is essential for good UX'),

('general_008', 'general', 'user_workflow', 'What data do users need to input, and what data do they need to see?', true, 'data_flow', 8, 'Data flow affects information architecture'),

('general_009', 'general', 'user_workflow', 'How often will users interact with your product? (daily, weekly, monthly)', false, 'usage_frequency', 6, 'Usage frequency affects design decisions'),

-- General - Technical Specs Stage
('general_010', 'general', 'technical_specs', 'What platforms do you need to support? (web, mobile, desktop)', true, 'platforms', 8, 'Platform choice affects technical architecture'),

('general_011', 'general', 'technical_specs', 'Do you need user authentication and account management?', true, 'authentication', 8, 'Most apps need user accounts'),

('general_012', 'general', 'technical_specs', 'What third-party services or APIs will you integrate with?', false, 'integrations', 6, 'Integrations affect architecture complexity'),

('general_013', 'general', 'technical_specs', 'What are your performance and scalability requirements?', false, 'performance', 5, 'Performance requirements affect technology choices'),

-- General - Wireframes Stage
('general_014', 'general', 'wireframes', 'What are the 5 most important screens or pages in your app?', true, 'key_screens', 9, 'Key screens get wireframe priority'),

('general_015', 'general', 'wireframes', 'Do you have any specific design preferences or brand guidelines?', false, 'design_preferences', 4, 'Design preferences help customize wireframes');

-- =============================================
-- SAMPLE USERS FOR TESTING
-- =============================================

-- Sample test user (for development)
INSERT INTO users (id, email, name, signup_source) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User', 'development');

-- Sample user profile
INSERT INTO user_profiles (id, user_id, detected_industry, detected_role, sophistication_level, confidence_score, analysis_text) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'fintech', 'technical', 'advanced', 0.85, 'Sample analysis text for testing');

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE question_banks IS 'Domain-specific question banks for guiding conversations with users';
COMMENT ON TABLE users IS 'Core user authentication and profile data';
COMMENT ON TABLE user_profiles IS 'AI-generated user profile analysis results';
COMMENT ON TABLE conversation_sessions IS 'Individual conversation sessions between users and the meta-agent';
COMMENT ON TABLE assumptions IS 'AI-generated assumptions with dependency tracking and user feedback';
COMMENT ON TABLE wireframes IS 'Generated wireframes and design deliverables'; 