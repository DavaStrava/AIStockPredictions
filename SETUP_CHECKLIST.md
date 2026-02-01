# ✅ CI/CD Setup Checklist

**Run these commands in order. Total time: 5 minutes**

---

## 📝 Step-by-Step Setup

### 1️⃣ Install Pre-commit Hooks (30 seconds)

```bash
./setup-hooks.sh
```

**Expected output:**
```
✅ Git hooks setup complete!
```

---

### 2️⃣ Verify Tests Work (30 seconds)

```bash
npm run test:contracts
```

**Expected output:**
```
✓ src/__tests__/api/contract-tests.test.ts (15)
Test Files  1 passed (1)
Tests  15 passed (15)
```

---

### 3️⃣ Test Pre-commit Hook (10 seconds)

```bash
git commit -m "Test CI/CD setup" --allow-empty
```

**Expected output:**
```
🧪 Running contract tests before commit...
✅ Contract tests passed - safe to commit!
```

---

### 4️⃣ Commit All CI/CD Files (30 seconds)

```bash
git add .
git commit -m "feat: Add CI/CD pipeline and test suite"
```

**Expected output:**
```
🧪 Running contract tests before commit...
✅ Contract tests passed - safe to commit!
[main abc123] feat: Add CI/CD pipeline and test suite
```

---

### 5️⃣ Push to GitHub (1 minute)

```bash
git push origin main
```

Then go to GitHub → **Actions** tab to see tests running!

---

### 6️⃣ Enable Branch Protection (Optional - 2 minutes)

**On GitHub:**
1. Settings → Branches → Add rule
2. Branch name: `main`
3. Check: "Require status checks to pass before merging"
4. Select: `Test Job`, `Build Job`, `Lint Job`
5. Save changes

---

## ✅ Verification

Check each item:

- [ ] Pre-commit hook installed
- [ ] `npm run test:contracts` passes
- [ ] Pre-commit hook runs on commit
- [ ] Files committed to git
- [ ] Pushed to GitHub
- [ ] GitHub Actions runs (check Actions tab)
- [ ] Branch protection enabled (optional)

---

## 🎯 Done!

Your CI/CD is now active! Every commit and PR will be automatically tested.

**Next:** Read `START_HERE_CI_CD.md` for full details.

---

## 🆘 Quick Fixes

**Hook not running?**
```bash
./setup-hooks.sh
chmod +x .husky/pre-commit
```

**Tests failing?**
```bash
npm test -- --reporter=verbose
```

**GitHub Actions not running?**
- Check `.github/workflows/` exists
- Verify Actions enabled in Settings

---

**Status:** ⏱️ Takes 5 minutes | 📍 You are here: START_HERE_CI_CD.md
