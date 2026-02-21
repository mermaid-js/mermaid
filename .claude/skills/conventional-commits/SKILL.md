---
# prettier-ignore
name: commit
description: >
  Creates well-structured git commits using Conventional Commits format.
  Activate this skill whenever the user asks to commit changes, make a commit, save progress,
  or says "commit this", "commit my changes", "/commit", or any variation of requesting a git commit.
  Also activate when task instructions say to commit when done.
---

# Conventional Commits Skill

## Workflow

### 1. Review Changes

Run in parallel: `git status`, `git diff`, `git diff --cached`, `git log --oneline -5`

### 2. Stage Files

Stage by name — never `git add -A` or `git add .`. Skip secrets (`.env`, credentials). If changes span unrelated areas, ask user whether to split into multiple commits.

### 3. Commit

Format: `<type>(<optional scope>): <imperative lowercase description>`

- Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `style`, `perf`, `build`
- Under 72 chars, no trailing period
- Add `!` for breaking changes: `feat!: remove legacy API`
- Optional body (blank line after subject) for the **why**
- Use HEREDOC for multi-line messages:

```bash
git commit -m "$(cat <<'EOF'
feat(sdk): return Result type from authenticate

BREAKING CHANGE: authenticate() no longer throws on failure.
EOF
)"
```

### 4. Verify

If commitlint rejects the message, fix and create a **new** commit (don't amend). Confirm hash and message to the user.
