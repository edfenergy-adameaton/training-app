#!/bin/bash
# Build script for Image Lambda TypeScript function

echo "🖼️ Building Image Lambda TypeScript function..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build
echo "🧹 Cleaning previous image build..."
rm -rf image_dist
rm -f image_lambda.zip

# Create build directory
mkdir -p image_dist

# Compile TypeScript for image lambda
echo "⚡ Compiling Image Lambda TypeScript..."
npx tsc image_lambda.ts --outDir image_dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck

# Check if compilation was successful
if [ ! -f "image_dist/image_lambda.js" ]; then
    echo "❌ Image Lambda TypeScript compilation failed!"
    exit 1
fi

# Copy package.json to dist (for Lambda runtime dependencies)
cp package.json image_dist/

echo "✅ Image Lambda build complete!"