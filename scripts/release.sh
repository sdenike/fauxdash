#!/bin/bash
# =============================================================================
# Faux|Dash Release Script
# =============================================================================
# Usage: ./scripts/release.sh [patch|minor|major] "Release description"
#
# Examples:
#   ./scripts/release.sh patch "Fix memory leak"
#   ./scripts/release.sh minor "Add new feature"
#   ./scripts/release.sh major "Breaking changes"
#
# Or specify exact version:
#   ./scripts/release.sh 0.5.37 "Release description"
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Faux|Dash Release Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Current version: ${YELLOW}v${CURRENT_VERSION}${NC}"
echo ""

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}You have uncommitted changes:${NC}"
    git status --short
    echo ""
fi

# Determine new version
if [[ -z "$1" ]]; then
    echo -e "${RED}Error: Please specify version type or number${NC}"
    echo ""
    echo "Usage: $0 [patch|minor|major|x.x.x] \"Release description\""
    echo ""
    echo "Examples:"
    echo "  $0 patch \"Fix bug in login\"        # 0.5.36 → 0.5.37"
    echo "  $0 minor \"Add new dashboard\"       # 0.5.36 → 0.6.0"
    echo "  $0 major \"Breaking API changes\"    # 0.5.36 → 1.0.0"
    echo "  $0 0.5.40 \"Custom version\"         # 0.5.36 → 0.5.40"
    exit 1
fi

# Parse version argument
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$1" in
    patch)
        NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
        ;;
    minor)
        NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
        ;;
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        ;;
    *)
        # Assume it's a specific version number
        if [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            NEW_VERSION="$1"
        else
            echo -e "${RED}Error: Invalid version format '$1'${NC}"
            echo "Expected: patch, minor, major, or x.x.x"
            exit 1
        fi
        ;;
esac

# Get release description
DESCRIPTION="${2:-Release v${NEW_VERSION}}"

echo -e "New version:     ${GREEN}v${NEW_VERSION}${NC}"
echo -e "Description:     ${DESCRIPTION}"
echo ""

# Confirm with user
read -p "Proceed with release? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Release cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1/6: Updating package.json...${NC}"
# Update package.json version
node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.version = '${NEW_VERSION}';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"
echo -e "${GREEN}✓ Version updated to ${NEW_VERSION}${NC}"

echo ""
echo -e "${BLUE}Step 2/6: Checking CHANGELOG.md...${NC}"
# Check if changelog has been updated for this version
if grep -q "## \[${NEW_VERSION}\]" CHANGELOG.md; then
    echo -e "${GREEN}✓ CHANGELOG.md already has entry for v${NEW_VERSION}${NC}"
else
    echo -e "${YELLOW}! CHANGELOG.md does not have entry for v${NEW_VERSION}${NC}"
    echo ""
    echo -e "Please add the following to the top of CHANGELOG.md (after the header):"
    echo ""
    echo -e "${BLUE}## [${NEW_VERSION}] - $(date +%Y-%m-%d)${NC}"
    echo ""
    echo "### Added"
    echo "- Description of new features"
    echo ""
    echo "### Fixed"
    echo "- Description of bug fixes"
    echo ""
    echo "### Changed"
    echo "- Description of changes"
    echo ""
    read -p "Press Enter after updating CHANGELOG.md (or Ctrl+C to cancel)..."

    # Verify changelog was updated
    if ! grep -q "## \[${NEW_VERSION}\]" CHANGELOG.md; then
        echo -e "${RED}Error: CHANGELOG.md still missing entry for v${NEW_VERSION}${NC}"
        echo "Reverting package.json..."
        node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.version = '${CURRENT_VERSION}';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"
        exit 1
    fi
    echo -e "${GREEN}✓ CHANGELOG.md updated${NC}"
fi

echo ""
echo -e "${BLUE}Step 3/6: Staging changes...${NC}"
git add package.json CHANGELOG.md
# Also add any other changed files
git add -A
echo -e "${GREEN}✓ Changes staged${NC}"

echo ""
echo -e "${BLUE}Step 4/6: Creating commit...${NC}"
git commit -m "release: v${NEW_VERSION} - ${DESCRIPTION}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
echo -e "${GREEN}✓ Commit created${NC}"

echo ""
echo -e "${BLUE}Step 5/6: Pushing to remote...${NC}"
git push
echo -e "${GREEN}✓ Pushed to remote${NC}"

echo ""
echo -e "${BLUE}Step 6/6: Creating GitHub release...${NC}"
gh release create "v${NEW_VERSION}" \
    --title "v${NEW_VERSION}" \
    --notes "See [CHANGELOG.md](https://github.com/sdenike/fauxdash/blob/master/CHANGELOG.md) for details."
echo -e "${GREEN}✓ GitHub release created${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Release v${NEW_VERSION} Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Docker images will be built automatically:"
echo "  - ghcr.io/sdenike/fauxdash:latest"
echo "  - ghcr.io/sdenike/fauxdash:${NEW_VERSION}"
echo ""
echo "Monitor build: https://github.com/sdenike/fauxdash/actions"
echo "Release page:  https://github.com/sdenike/fauxdash/releases/tag/v${NEW_VERSION}"
echo ""
