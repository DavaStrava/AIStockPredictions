# CI/CD Setup Documentation

**Created:** 2026-01-31
**Status:** ✅ Complete and Ready

---

## Overview

This project has a complete CI/CD pipeline that:
- ✅ Runs tests on every push and PR
- ✅ Prevents breaking changes with contract tests
- ✅ Validates builds before merge
- ✅ Runs lint checks
- ✅ Detects API changes automatically
- ✅ Provides pre-commit hooks for fast feedback

---

## Components

### 1. GitHub Actions Workflows

#### Main Test Workflow (`.github/workflows/test.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests

**Jobs:**
1. **Test Job**
   - Runs contract tests (quick check)
   - Runs full test suite
   - Uploads test results

2. **Build Job**
   - Verifies application builds successfully
   - Depends on tests passing

3. **Lint Job**
   - Runs ESLint checks
   - Ensures code quality

**Status Badge:**
```markdown
![Tests](https://github.com/YOUR_USERNAME/AIStockPredictions/workflows/Tests/badge.svg)
```

---

#### PR Checks Workflow (`.github/workflows/pr-checks.yml`)
**Triggers:** Pull Request opened/updated

**Jobs:**
1. **PR Quality Checks**
   - 🔍 Contract tests (breaking change detection)
   - 📊 Test coverage report
   - 🏗️ Build verification
   - 📝 Test summary in PR

2. **API Changes Detection**
   - Automatically detects API route modifications
   - Runs contract tests if APIs changed
   - Comments on PR with checklist
   - Shows diff summary

**Example PR Comment:**
```
## 🔍 API Changes Detected

This PR modifies API routes. Contract tests have been run to ensure no breaking changes.

**Please verify:**
- [ ] Response structures are unchanged
- [ ] All tests pass
- [ ] Documentation is updated if needed
```

---

### 2. Pre-Commit Hooks

#### Setup (One-time)
```bash
./setup-hooks.sh
```

This installs and configures Husky to run contract tests before each commit.

#### What It Does
```
git commit -m "Add feature"

🧪 Running contract tests before commit...
✓ src/__tests__/api/contract-tests.test.ts (15)
✅ Contract tests passed - safe to commit!

[main abc123] Add feature
```

#### If Tests Fail
```
❌ Contract tests failed!
Your changes may break the frontend.

To fix:
  1. Check test output above
  2. Ensure API response structures are unchanged
  3. Update tests if intentional changes
```

#### Skip Hook (Not Recommended)
```bash
git commit --no-verify
```

---

## NPM Scripts

### Test Scripts
```bash
# Run all tests (watch mode)
npm test

# Run all tests (CI mode)
npm run test:ci

# Run only contract tests (fast)
npm run test:contracts

# Run with coverage report
npm run test:coverage

# Open test UI
npm run test:ui
```

### Build Scripts
```bash
# Development build
npm run dev

# Production build
npm run build

# Lint code
npm run lint
```

---

## Workflow Examples

### Typical Development Flow

```bash
# 1. Make changes to code
vim src/app/api/predictions/route.ts

# 2. Run tests locally
npm run test:contracts

# 3. Commit (pre-commit hook runs automatically)
git commit -m "Update predictions API"

# 4. Push (GitHub Actions runs)
git push origin feature-branch

# 5. Create PR (PR checks run automatically)
gh pr create --title "Update predictions API"
```

---

### CI/CD Flow Diagram

```
┌─────────────┐
│  Developer  │
│   Commits   │
└──────┬──────┘
       │
       ├─────────────────────────┐
       │                         │
       v                         v
┌─────────────┐          ┌─────────────┐
│ Pre-commit  │          │   GitHub    │
│    Hook     │          │   Actions   │
└──────┬──────┘          └──────┬──────┘
       │                         │
       v                         v
   ┌────────┐              ┌────────────┐
   │Contract│              │ Test Job   │
   │ Tests  │              │ Build Job  │
   └───┬────┘              │ Lint Job   │
       │                   └──────┬─────┘
       │ PASS                     │
       v                          v
   ┌────────┐              ┌────────────┐
   │ Commit │              │  PR Check  │
   │ Allowed│              │   Status   │
   └────────┘              └────────────┘
```

---

## Test Strategy

### 1. Pre-commit (Fast Feedback - 5 seconds)
```bash
npm run test:contracts
```
**Purpose:** Catch breaking changes immediately
**When:** Before every commit
**What:** API contract validation only

### 2. CI Pipeline (Comprehensive - 2 minutes)
```bash
npm run test:ci
```
**Purpose:** Full validation before merge
**When:** On push/PR
**What:** All tests + build + lint

### 3. Manual Testing (Development)
```bash
npm test
```
**Purpose:** Interactive development
**When:** During development
**What:** Watch mode with hot reload

---

## Monitoring & Debugging

### View Test Results in GitHub

1. **Go to PR or commit**
2. **Click "Checks" tab**
3. **View test output**

Example:
```
✓ Test Job
  ✓ Contract tests (5s)
  ✓ All tests (45s)

✓ Build Job
  ✓ Build check (1m 30s)

✓ Lint Job
  ✓ ESLint (15s)
```

### Failed Tests

GitHub Actions will:
1. ❌ Mark PR as failed
2. 📝 Show which tests failed
3. 📊 Upload test artifacts
4. 💬 Comment on PR (if API changes)

### Test Artifacts

After each run, find uploaded artifacts:
- `test-results/` - Full test output
- `coverage/` - Coverage reports

**Download:** PR → Checks → Artifacts

---

## Configuration Files

### `.github/workflows/test.yml`
Main CI/CD pipeline

**Key Settings:**
- Node version: 20.x
- Runs on: `ubuntu-latest`
- Triggers: Push to main/develop, PRs

**Customize:**
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]  # Test multiple versions
```

### `.github/workflows/pr-checks.yml`
PR-specific quality checks

**Key Settings:**
- API change detection
- Automatic PR comments
- Test summaries

**Customize:**
```yaml
# Change API file pattern
git diff --name-only | grep -E "src/app/api/.*route\.ts"
```

### `.husky/pre-commit`
Pre-commit hook configuration

**Customize:**
```bash
# Add more checks
npm run lint
npm run type-check
npm run test:contracts
```

---

## Setup Instructions

### First Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd AIStockPredictions

# 2. Install dependencies
npm ci

# 3. Setup Git hooks
./setup-hooks.sh

# 4. Run tests to verify
npm run test:contracts
```

### GitHub Repository Setup

1. **Enable Actions**
   - Settings → Actions → Allow all actions

2. **Branch Protection Rules**
   - Settings → Branches → Add rule
   - Branch name: `main`
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - Select: `Test Job`, `Build Job`, `Lint Job`

3. **Optional: Required Reviewers**
   - ✅ Require pull request reviews before merging
   - Number of reviewers: 1+

---

## Troubleshooting

### Pre-commit Hook Not Running

```bash
# Reinstall hooks
./setup-hooks.sh

# Verify hook exists
ls -la .husky/pre-commit

# Make it executable
chmod +x .husky/pre-commit
```

### Tests Fail in CI but Pass Locally

**Common causes:**
1. **Node version mismatch**
   ```bash
   # Check local version
   node --version

   # Update .github/workflows/test.yml to match
   node-version: 20.x
   ```

2. **Missing environment variables**
   - Add secrets in GitHub: Settings → Secrets → Actions

3. **Dependency issues**
   ```bash
   # Use npm ci instead of npm install in CI
   npm ci
   ```

### GitHub Actions Not Triggering

**Check:**
1. Workflow file is in `.github/workflows/`
2. YAML syntax is valid
3. Triggers are configured correctly
4. Actions are enabled in repo settings

**Debug:**
```bash
# Validate YAML locally
npm install -g @action-validator/cli
action-validator .github/workflows/test.yml
```

---

## Performance Optimization

### Current Metrics
- Pre-commit: ~5 seconds
- Full CI pipeline: ~2 minutes
- Contract tests only: ~5 seconds

### Speed Improvements

**1. Cache Dependencies**
Already configured:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Caches node_modules
```

**2. Parallel Jobs**
Already configured - Test, Build, Lint run in parallel

**3. Skip Redundant Checks**
```bash
# Skip tests if only docs changed
on:
  push:
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

---

## Best Practices

### ✅ Do This

1. **Always run tests locally first**
   ```bash
   npm run test:contracts
   ```

2. **Use descriptive commit messages**
   ```bash
   git commit -m "fix: Update predictions response structure"
   ```

3. **Keep PRs small and focused**
   - Easier to review
   - Faster CI runs
   - Less likely to break things

4. **Update tests when changing APIs**
   - Modify contract tests if structure changes
   - Add new tests for new features

### ❌ Don't Do This

1. **Don't skip pre-commit hooks habitually**
   ```bash
   git commit --no-verify  # Only in emergencies
   ```

2. **Don't ignore CI failures**
   - Always fix before merging
   - Don't merge with failing tests

3. **Don't make large API changes without tests**
   - Update contract tests first
   - Then make changes

---

## Extending the Pipeline

### Add Coverage Reporting

```yaml
# .github/workflows/test.yml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/coverage-final.json
```

### Add Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    needs: test  # Only deploy if tests pass
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: vercel/actions@v2
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
```

### Add Performance Testing

```yaml
- name: Run performance tests
  run: npm run test:perf
```

---

## Metrics & Reporting

### Test Status Badge

Add to README.md:
```markdown
![Tests](https://github.com/USER/REPO/workflows/Tests/badge.svg)
```

### Coverage Badge

```markdown
![Coverage](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)
```

### Test Summary

Automatically added to PR:
```
## Test Results Summary

✅ Contract tests passed - No breaking changes detected
✅ Build succeeded
✅ 80 tests passed
📊 Coverage: 85%
```

---

## Support & Resources

**Documentation:**
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vitest Docs](https://vitest.dev)
- [Husky Docs](https://typicode.github.io/husky)

**Project Docs:**
- `docs/TEST_SUITE_SUMMARY.md` - Test overview
- `docs/PREVENTING_BREAKING_CHANGES.md` - Testing strategy
- `src/__tests__/README.md` - Test guide

**Get Help:**
- Check GitHub Actions logs
- Run tests locally: `npm test -- --reporter=verbose`
- Review test output in PR checks

---

**Status:** ✅ CI/CD fully configured and ready to use!

**Last Updated:** 2026-01-31
