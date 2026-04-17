#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Auto-bump patch version (pure bash — no node dependency)
CURRENT=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
NEW="$MAJOR.$MINOR.$((PATCH + 1))"
node -e "const p=require('./package.json'); p.version='$NEW'; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2)+'\n')"
echo "Version: $CURRENT → $NEW"

# Build server (outputs to server/dist, which is shipped)
echo "Building..."
cd server && npm run build && cd ..

# Publish (publishConfig in package.json points to npmjs.com)
echo "Publishing aidlc-pipeline@$NEW..."
npm publish

# Commit version bump if inside a git repo
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add package.json server/dist
  git commit -m "v$NEW" || true
fi

echo ""
echo "✅ Published aidlc-pipeline@$NEW"
