# ResourceFlow Git Workflow Guide

## Branch Strategy

### Main Branches
- **`main`**: Production-ready, stable code only
- **`dev`**: Integration branch for ongoing development

### Feature Branches
- **`feature/*`**: New features (e.g., `feature/user-authentication`)
- **`fix/*`**: Bug fixes (e.g., `fix/login-validation`)
- **`hotfix/*`**: Critical production fixes (e.g., `hotfix/security-patch`)
- **`release/*`**: Release preparation (e.g., `release/v1.1.0`)

## Workflow

### Starting New Work
1. Ensure you're on `dev` branch: `git checkout dev`
2. Pull latest changes: `git pull origin dev`
3. Create feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes and commit regularly
5. Push feature branch: `git push -u origin feature/your-feature-name`

### Completing Work
1. Create a Pull Request from your feature branch to `dev`
2. Get code review and approval
3. Merge to `dev`
4. Delete the feature branch after successful merge

### Releasing to Production
1. When `dev` is stable, create a Pull Request from `dev` to `main`
2. Review and merge to `main`
3. Tag the release: `git tag -a v1.1.0 -m "Release v1.1.0"`
4. Push the tag: `git push origin v1.1.0`

### Hotfixes
1. Create hotfix branch from `main`: `git checkout -b hotfix/critical-fix`
2. Fix the issue and commit
3. Create Pull Request to both `main` and `dev`
4. Merge to both branches
5. Tag the hotfix release

## Commands Reference

### Branch Management
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Switch between branches
git checkout main
git checkout dev

# List all branches
git branch -a

# Delete local branch
git branch -d feature/completed-feature

# Delete remote branch
git push origin --delete feature/completed-feature
```

### Tagging
```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tag to remote
git push origin v1.0.0

# List all tags
git tag -l

# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

### Best Practices
1. **Never commit directly to `main`** - always use Pull Requests
2. **Keep commits atomic** - one logical change per commit
3. **Write meaningful commit messages** - use conventional commits format
4. **Pull latest changes** before starting new work
5. **Delete feature branches** after merging
6. **Use descriptive branch names** that indicate the purpose

### Conventional Commits Format
```
type(scope): description

feat(auth): add user authentication system
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
style(components): format code according to style guide
refactor(api): simplify user data fetching
test(utils): add unit tests for date formatting
chore(deps): update dependencies to latest versions
```

## Emergency Procedures

### Reverting a Bad Merge
```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>

# Push the revert
git push origin main
```

### Recovering from Force Push
```bash
# Find the lost commit
git reflog

# Reset to the lost commit
git reset --hard <commit-hash>
```

## Current Status
- ✅ `main` branch: Production-ready code
- ✅ `dev` branch: Development integration
- ✅ `v1.0.0` tag: Initial stable version
- ✅ Enhanced `.gitignore` with standard exclusions
- ✅ Database file removed from tracking 