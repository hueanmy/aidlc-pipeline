#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f public-package.json ]]; then
	echo "public-package.json not found"
	exit 1
fi

# Auto-bump patch version in public manifest
CURRENT=$(node -p "require('./public-package.json').version")
NEW=$(node -p "const [a,b,c]='$CURRENT'.split('.'); a+'.'+b+'.'+(+c+1)")
node -e "const fs=require('fs'); const p=require('./public-package.json'); p.version='$NEW'; fs.writeFileSync('public-package.json', JSON.stringify(p, null, 2)+'\\n')"
echo "Public version: $CURRENT -> $NEW"

# Build server
echo "Building..."
cd server && npm run build && cd ..

# Swap package.json for public version
cp package.json package.json.bak
cp public-package.json package.json

restore() {
	if [[ -f package.json.bak ]]; then
		mv package.json.bak package.json
	fi
}
trap restore EXIT

# Publish to public npm (not CodeArtifact)
echo "Publishing aidlc-pipeline to npmjs.com..."
npm publish --registry https://registry.npmjs.org

echo ""
echo "Published aidlc-pipeline@$NEW to public npm"
