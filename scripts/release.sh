#!/bin/bash

# Script for releasing mcp-server-perplexity

set -e

echo "🚀 Starting release process..."

# Make sure we are in the correct directory
if [ ! -f "perplexity-ask/package.json" ]; then
    echo "❌ Error: please run this script from the root directory of the project"
    exit 1
fi

# Move to the package directory
cd perplexity-ask

echo "📝 Checking git status..."


echo "📦 Installing dependencies..."
pnpm i

echo "🔨 Building the project..."
pnpm run build

echo "🧪 Checking if the project built correctly..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js not found after build"
    exit 1
fi

echo "📋 Current version:"
npm version --json

echo ""
echo "Choose release type:"
echo "1) patch (0.1.0 -> 0.1.1)"
echo "2) minor (0.1.0 -> 0.2.0)"
echo "3) major (0.1.0 -> 1.0.0)"
echo "4) Cancel"

read -p "Enter number (1-4): " choice

case $choice in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        echo "🚫 Release canceled"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo "📈 Updating version ($VERSION_TYPE)..."
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)

echo "✅ New version: $NEW_VERSION"

# Go back to the root directory for git operations
cd ..

echo "📝 Creating commit..."
git add perplexity-ask/package.json perplexity-ask/pnpm-lock.yaml
git commit -m "chore: bump version to $NEW_VERSION"

echo "🏷️  Creating tag..."
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

echo "⬆️  Pushing changes..."
git push origin main
git push origin "$NEW_VERSION"

echo ""
echo "🎉 Release created successfully!"
echo "📦 Version: $NEW_VERSION"
echo "🏷️  Tag: $NEW_VERSION"
echo ""
echo "Now:"
echo "1. GitHub Actions will automatically publish the package to npm"
echo "2. A release will be created on GitHub"
echo "3. Check the status in the Actions tab of your repository"
