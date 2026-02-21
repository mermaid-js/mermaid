---
# prettier-ignore
name: update-pr
description: >
  Updates an existing pull request with new changes, commits, and optionally revises the PR description.
  Activate when the user asks to update, fix, or add to an existing PR.
  Also activate when the user says "update the PR", "fix the PR", "add this to the PR", or any variation of modifying an existing pull request.
---

# Update Pull Request Skill

## When to Use

Activate when the user says:

- "Update the PR"
- "Fix the PR based on feedback"
- "Add this to the PR"
- "Push these changes to the PR"
- "Update the PR description"

Do **NOT** use for:

- Creating a new PR (use `pr-creation` skill)
- Reviewing a PR (`gh pr view`)
- Merging a PR (`gh pr merge`)

## Workflow

### 1. Verify PR Exists and Is Open

```bash
gh pr view --json number,state,title,url
```

If no PR exists, ask if they want to create one (`/pr-creation`). If merged or closed, ask what to do.

### 2. Make Changes

Implement the requested updates following the user's instructions.

### 3. Commit Changes

Use the `/commit` skill to create conventional commits:

```bash
/commit
```

### 4. Push Updates

```bash
git push
```

### 5. Verify CI (with 15-minute timeout)

```bash
timeout 15m gh pr checks --watch || true
```

The stop hook (`verify_ci.py`) will automatically block completion if CI fails. If checks fail, fix issues and repeat steps 3-5.

### 6. Report Result

Confirm the PR is updated and provide the URL.

## Example

**User:** "Fix the type error in the PR"

**Actions:** Verify PR exists → Fix type error → `/commit` → Push → Verify CI → Report URL

## Error Handling

- **No PR for branch**: Ask if they want to create one (`/pr-creation`)
- **PR merged/closed**: Ask user what to do (don't modify merged PRs)
- **CI fails**: Fix issues and push again (stop hook enforces this)
