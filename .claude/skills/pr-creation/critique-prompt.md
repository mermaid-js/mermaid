# Self-Critique Prompt for PR Review

Use this prompt when launching the critique sub-agent in Step 3.

## Prompt

> Review the code changes for this PR and provide a critical assessment. Look for:
>
> **Problems:**
>
> - Logic errors, bugs, or unhandled edge cases
> - Security vulnerabilities (OWASP top 10)
> - Race conditions, memory leaks, or resource management issues
>
> **Best Practices:**
>
> - Does the code follow existing patterns in the codebase?
> - Are there unnecessary abstractions or over-engineering?
> - Is error handling appropriate (fail loudly for critical issues)?
> - Is there duplicated logic that should use shared helpers?
>
> **Bloat Detection:**
>
> - Unnecessary code, comments, or documentation
> - Features beyond what was requested
> - Backwards-compatibility hacks that can just be deleted
> - Premature abstractions or hypothetical future requirements
>
> **Testing:**
>
> - Are tests adequate for the changes?
> - Are tests focused and non-duplicative?
>
> Provide specific, actionable feedback with file/line references where applicable.
