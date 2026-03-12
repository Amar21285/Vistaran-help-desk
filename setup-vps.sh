#!/bin/bash

# Vistaran Help Desk - VPS Setup Script
# This script installs Node.js, PM2, and prepares the environment.

echo "🚀 Starting VPS Setup for Vistaran Help Desk..."

# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (Version 20 LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 and Vite globally
echo "📦 Installing PM2 and build tools..."
sudo npm install -g pm2 vite typescript

# 4. Check versions
node -v
npm -v
pm2 -v

echo "✅ Environment preparation complete!"
echo "Next steps:"
echo "1. Clone your repo: git clone <your-repo-url>"
echo "2. Run: npm install"
echo "3. Run: npm run build"
echo "4. Run: pm2 start ecosystem.config.cjs"
