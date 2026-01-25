#!/bin/bash

# Faux|Dash Docker Build Script (with cache)
# This script rebuilds the application using Docker cache for faster builds

echo "🧹 Stopping containers..."
docker-compose down

echo "🏗️  Building application (using cache)..."
docker-compose build

echo "🚀 Starting containers..."
docker-compose up -d

echo "✅ Done! Application is running at http://localhost:8081"
