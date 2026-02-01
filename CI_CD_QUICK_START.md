# CI/CD Quick Start 🚀

Your tests are now integrated into CI/CD! Here's everything you need to know.

---

## ✅ What's Been Set Up

1. **GitHub Actions Workflows** - Runs tests automatically
2. **Pre-commit Hooks** - Catches issues before commit
3. **Test Scripts** - Easy commands to run tests
4. **API Change Detection** - Automatic breaking change prevention

---

## 🎯 Quick Commands

```bash
# Run contract tests (5 seconds - recommended before commits)
npm run test:contracts

# Run all tests
npm test

# Run tests for CI (what GitHub Actions runs)
npm run test:ci

# Get coverage report
npm run test:coverage
```

---

## 🔧 One-Time Setup

### Enable Pre-commit Hooks (Recommended)

```bash
./setup-hooks.sh
```

This will run contract tests before every commit to catch breaking changes early!

---

## 📋 What Happens When You...

### ...Make a Commit

```
$ git commit -m "Update API"

🧪 Running contract tests before commit...
✓ Contract tests passed - safe to commit!
```

### ...Push Code

GitHub Actions automatically:
1. ✅ Runs contract tests
2. ✅ Runs full test suite
3. ✅ Builds the project
4. ✅ Runs lint checks

### ...Create a Pull Request

GitHub Actions additionally:
1. 🔍 Detects if APIs changed
2. 📝 Comments on PR with checklist
3. 📊 Shows test summary
4. ⚠️ Prevents merge if tests fail

---

## 🚦 CI/CD Status

### View Test Results

1. Go to your PR or commit on GitHub
2. Click "Checks" tab
3. See all test results

### Status Badges

Add to your README.md:
```markdown
![Tests](https://github.com/YOUR_USERNAME/AIStockPredictions/workflows/Tests/badge.svg)
```

---

## 🔴 If Tests Fail

### Locally (Pre-commit)

```bash
# Fix the issue
vim src/app/api/predictions/route.ts

# Re-run tests
npm run test:contracts

# Try committing again
git commit -m "Fix API"
```

### In CI (GitHub Actions)

1. Click "Details" next to failed check
2. Read the error message
3. Fix locally and push again

---

## 📁 Files Created

**Workflows:**
- `.github/workflows/test.yml` - Main CI/CD pipeline
- `.github/workflows/pr-checks.yml` - PR quality checks

**Hooks:**
- `.husky/pre-commit` - Pre-commit test runner
- `setup-hooks.sh` - Hook installer script

**Tests:**
- `src/__tests__/api/contract-tests.test.ts` - Contract tests
- `src/__tests__/api/predictions.test.ts` - Predictions tests
- `src/__tests__/api/analysis.test.ts` - Analysis tests
- `src/__tests__/api/search.test.ts` - Search tests

**Documentation:**
- `docs/CI_CD_SETUP.md` - Full CI/CD guide
- `docs/TEST_SUITE_SUMMARY.md` - Test overview
- `src/__tests__/README.md` - Testing guide

---

## 🎓 What You Get

### Before CI/CD
❌ No automated testing
❌ Breaking changes reach production
❌ Manual testing only
❌ No safety net

### After CI/CD (Now!)
✅ Tests run on every commit
✅ Breaking changes caught immediately
✅ Automated quality checks
✅ Pre-merge validation
✅ Fast feedback (5 seconds locally)

---

## 🎉 Next Steps

1. **Enable pre-commit hooks:**
   ```bash
   ./setup-hooks.sh
   ```

2. **Make a test commit:**
   ```bash
   git commit -m "Test CI/CD" --allow-empty
   ```

3. **Watch GitHub Actions run:**
   - Go to GitHub → Actions tab
   - See your tests running!

4. **Configure branch protection** (optional):
   - GitHub → Settings → Branches
   - Require status checks before merging

---

## 💡 Pro Tips

1. **Run contract tests before committing:**
   ```bash
   npm run test:contracts
   ```
   Takes 5 seconds, saves hours debugging!

2. **Use watch mode during development:**
   ```bash
   npm test
   ```
   Tests re-run automatically on changes

3. **Check coverage occasionally:**
   ```bash
   npm run test:coverage
   ```
   Aim for 80%+ coverage

4. **Don't skip the pre-commit hook:**
   ```bash
   # ❌ Don't do this unless emergency
   git commit --no-verify
   ```

---

## 🆘 Need Help?

**Read full docs:**
- `docs/CI_CD_SETUP.md` - Complete CI/CD guide
- `docs/TEST_SUITE_SUMMARY.md` - What tests do
- `src/__tests__/README.md` - How to write tests

**Quick debug:**
```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Check if hooks are installed
ls -la .husky/pre-commit

# Reinstall hooks
./setup-hooks.sh
```

---

## ✨ Summary

Your project now has:
- ✅ **4 test files** with **80+ tests**
- ✅ **2 GitHub Actions workflows** for CI/CD
- ✅ **Pre-commit hooks** for instant feedback
- ✅ **API change detection** to prevent breaking changes
- ✅ **Comprehensive documentation**

**You're all set!** 🚀

Make a commit and watch the magic happen! ✨
