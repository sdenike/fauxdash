#!/bin/bash

# FauxDash Quick Deploy Script
# Builds the Next.js app and restarts the Docker container (no full rebuild needed)

set -e

echo "🔨 Building Next.js application..."
npm run build

echo "🔄 Restarting Docker container..."
docker compose restart app

echo "✅ Deployment complete! The app should be available in a few seconds."
echo "📝 Check logs with: docker compose logs -f app"
