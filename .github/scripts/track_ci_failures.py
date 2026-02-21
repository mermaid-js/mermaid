#!/usr/bin/env python3
"""Track CI failures on claude/ branch PRs and escalate when exhausted.

Notification/labeling system only — does NOT ping @claude. The Stop hook
(verify_ci.py) is the primary fix mechanism. This script:
  1. Tracks which workflows failed and how many times
  2. Leaves comments for humans to see what's broken
  3. Labels the PR `needs-human-review` when all workflows are exhausted
"""

from __future__ import annotations

import json
import os
import re
import subprocess

MAX_ATTEMPTS = 2
TRACKER_MARKER = "<!-- claude-failure-tracker -->"


def gh_api(
    endpoint: str, method: str = "GET", body: dict | None = None
) -> dict | list | None:
    """Call the GitHub API via the gh CLI."""
    cmd = ["gh", "api", endpoint, "-X", method]
    input_data = None
    if body is not None:
        cmd.extend(["--input", "-"])
        input_data = json.dumps(body)

    result = subprocess.run(cmd, capture_output=True, text=True, input=input_data)
    if result.returncode != 0:
        raise RuntimeError(
            f"gh api {method} {endpoint} failed: {result.stderr.strip()}"
        )
    if not result.stdout.strip():
        return None
    return json.loads(result.stdout)


def main() -> None:
    repo = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ["PR_NUMBER"]
    workflow_name = os.environ["WORKFLOW_NAME"]
    run_url = os.environ["RUN_URL"]
    run_id = int(os.environ["RUN_ID"])
    head_sha = os.environ["HEAD_SHA"][:7]

    # Find existing tracker comment
    comments = gh_api(f"repos/{repo}/issues/{pr_number}/comments") or []

    tracker = None
    failures: dict[str, list[dict]] = {}
    for comment in comments:
        if TRACKER_MARKER in (comment.get("body") or ""):
            tracker = comment
            m = re.search(r"<!-- failures:(\{.*?\}) -->", tracker["body"])
            if m:
                try:
                    failures = json.loads(m.group(1))
                except json.JSONDecodeError:
                    print("Corrupt failure state, starting fresh")
            break

    # Dedup: skip if we already tracked this run or workflow is exhausted
    wf_runs = failures.get(workflow_name, [])
    if any(f["run"] == run_id for f in wf_runs):
        print(f"Already tracked run {run_id} for {workflow_name}, skipping")
        return
    if len(wf_runs) >= MAX_ATTEMPTS:
        print(f"{workflow_name} already at {MAX_ATTEMPTS} attempts, skipping")
        return

    # Record the new failure
    failures.setdefault(workflow_name, []).append(
        {"run": run_id, "sha": head_sha, "url": run_url}
    )

    just_exhausted = len(failures[workflow_name]) >= MAX_ATTEMPTS
    all_exhausted = all(len(r) >= MAX_ATTEMPTS for r in failures.values())

    # Build failure summary
    lines = []
    for name, runs in failures.items():
        latest = runs[-1]
        status = " (giving up)" if len(runs) >= MAX_ATTEMPTS else ""
        lines.append(
            f"- **{name}** [failed]({latest['url']}) on commit "
            f"{latest['sha']} (attempt {len(runs)}/{MAX_ATTEMPTS}){status}"
        )
    failure_list = "\n".join(lines)
    header = f"{TRACKER_MARKER}\n<!-- failures:{json.dumps(failures)} -->\n"

    if all_exhausted:
        body = (
            f"{header}**Automated fix attempts exhausted.** The following "
            f"workflows failed repeatedly:\n\n{failure_list}\n\n"
            f"Human review is needed."
        )
    elif just_exhausted:
        body = (
            f"{header}The following workflows have failed:\n\n"
            f"{failure_list}\n\n"
            f"**{workflow_name}** has exhausted its {MAX_ATTEMPTS} attempts."
        )
    else:
        body = (
            f"{header}The following workflows have failed on this PR:\n\n{failure_list}"
        )

    # Create or update the tracker comment
    if tracker:
        gh_api(
            f"repos/{repo}/issues/comments/{tracker['id']}",
            method="PATCH",
            body={"body": body},
        )
        print(f"Updated tracker comment for {workflow_name} failure")
    else:
        gh_api(
            f"repos/{repo}/issues/{pr_number}/comments",
            method="POST",
            body={"body": body},
        )
        print(f"Created tracker comment for {workflow_name} failure")

    # Label when all attempts are exhausted
    if all_exhausted:
        try:
            gh_api(
                f"repos/{repo}/issues/{pr_number}/labels",
                method="POST",
                body={"labels": ["needs-human-review"]},
            )
            print("Added needs-human-review label")
        except RuntimeError as e:
            print(f"Could not add label (may not exist): {e}")


if __name__ == "__main__":
    main()
