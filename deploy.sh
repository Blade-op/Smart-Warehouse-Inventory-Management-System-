#!/bin/bash

# Smart Warehouse Inventory Management System - Deployment Script
# This script helps with building and preparing the application for deployment

set -e

echo "🚀 Smart Warehouse Inventory Management System - Deployment Preparation"
echo "====================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_success "npm $(npm -v) is installed"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd server
    npm install
    cd ..
    print_success "Backend dependencies installed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    npm run build
    print_success "Frontend built successfully"
}

# Check environment files
check_env_files() {
    print_status "Checking environment configuration..."

    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found. Please create it with your environment variables."
        print_warning "Copy .env.example to .env.local and fill in your values."
    else
        print_success ".env.local found"
    fi

    if [ ! -f "server/.env" ]; then
        print_warning "server/.env not found. Please create it with your backend environment variables."
        print_warning "Copy .env.example to server/.env and fill in your values."
    else
        print_success "server/.env found"
    fi
}

# Test build
test_build() {
    print_status "Testing production build..."
    if [ -d "dist" ]; then
        print_success "Build directory exists"
        if [ -f "dist/index.html" ]; then
            print_success "index.html found in build directory"
        else
            print_error "index.html not found in build directory"
            exit 1
        fi
    else
        print_error "Build directory not found. Run build first."
        exit 1
    fi
}

# Create deployment summary
create_deployment_summary() {
    print_status "Creating deployment summary..."

    cat > deployment-summary.md << 'EOF'
# Deployment Summary - Smart Warehouse Inventory Management System

## 📋 Pre-deployment Checklist

### ✅ Environment Setup
- [ ] MongoDB Atlas database created and connection string obtained
- [ ] Firebase project configured with authentication enabled
- [ ] Google OAuth credentials obtained
- [ ] Environment variables configured (.env.local and server/.env)

### ✅ Application Build
- [ ] Frontend built successfully (`npm run build`)
- [ ] Backend dependencies installed
- [ ] All environment variables validated

## 🚀 Deployment Options

### Option 1: Render (Recommended)
1. **Backend Deployment**:
   - Service Type: Web Service
   - Runtime: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment Variables: See render.yaml

2. **Frontend Deployment**:
   - Service Type: Static Site
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Environment Variables: See render.yaml

### Option 2: Vercel
1. **Backend**: `cd server && vercel --prod`
2. **Frontend**: `vercel --prod`

### Option 3: Docker
1. **Build**: `docker build -t smart-warehouse .`
2. **Run**: `docker run -p 5000:5000 smart-warehouse`

## 🔧 Environment Variables Required

### Frontend (.env.local)
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (server/.env)
```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
PORT=5000
CLIENT_ORIGIN=https://your-frontend-url.onrender.com
```

## 📊 Post-Deployment Steps

1. **Seed Database**:
   ```bash
   # Connect to your deployed backend and run:
   npm run seed:admin
   npm run seed:data
   npm run seed:inventory
   ```

2. **Test Application**:
   - Visit your deployed frontend URL
   - Try logging in with admin@angiras.com
   - Test all features (products, inventory, warehouses)

3. **Domain Configuration** (Optional):
   - Point your custom domain to the deployment platform
   - Update CORS settings if necessary

## 🔐 Default Admin Credentials
- **Email**: admin@angiras.com
- **Password**: password (change after first login)

## 📞 Support
If you encounter any issues during deployment, check:
1. Environment variables are correctly set
2. Database connection is working
3. CORS settings allow your frontend domain
4. All dependencies are installed

EOF

    print_success "Deployment summary created: deployment-summary.md"
}

# Main deployment preparation
main() {
    print_status "Starting deployment preparation..."

    check_node
    check_npm
    check_env_files
    install_frontend_deps
    install_backend_deps
    build_frontend
    test_build
    create_deployment_summary

    echo ""
    print_success "🎉 Deployment preparation completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Review and configure your environment variables"
    echo "2. Choose your deployment platform (Render/Vercel)"
    echo "3. Follow the deployment guide in deployment-summary.md"
    echo "4. Test your deployed application"
}

# Run main function
main "$@"