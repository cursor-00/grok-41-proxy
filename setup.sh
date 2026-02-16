#!/bin/bash

# =============================================================================
# Puter.js Proxy Server - Setup Script
# =============================================================================
# A unified AI proxy server for free access to multiple LLM providers
# 
# Author: Mulky Malikul Dhaher
# Email: mulkymalikuldhaher@email.com
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
print_banner() {
    echo -e "${BLUE}"
    cat << 'EOF'
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║   🚀 Puter.js Proxy Server - Setup                         ║
    ║   Free AI Access for Everyone                              ║
    ║                                                            ║
    ║   Author: Mulky Malikul Dhaher                             ║
    ║   Email: mulkymalikuldhaher@email.com                      ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        print_status "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION is too old!"
        print_status "Please install Node.js 18+"
        exit 1
    fi
    
    print_success "Node.js $(node -v) detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed!"
        exit 1
    fi
    
    print_success "npm $(npm -v) detected"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_warning "Git not detected - some features may not work"
    else
        print_success "Git detected"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    
    npm install --no-progress --no-audit 2>&1 | while IFS= read -r line; do
        echo -e "${BLUE}[npm]${NC} $line"
    done
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Create environment file
setup_env() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
        else
            cat > .env << 'EOF'
# Puter.js Proxy Environment Configuration
# Get your token from https://puter.com/#/account
# PUTER_AUTH_TOKEN=your_token_here

# Server Configuration
PORT=3333
NODE_ENV=development

# Logging
LOG_LEVEL=info
EOF
            print_success "Created default .env file"
        fi
        print_warning "Please edit .env and add your PUTER_AUTH_TOKEN for full access"
    else
        print_success ".env already exists"
    fi
}

# Verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check required files
    REQUIRED_FILES=("index.js" "client.js" "router.js" "package.json")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Missing required file: $file"
            exit 1
        fi
    done
    
    print_success "All required files present"
    
    # Check node_modules
    if [ ! -d "node_modules" ]; then
        print_error "node_modules not found - installation may have failed"
        exit 1
    fi
    
    print_success "node_modules directory present"
}

# Run quick test
run_test() {
    print_status "Running quick connectivity test..."
    
    # Test if server can start (will be killed after 3 seconds)
    timeout 3 node index.js 2>/dev/null || true
    
    # Test if port is available
    if lsof -i :3333 &>/dev/null; then
        print_success "Port 3333 is available"
    else
        print_warning "Port 3333 may be in use - check with: sudo lsof -i :3333"
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ Setup Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo -e "  ${BLUE}1.${NC} Edit .env and add your Puter.js token (optional):"
    echo "     nano .env"
    echo ""
    echo -e "  ${BLUE}2.${NC} Start the server:"
    echo "     npm start"
    echo ""
    echo -e "  ${BLUE}3.${NC} Test the API:"
    echo "     curl -X POST http://localhost:3333/v1/chat/completions \\"
    echo "       -H 'Content-Type: application/json' \\"
    echo "       -d '{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}'"
    echo ""
    echo -e "  ${BLUE}4.${NC} For OpenCode integration, edit /home/mulky/opencode.json"
    echo ""
    echo -e "  ${BLUE}5.${NC} Documentation: See README.md"
    echo ""
    echo -e "  ${YELLOW}Note:${NC} The server runs on port 3333 by default"
    echo ""
}

# Main execution
main() {
    print_banner
    
    echo ""
    print_status "Starting Puter.js Proxy Server setup..."
    echo ""
    
    check_prerequisites
    install_dependencies
    setup_env
    verify_installation
    run_test
    print_next_steps
    
    exit 0
}

# Run main function
main "$@"
