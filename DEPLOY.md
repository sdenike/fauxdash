# FauxDash Deployment Guide

## Current Deployment Method

**Important**: With the current Docker setup, code changes require a full rebuild because the Next.js build is created inside the Docker image.

### Full Rebuild (Required for ALL changes)

```bash
docker compose down
docker compose build
docker compose up -d
```

This takes ~90 seconds and is needed for:
- Code changes (TypeScript, React components, API routes)
- Dependency changes (package.json)
- Docker configuration changes
- Any source file modifications

### Why Full Rebuilds?

The Dockerfile currently:
1. Copies source code into the image
2. Runs `npm run build` inside Docker
3. Creates the standalone output as part of the image

This means the built code is baked into the Docker image, so we can't just restart the container to pick up changes.

### Future Optimization

To enable quick deploys without rebuilds, we could:
- Mount `.next/standalone` as a volume
- Build locally and copy into running container
- Use development mode with volume mounts

But for now, full rebuilds are the simplest and most reliable approach.

## How It Works

The Docker container uses Next.js standalone output mode:
- `npm run build` creates `.next/standalone` locally
- Docker copies this pre-built output
- `docker compose restart app` picks up the new build

This means code changes don't require rebuilding the Docker image - just restart!

## Version Updates

The version is stored in `package.json` and displayed in the Admin Dashboard.

When making changes:
1. Update version in `package.json` using semantic versioning:
   - **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
   - **MINOR**: New features, backward compatible (e.g., 0.4.0 → 0.5.0)
   - **PATCH**: Bug fixes (e.g., 0.4.0 → 0.4.1)
2. Build and restart
3. The new version will appear in Admin Dashboard header

## Version History

**v0.4.1** - Added uncategorized items section, version display in admin dashboard
- Uncategorized items now show at the top with warning banner
- Drag uncategorized items into categories to organize them
- Version number displayed in admin dashboard header

**v0.4.0** - Added category expand/collapse, category conversion, item conversion with category selection, and cache clearing.
