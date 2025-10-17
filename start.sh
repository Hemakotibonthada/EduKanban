#!/bin/bash

# EduKanban Development Start Script

echo "🚀 Starting EduKanban Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "🔄 Starting MongoDB..."
    # Try to start MongoDB service (works on most systems)
    sudo systemctl start mongodb 2>/dev/null || brew services start mongodb-community 2>/dev/null || mongod --fork --logpath /var/log/mongodb.log 2>/dev/null
    sleep 2
fi

# Install dependencies if not present
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check for environment files
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found!"
    echo "Please create backend/.env with required environment variables."
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Warning: frontend/.env file not found!"
    echo "Please create frontend/.env with required environment variables."
fi

# Start the application
echo "🎯 Starting application..."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Start both frontend and backend concurrently
npm run dev