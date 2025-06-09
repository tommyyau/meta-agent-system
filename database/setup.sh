#!/bin/bash

# Meta-Agent System Database Setup Script
# Sets up PostgreSQL database for Supabase or local development

set -e  # Exit on any error

echo "🚀 Setting up Meta-Agent System Database..."

# Configuration
DB_NAME=${DATABASE_NAME:-"meta_agent_system"}
DB_HOST=${DATABASE_HOST:-"localhost"}
DB_PORT=${DATABASE_PORT:-"5432"}
DB_USER=${DATABASE_USER:-"postgres"}
SUPABASE_URL=${SUPABASE_URL:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running with Supabase or local PostgreSQL
if [ ! -z "$SUPABASE_URL" ]; then
    echo "🔗 Detected Supabase setup"
    if [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_error "Supabase keys not found. Please set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY"
        exit 1
    fi
    PSQL_COMMAND="psql $SUPABASE_URL"
else
    echo "🐘 Using local PostgreSQL"
    PSQL_COMMAND="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
fi

# Function to execute SQL files
execute_sql() {
    local file=$1
    local description=$2
    
    echo "📄 Executing $description..."
    
    if [ -f "$file" ]; then
        if $PSQL_COMMAND -f "$file" > /dev/null 2>&1; then
            print_status "$description completed"
        else
            print_error "Failed to execute $description"
            echo "Command: $PSQL_COMMAND -f $file"
            exit 1
        fi
    else
        print_error "File not found: $file"
        exit 1
    fi
}

# Check if PostgreSQL is accessible
echo "🔍 Checking database connection..."
if $PSQL_COMMAND -c "SELECT version();" > /dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_error "Cannot connect to database"
    print_warning "Make sure PostgreSQL is running and credentials are correct"
    exit 1
fi

# Check for required SQL files
required_files=("schema.sql" "tables.sql" "indexes.sql" "seed_data.sql")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done

print_status "All required SQL files found"

# Execute SQL files in order
echo "🏗️  Creating database schema..."

# 1. Create enums and core tables
execute_sql "schema.sql" "core schema (enums and primary tables)"

# 2. Create additional tables
execute_sql "tables.sql" "additional tables (messages, questions, assumptions)"

# 3. Create indexes and analytics
execute_sql "indexes.sql" "indexes and analytics tables"

# 4. Insert seed data
execute_sql "seed_data.sql" "seed data (question banks)"

# Verify setup
echo "🧪 Verifying database setup..."

# Check if tables were created
table_count=$($PSQL_COMMAND -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')

if [ "$table_count" -gt 10 ]; then
    print_status "Database tables created successfully ($table_count tables)"
else
    print_error "Expected more than 10 tables, found $table_count"
    exit 1
fi

# Check if question banks were populated
question_count=$($PSQL_COMMAND -t -c "SELECT COUNT(*) FROM question_banks;" | tr -d ' ')

if [ "$question_count" -gt 40 ]; then
    print_status "Question banks populated successfully ($question_count questions)"
else
    print_error "Expected more than 40 questions, found $question_count"
    exit 1
fi

# Check if enums were created
enum_count=$($PSQL_COMMAND -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype = 'e';" | tr -d ' ')

if [ "$enum_count" -ge 5 ]; then
    print_status "Enums created successfully ($enum_count enums)"
else
    print_error "Expected at least 5 enums, found $enum_count"
    exit 1
fi

# Summary
echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📊 Setup Summary:"
echo "   • Tables created: $table_count"
echo "   • Questions loaded: $question_count"
echo "   • Enums created: $enum_count"
echo "   • Industries supported: Fintech, Healthcare, General"
echo ""

if [ ! -z "$SUPABASE_URL" ]; then
    echo "🔗 Supabase Configuration:"
    echo "   • URL: $SUPABASE_URL"
    echo "   • Row Level Security: Enabled"
    echo "   • Real-time: Available for all tables"
    echo ""
fi

echo "🚀 Your Meta-Agent System database is ready!"
echo ""
echo "📚 Next Steps:"
echo "   1. Update your .env file with database credentials"
echo "   2. Test the API connections"
echo "   3. Run the application"
echo ""

print_warning "Remember to keep your database credentials secure!" 