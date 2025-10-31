#!/bin/bash

# ========================================
# AI Food Tracker - Start Script
# ========================================
# Starts both backend and frontend servers
# Run: bash start.sh
# ========================================

echo "🚀 Starting AI Food Tracker..."
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Run this script from the ai-food-tracker root directory"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    echo "👋 Goodbye!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd backend
node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start"
    exit 1
fi

echo "✅ Backend running on http://localhost:3001"
echo ""

# Start frontend
cd ../frontend
echo "📱 Starting frontend..."
echo "   Web: http://localhost:19006"
echo "   Mobile: Scan QR code with Expo Go app"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npx expo start --web

# Cleanup when frontend exits
cleanup