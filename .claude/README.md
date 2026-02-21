# Claude Code Configuration

This directory contains configuration and skills for Claude Code.

## Structure

```
.claude/
├── settings.json              # Claude Code hooks configuration
├── hooks/
│   ├── session-setup.sh      # Runs on session start (installs tools, configures git)
│   ├── pre-push-check.sh    # Runs before git push / gh pr (build, lint, typecheck)
│   ├── verify_ci.py          # Runs on session stop (blocks if checks fail, max 3 retries)
│   └── lib-checks.sh        # Shared bash helpers (exists, has_script)
└── skills/
    └── pr-creation/       # PR creation workflow with self-critique
        ├── SKILL.md       # Main skill entrypoint
        ├── critique-prompt.md  # Self-critique checklist for sub-agent
        └── pr-templates.md     # PR formatting and validation reference
```

## How It Works

### Session Start Hook

When Claude Code starts a session, it automatically runs `session-setup.sh` which:

1. **Installs tools**: shfmt, gh (GitHub CLI), jq, shellcheck
2. **Configures git hooks**: Sets `core.hooksPath` to `.hooks/`
3. **Validates GitHub CLI auth**: Fails fast if `GH_TOKEN` is missing
4. **Detects GitHub repo**: Extracts `owner/repo` from proxy remotes in web sessions
5. **Installs dependencies**: Node (pnpm/npm) and Python (uv) if applicable

### Pre-Push Check Hook

Before `git push` or `gh pr` commands, `pre-push-check.sh` runs any configured checks:

- **build** (`pnpm build`): Catches type errors in TypeScript projects
- **lint** (`pnpm lint`): Catches code quality issues
- **typecheck** (`pnpm check`): Additional type checking if configured
- **ruff**: Python linting if applicable

Only runs scripts that are actually configured in `package.json` — skips placeholder scripts.

### Stop Hook

When Claude finishes a session, `verify_ci.py` blocks completion if any checks fail:

- Runs test, lint, and typecheck (superset of pre-push checks — adds tests)
- Returns `decision: "block"` with failure details so Claude continues fixing issues
- Returns `decision: "approve"` if all checks pass
- **Retry limit**: After 3 failed attempts (configurable via `MAX_STOP_RETRIES`), approves anyway with a warning to prevent infinite token burn
- Written in Python for reliability — reads `package.json` directly, no `jq` dependency

### Skills

Skills in `skills/` are reusable workflows that guide Claude through complex tasks:

- **pr-creation**: Creating pull requests with mandatory self-critique before submission (invoke with `/pr-creation`)

Skills are automatically available to Claude Code when working in this repository.

## Customization

### Adding Tools

Edit `hooks/session-setup.sh` to add more tools:

```bash
# Via uv
uv_install_if_missing mycommand mypackage

# Via webi (https://webinstall.dev)
webi_install_if_missing mytool

# Via apt (requires root)
if is_root; then
  apt-get install -y mytool
fi
```

### Adding Skills

Create new skill directories in `skills/` following the pattern in `pr-creation/SKILL.md`. Each skill should be a directory with a `SKILL.md` entrypoint and optional supporting files.

### Customizing Hooks

Modify `settings.json` to add more hooks. See the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) for available hook types.
