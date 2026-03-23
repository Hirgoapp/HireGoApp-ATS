# CI/CD Pipeline Guide

This document describes the automated build, test, and deployment pipeline for ATS SaaS.

## Overview

The pipeline is defined in [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) and runs on:
- **Pushes** to `main`, `develop`, or `release/*` branches
- **Pull requests** to `main` or `develop`

## Pipeline Stages

### 1. Build & Test (`build-and-test`)

Runs on every push/PR.

**Steps**:
1. Checkout code
2. Setup Node.js 20.x with npm cache
3. Install dependencies (`npm ci`)
4. Lint code (`npm run lint`) — non-blocking
5. Build application (`npm run build`)
6. Run tests with coverage (`npm run test:cov`)
7. Upload coverage to Codecov (optional)

**Status**: ✅ Required to pass before proceeding

**Services**:
- PostgreSQL 15 on localhost:5432 (for integration tests)

**Timeout**: 30 minutes

### 2. Generate OpenAPI (`generate-openapi`)

Runs after build-and-test on pushes only.

**Steps**:
1. Checkout and setup Node.js
2. Build application
3. Start server in background
4. Fetch OpenAPI spec from `GET /api-json`
5. Validate spec with swagger-cli
6. Upload to GitHub Artifacts (90-day retention)

**Status**: Generates OpenAPI artifact for distribution

**Artifact URL**: Available in Actions → Artifacts section

**Validation**: Uses `@apidevtools/swagger-cli` to ensure spec correctness

### 3. Docker Build (`docker-build`)

Runs on pushes to `main` or `develop` only.

**Steps**:
1. Setup Docker Buildx
2. Log in to GitHub Container Registry
3. Extract metadata (version, branch, SHA tags)
4. Build multi-stage Docker image:
   - **Builder stage**: Node.js 20 Alpine → npm install → npm run build
   - **Production stage**: Node.js 20 Alpine → copy dist → non-root user → health check
5. Push to `ghcr.io/<owner>/<repo>`

**Image Tagging**:
- Branch name (e.g., `main`, `develop`)
- Semantic version if tagged (e.g., `v1.0.0`)
- Git SHA (e.g., `sha-abc123def`)

**Example**: `ghcr.io/myorg/ats:main`, `ghcr.io/myorg/ats:sha-abc123`

**Cache**: Uses GitHub Actions cache for faster builds

### 4. Deploy to Staging (`deploy-staging`)

Runs on pushes to `develop` only (after Docker build succeeds).

**Environment**: `staging` (defined in GitHub)
- **URL**: https://staging-api.example.com
- **Concurrency**: None (staging is shared)

**Steps**:
1. Deploy to staging (placeholder — customize with your infrastructure)
2. Run smoke tests against staging endpoint
3. Verify `/health` endpoint returns 200

**Example Deployment Scripts**:

**Kubernetes**:
```bash
kubectl set image deployment/ats-api \
  ats-api=ghcr.io/myorg/ats:develop \
  -n ats-staging
```

**Docker Swarm**:
```bash
docker service update \
  --image ghcr.io/myorg/ats:develop \
  ats-api
```

**ECS**:
```bash
aws ecs update-service \
  --cluster ats-staging \
  --service ats-api \
  --force-new-deployment
```

### 5. Deploy to Production (`deploy-production`)

Runs on pushes to `main` only (after Docker build succeeds).

**Environment**: `production` (defined in GitHub)
- **URL**: https://api.example.com
- **Concurrency**: Strict (max 1 concurrent deployment)

**Steps**:
1. Notify deployment start (log commit & branch)
2. Deploy to production
3. Run health checks on `/health` and `/readiness`
4. Notify deployment success

**Prerequisites**:
- All tests pass
- Docker image built and pushed
- Staging deployment successful (recommended)

**Rollback**:
```bash
# Revert to previous image
kubectl set image deployment/ats-api \
  ats-api=ghcr.io/myorg/ats:<previous-sha> \
  -n ats-production
```

## Configuration

### Environment Variables

Set in GitHub repository **Settings** → **Secrets and variables**:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DOCKER_REGISTRY` | Container registry | `ghcr.io` |
| `DEPLOYMENT_TOKEN` | Deploy auth (Kube, ECS, etc.) | SSH key or token |
| `PRODUCTION_URL` | Production endpoint | `https://api.example.com` |
| `STAGING_URL` | Staging endpoint | `https://staging-api.example.com` |

### Customize Deployments

Edit the deployment jobs in [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml):

```yaml
deploy-production:
  steps:
    - name: Deploy to production
      run: |
        # Replace with your actual deployment
        kubectl set image deployment/ats-api \
          ats-api=${{ env.REGISTRY }}/${{ github.repository }}:main
```

### Branch Protection Rules

Recommend setting these in GitHub **Settings** → **Branches** → **Branch protection rules**:

For `main` branch:
- ✅ Require status checks to pass before merging
- ✅ Require build-and-test to pass
- ✅ Require pull request reviews before merging
- ✅ Dismiss stale pull request approvals
- ✅ Require branches to be up to date before merging

## Monitoring Pipeline

### View Pipeline Status

1. Go to **Actions** tab in GitHub
2. Select **Build, Test & Deploy** workflow
3. Click a run to see logs

### View Artifacts

1. Go to **Actions** → [workflow run]
2. Scroll to **Artifacts** section
3. Download `openapi-spec` (contains `openapi.json`)

### Alerts

Configure notifications in GitHub:
1. **Settings** → **Notifications**
2. Subscribe to workflow failures

## Local Testing

Test the pipeline locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
choco install act  # Windows

# Run workflow locally
act push -j build-and-test
act push -j docker-build
```

## Troubleshooting

**Q: Build fails with "npm ci: not found"**
- Ensure Node.js and npm are installed in the runner
- Check `setup-node` step is configured correctly

**Q: Docker push fails**
- Verify `GITHUB_TOKEN` has `packages:write` permission
- Check registry login step

**Q: OpenAPI spec generation fails**
- Ensure server starts on port 3000
- Verify `/api-json` endpoint is accessible
- Check Swagger/Nest setup in `main.ts`

**Q: Deployment fails with "permission denied"**
- Verify deployment token/credentials are set in GitHub Secrets
- Check kubectl/AWS/Docker credentials have correct permissions
- Ensure target environment is accessible from GitHub Actions runners

## Best Practices

1. **Staging First**: Always deploy to staging before production
2. **Test Artifacts**: Download OpenAPI spec from artifacts and test against live API
3. **Notifications**: Set up Slack/Teams notifications for failures
4. **Rollback Plan**: Keep previous images tagged for quick rollback
5. **Secrets Management**: Use GitHub Secrets, not hardcoded values
6. **Rate Limiting**: Docker Hub has rate limits; use private registry or GitHub Container Registry
7. **Cache Optimization**: The workflow caches `npm` packages; clear cache if issues arise

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
