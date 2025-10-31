#!/bin/bash

# ========================================
# AI Food Tracker - Automated Setup Script
# ========================================
# This script automates the initial setup
# Run: bash setup.sh
# ========================================

echo "🚀 AI Food Tracker - Automated Setup"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Create project structure
echo "📁 Creating project structure..."
mkdir -p ai-food-tracker/backend/routes
mkdir -p ai-food-tracker/frontend/components
mkdir -p ai-food-tracker/frontend/services
mkdir -p ai-food-tracker/frontend/utils
cd ai-food-tracker

echo "✅ Project structure created"
echo ""

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Initialize npm
npm init -y

# Install backend dependencies
echo "Installing backend dependencies..."
npm install express cors dotenv @google-cloud/vision @google/generative-ai multer firebase-admin

echo "✅ Backend dependencies installed"
echo ""

# Setup Frontend
cd ../
echo "📱 Setting up frontend..."

# Create Expo app
npx create-expo-app frontend --template blank

cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install firebase axios expo-image-picker
npx expo install react-native-safe-area-context

echo "✅ Frontend dependencies installed"
echo ""

# Back to root
cd ..

echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Copy all code files to their respective folders"
echo "2. Update backend/.env with your API keys"
echo "3. Update frontend/services/firebase.js with your Firebase config"
echo "4. Add serviceAccountKey.json to backend/"
echo "5. Run: cd backend && node server.js"
echo "6. In new terminal: cd frontend && npx expo start --web"
echo ""
echo "🎉 Happy coding!"