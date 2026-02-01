#!/bin/bash

echo "🔧 Setting up Git hooks..."

# Check if husky is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm first."
    exit 1
fi

# Install husky if not already installed
if [ ! -d "node_modules/husky" ]; then
    echo "📦 Installing husky..."
    npm install --save-dev husky
fi

# Initialize husky
echo "🎣 Initializing husky..."
npx husky init

# Make pre-commit hook executable
chmod +x .husky/pre-commit

echo "✅ Git hooks setup complete!"
echo ""
echo "Pre-commit hook will now run contract tests before each commit."
echo ""
echo "To skip the hook (not recommended):"
echo "  git commit --no-verify"
