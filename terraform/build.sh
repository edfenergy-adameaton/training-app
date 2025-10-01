#!/bin/bash
# Build script for TypeScript Lambda function
# This is a simple wrapper for Terraform - all logic is in package.json

echo "🔨 Building TypeScript Lambda function..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the complete build and package process
echo "⚡ Running build process..."
npm run package

# Validate the build was successful
npm run validate