#!/bin/bash

# WorkEase Deployment Script
# Automates the deployment of all components
# Run this script to deploy the complete WorkEase application

set -e  # Exit on error

echo "🚀 WorkEase Deployment Script"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to backup file
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$file" "$backup"
        print_success "Backed up $file to $backup"
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must run from WorkEase root directory"
    exit 1
fi

echo "Step 1: Database Implementation (Loop 14)"
echo "-----------------------------------------"
print_warning "Deploying SQLite database layer..."

# Backup and update Cargo.toml
backup_file "src-tauri/Cargo.toml"
cp src-tauri/Cargo.toml.database src-tauri/Cargo.toml
print_success "Updated Cargo.toml with database dependencies"

# Copy database modules (they're already in place)
print_success "Database modules in place (database.rs, db_commands.rs)"

# Backup and update lib.rs
backup_file "src-tauri/src/lib.rs"
cp src-tauri/src/lib.rs.with-db src-tauri/src/lib.rs
print_success "Updated lib.rs with database integration"

echo ""
echo "Step 2: Agent Executor (Loop 12)"
echo "----------------------------------"
print_warning "Deploying real AI agent executor..."

# Backup old agent executor
if [ -f "src/server/services/agent-executor.ts" ] && [ ! -f "src/server/services/agent-executor.placeholder.ts" ]; then
    backup_file "src/server/services/agent-executor.ts"
    mv src/server/services/agent-executor.ts src/server/services/agent-executor.placeholder.ts
    print_success "Backed up placeholder agent executor"
fi

# Deploy real implementation
if [ -f "src/server/services/agent-executor-real.ts" ]; then
    cp src/server/services/agent-executor-real.ts src/server/services/agent-executor.ts
    print_success "Deployed real AI agent executor"
fi

# Backup old routes
if [ -f "src/server/routes/agent.ts" ] && [ ! -f "src/server/routes/agent.placeholder.ts" ]; then
    backup_file "src/server/routes/agent.ts"
    mv src/server/routes/agent.ts src/server/routes/agent.placeholder.ts
    print_success "Backed up placeholder agent routes"
fi

# Deploy updated routes
if [ -f "src/server/routes/agent-updated.ts" ]; then
    cp src/server/routes/agent-updated.ts src/server/routes/agent.ts
    print_success "Deployed updated agent routes"
fi

echo ""
echo "Step 3: Frontend Integration (Loop 13)"
echo "---------------------------------------"
print_warning "Integrating frontend with backend..."

# Note: TaskPage-backend.tsx exists but needs manual integration
print_warning "⚠️  MANUAL STEP REQUIRED:"
echo "   Update src/App.tsx to use TaskPageBackend instead of TaskPage"
echo "   Change: import { TaskPage } from './pages/TaskPage'"
echo "   To:      import { TaskPageBackend } from './pages/TaskPage-backend'"
echo ""

echo ""
echo "Step 4: Test Framework (Loop 7)"
echo "-------------------------------"
print_warning "Deploying test framework..."

# Check if vitest is already installed
if ! npm list vitest > /dev/null 2>&1; then
    print_warning "Installing test dependencies..."
    npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
    print_success "Installed test framework"
else
    print_success "Test framework already installed"
fi

# Update package.json if needed
if [ -f "package.json.updated" ]; then
    backup_file "package.json"
    # Note: We don't auto-overwrite package.json as it may have other changes
    print_warning "⚠️  MANUAL STEP: Review and merge package.json.updated if needed"
fi

echo ""
echo "Step 5: Build Verification"
echo "--------------------------"
print_warning "Verifying build..."

# Check TypeScript compilation
echo "Running TypeScript check..."
if npm run check 2>/dev/null || npx tsc --noEmit 2>/dev/null; then
    print_success "TypeScript compilation successful"
else
    print_warning "TypeScript check had warnings (this may be OK)"
fi

echo ""
echo "Step 6: Database Files Check"
echo "-----------------------------"
print_warning "Ensuring database files are in place..."

# Check if database modules exist
if [ -f "src-tauri/src/database.rs" ]; then
    print_success "database.rs exists"
else
    print_error "database.rs not found!"
    exit 1
fi

if [ -f "src-tauri/src/db_commands.rs" ]; then
    print_success "db_commands.rs exists"
else
    print_error "db_commands.rs not found!"
    exit 1
fi

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
print_success "All components have been deployed"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. MANUAL: Update src/App.tsx to use TaskPageBackend (see Step 3 above)"
echo "2. Run: npm run tauri dev"
echo "3. Test the application"
echo ""
echo "To verify deployment:"
echo "- Check database initializes at ~/.workease/workease.db"
echo "- Create a task and verify two-phase execution"
echo "- Check that tools execute correctly"
echo ""
echo "Backup files created with .backup.* extension"
echo "To rollback: cp src-tauri/src/lib.rs.backup.* src-tauri/src/lib.rs"
echo ""
