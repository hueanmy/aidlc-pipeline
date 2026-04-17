#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Check for uncommitted changes
if git diff --quiet && git diff --cached --quiet; then
  echo "No changes to publish."
  exit 0
fi

# Show what changed
echo "=== Changes detected ==="
git diff --stat
git diff --cached --stat
echo ""

# Auto-bump patch version
CURRENT=$(node -p "require('./package.json').version")
NEW=$(node -p "const [a,b,c]='$CURRENT'.split('.'); a+'.'+b+'.'+(+c+1)")
node -e "const p=require('./package.json'); p.version='$NEW'; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2)+'\n')"
echo "Version: $CURRENT → $NEW"

# Build
echo "Building..."
cd server && npm run build && cd ..

# Commit + publish
git add -A
git commit -m "v$NEW"
npm publish

echo ""
echo "✅ Published cf-sdlc-pipeline@$NEW"
