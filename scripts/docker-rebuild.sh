#!/bin/bash

# Faux|Dash Docker Rebuild Script
# This script clears Docker cache and rebuilds the application

echo "🧹 Stopping containers..."
docker-compose down

echo "🗑️  Clearing Docker build cache..."
docker builder prune -f

echo "🏗️  Building application..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

echo "✅ Done! Application is running at http://localhost:8081"
