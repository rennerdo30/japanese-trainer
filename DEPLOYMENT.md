# GitHub Pages Deployment Guide

## Current Issue

If deployments are stuck in "deployment_queued" status, it's because GitHub Pages is configured to deploy from a branch instead of GitHub Actions.

## Solution

1. Go to repository Settings → Pages: https://github.com/rennerdo30/japanese-trainer/settings/pages
2. Under "Build and deployment", change "Source" from **"Deploy from a branch"** to **"GitHub Actions"**
3. Save the changes

## Workflow

The deployment workflow (`.github/workflows/deploy.yml`) is already configured and will:
- Trigger on pushes to `master` branch
- Build the static site (no build step needed - just uploads files)
- Deploy to GitHub Pages

## Troubleshooting

### Check deployment status:
```bash
gh run list --workflow "Deploy to GitHub Pages"
```

### View workflow details:
```bash
gh run view <run-id>
```

### Cancel stuck deployments:
```bash
gh run cancel <run-id>
```

### Check Pages configuration:
```bash
gh api repos/rennerdo30/japanese-trainer/pages --jq '.source'
```

If it shows `{"branch":"master","path":"/"}` → Pages is using branch deployment (needs to be changed to Actions)
If it shows `null` or empty → Pages is using GitHub Actions ✅
