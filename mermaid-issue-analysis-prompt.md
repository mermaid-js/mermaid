# Mermaid Issue Analysis: Multi-Agent Orchestrator Prompt

Run this from Claude Code in a repo with `gh` CLI access and internet connectivity.

---

## Goal

Analyze all ~1396 open issues in `mermaid-js/mermaid` (including their comments) to identify common underlying outcomes for roadmap planning. Produce an Outcome-Solution Tree (OST) with persona mapping, delivered as both a strategic markdown document and a tagged spreadsheet.

## Architecture

You are the **orchestrator**. You will execute a 4-phase pipeline using sub-agents (the `Agent` tool) and files on disk as shared state. Agents never call the GitHub API directly: all data comes from a single extracted JSON file.

---

## Phase 0: Data Extraction

Extract all open issues WITH COMMENTS into a single JSON file. This is a two-step process.

### Step 1: Extract issues

```bash
gh issue list --repo mermaid-js/mermaid --state open --limit 1500 \
  --json number,title,labels,body,comments | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data:
    # Truncate body to 800 chars
    if item.get('body'):
        item['body'] = item['body'][:800]
    # Process comments: keep author + truncated body for each
    processed_comments = []
    for c in item.get('comments', []):
        processed_comments.append({
            'author': c.get('author', {}).get('login', 'unknown'),
            'body': (c.get('body') or '')[:400]
        })
    item['comments'] = processed_comments
    item['comment_count'] = len(processed_comments)
print(json.dumps(data))
" > issues_raw.json
```

NOTE: If `gh` does not support `comments` in `--json`, use this fallback approach:

```bash
# Step 1a: Get issues without comments
gh issue list --repo mermaid-js/mermaid --state open --limit 1500 \
  --json number,title,labels,body > issues_no_comments.json

# Step 1b: Fetch comments per issue using gh api (batched)
python3 << 'PYEOF'
import json, subprocess, time

with open("issues_no_comments.json") as f:
    issues = json.load(f)

for i, issue in enumerate(issues):
    num = issue["number"]
    if i % 50 == 0:
        print(f"Fetching comments: {i}/{len(issues)}...")
    try:
        result = subprocess.run(
            ["gh", "api", f"repos/mermaid-js/mermaid/issues/{num}/comments",
             "--jq", '[.[] | {author: .user.login, body: .body[:400]}]'],
            capture_output=True, text=True, timeout=15
        )
        comments = json.loads(result.stdout) if result.stdout.strip() else []
    except Exception:
        comments = []
    issue["comments"] = comments
    issue["comment_count"] = len(comments)
    # Truncate body
    if issue.get("body"):
        issue["body"] = issue["body"][:800]
    # Rate limit: ~5000 requests/hour, be conservative
    if i % 100 == 99:
        time.sleep(5)

with open("issues_raw.json", "w") as f:
    json.dump(issues, f)
print(f"Done. {len(issues)} issues with comments saved.")
PYEOF
```

### Step 2: Verify

```bash
python3 -c "
import json
d = json.load(open('issues_raw.json'))
total_comments = sum(i.get('comment_count', 0) for i in d)
with_comments = sum(1 for i in d if i.get('comment_count', 0) > 0)
print(f'Issues: {len(d)}')
print(f'Issues with comments: {with_comments}')
print(f'Total comments: {total_comments}')
"
```

Expected: ~1396 issues. Save this file: it is the single source of truth for all subsequent phases.

---

## Phase 1: Worker Agents (Issue Summarization)

Split `issues_raw.json` into batches of 50 issues each (~28 batches). For each batch, spawn a worker agent.

### Batch Preparation

Before spawning agents, create the batch files yourself:

```python
import json

with open("issues_raw.json") as f:
    issues = json.load(f)

batch_size = 50
for i in range(0, len(issues), batch_size):
    batch = issues[i:i+batch_size]
    batch_num = i // batch_size + 1
    with open(f"batch_input_{batch_num:02d}.json", "w") as f:
        json.dump(batch, f)

print(f"Created {(len(issues) + batch_size - 1) // batch_size} batch files")
```

### Worker Agent Prompt Template

Spawn agents in parallel waves of 5-6 at a time. Each worker agent gets this prompt (substitute BATCH_NUM):

```
You are an issue analysis worker. Your job is to read a batch of GitHub issues (including their comments) from the Mermaid diagramming library and produce structured summaries.

Read the file `batch_input_BATCH_NUM.json`. For each issue, produce a JSON object with these fields:

{
  "number": <issue number>,
  "title": "<issue title>",
  "diagram_types": ["<affected diagram type(s): flowchart, sequence, class, state, er, gantt, pie, mindmap, timeline, sankey, git, c4, block, packet, kanban, architecture, zenuml, xy, quadrant, requirement, or 'general' if not diagram-specific>"],
  "outcome_raw": "<What the user fundamentally needs/wants, phrased as a user outcome. E.g., 'Users need diagrams to render correctly in dark-themed environments' or 'Users need a way to represent file system hierarchies visually'. Think about the underlying need, not the specific bug or feature.>",
  "pain_category": "<One of: rendering, syntax, layout, DX (developer experience), performance, documentation, integration, accessibility, theming, export, parsing, configuration, new-diagram, new-feature, mobile, security, testing, i18n>",
  "persona_signals": [
    {
      "persona": "<developer | designer | technical-writer | student | project-manager | data-analyst | devops-engineer | architect | educator | library-integrator | general-user>",
      "source": "<author | commenter>",
      "evidence": "<Brief note: what in their message signals this persona>"
    }
  ],
  "severity_hint": "<One of: cosmetic (visual glitch, minor), functional (feature broken or missing but workaround exists), blocking (no workaround, core functionality affected)>",
  "community_signal": {
    "comment_count": <number>,
    "unique_commenters": <number>,
    "has_workaround": <true/false>,
    "has_plus_one": <true/false>,
    "maintainer_responded": <true/false>
  },
  "demand_intensity": "<One of: silent (0 comments), noticed (1-2 comments, mostly clarification), wanted (3+ comments, people expressing need), heated (many comments, frustration, repeated asks, or offers to contribute)>",
  "comment_themes": ["<Short tags summarizing what commenters are saying. E.g.: 'workaround-shared', 'affects-production', 'multiple-environments', 'willing-to-contribute', 'regression-report', 'design-discussion', 'scope-expansion', 'duplicate-reports'. Pick 1-3 that apply.>"]
}

CRITICAL: Analyzing Comments

Each issue includes a `comments` array with `{author, body}` objects. You MUST read these carefully because:

1. **Persona detection:** The issue author might be a developer, but commenters might be designers, technical writers, or educators hitting the same problem. Extract persona signals from BOTH the issue body AND every comment. Look for clues:
   - Technical jargon, code snippets → developer
   - "I'm using this in my documentation site" → technical-writer
   - "Teaching a class and..." → educator
   - "Our design team needs..." → designer
   - "In our CI pipeline..." → devops-engineer
   - Library/framework integration mentions → library-integrator

2. **Severity refinement:** Comments often reveal whether a workaround exists, whether the issue is blocking production use, or whether it's a minor annoyance. Use this to refine severity_hint.

3. **Outcome refinement:** Comments frequently clarify or expand the underlying need beyond what the original issue describes. A bug report's comments might reveal it's actually about a deeper DX problem. Use comment context to write a more accurate outcome_raw.

4. **Community weight signals:**
   - "+1", "same here", "also experiencing" → has_plus_one = true (indicates broader impact)
   - "As a workaround, I..." → has_workaround = true
   - Comments from mermaid-js org members or known maintainers → maintainer_responded = true
   - Count unique commenters (distinct authors)

5. **Demand intensity & comment themes (drives outcome priority):**
   Assess the overall temperature of the comment thread:
   - `silent`: 0 comments. Unknown demand.
   - `noticed`: 1-2 comments, mostly questions or clarifications.
   - `wanted`: 3+ comments, people expressing they need this, describing their use cases.
   - `heated`: Many comments, visible frustration, repeated asks over time, or people offering PRs/contributions.

   Also tag comment_themes: scan comments for recurring patterns and tag 1-3 of these:
   - `workaround-shared`: someone posted a workaround
   - `affects-production`: commenter says this impacts their production/live system
   - `multiple-environments`: reported across different renderers/platforms
   - `willing-to-contribute`: someone offered to submit a PR
   - `regression-report`: worked before, broke in an update
   - `design-discussion`: debate about the right approach
   - `scope-expansion`: commenters want more than the original ask
   - `duplicate-reports`: people linking to related/duplicate issues

   These fields directly feed into outcome priority in Phase 2. A "heated" issue with "affects-production" carries much more roadmap weight than a "silent" feature request.

General rules:
- Focus on OUTCOMES not solutions. "Fix CSS variable" → "Users need consistent visual rendering across themes"
- If an issue mentions multiple diagram types, list all of them
- If the body is empty or unhelpful, infer from the title and labels
- Labels like "Type: Bug / Error" → likely rendering/syntax/layout. "Type: Enhancement" → likely new-feature/DX. "Type: New Diagram" → new-diagram.
- Be specific in outcome_raw: avoid generic statements like "it should work correctly"
- persona_signals is an ARRAY: include one entry for the issue author and additional entries for commenters who reveal different personas. Deduplicate: if 3 commenters are all "developer", include one entry with source "commenter".

Write your output as a JSON array to the file `batch_output_BATCH_NUM.json`.

IMPORTANT: Output ONLY valid JSON to the file. No markdown, no commentary. Just the JSON array.
```

### Execution Strategy

Run workers in waves to avoid overwhelming the system:

- **Wave 1**: Batches 01-06 (6 agents in parallel)
- **Wave 2**: Batches 07-12
- **Wave 3**: Batches 13-18
- **Wave 4**: Batches 19-24
- **Wave 5**: Batches 25-28 (+ any retries from earlier waves)

After each wave, verify outputs exist and are valid JSON:

```python
import json, glob
for f in sorted(glob.glob("batch_output_*.json")):
    try:
        data = json.load(open(f))
        print(f"{f}: {len(data)} issues ✓")
    except Exception as e:
        print(f"{f}: FAILED - {e}")
```

Re-run any failed batches before proceeding.

### Merge Worker Outputs

After all waves complete, merge into a single file:

```python
import json, glob

all_summaries = []
for f in sorted(glob.glob("batch_output_*.json")):
    all_summaries.extend(json.load(open(f)))

with open("all_summaries.json", "w") as f:
    json.dump(all_summaries, f, indent=2)

print(f"Total summarized issues: {len(all_summaries)}")

# Quick sanity check on persona signals and demand intensity
from collections import Counter
persona_counts = Counter()
demand_counts = Counter()
theme_counts = Counter()
for s in all_summaries:
    for p in s.get("persona_signals", []):
        persona_counts[p["persona"]] += 1
    demand_counts[s.get("demand_intensity", "unknown")] += 1
    for t in s.get("comment_themes", []):
        theme_counts[t] += 1

print("\nPersona signal distribution:")
for persona, count in persona_counts.most_common():
    print(f"  {persona}: {count}")
print("\nDemand intensity distribution:")
for level, count in demand_counts.most_common():
    print(f"  {level}: {count}")
print("\nComment theme distribution:")
for theme, count in theme_counts.most_common(15):
    print(f"  {theme}: {count}")
```

---

## Phase 2: Classification (OST Construction)

The classifier builds the Outcome-Solution Tree bottom-up. Because ~1396 summaries at ~200 tokens each (with comment data) is ~280k tokens, run this in TWO passes.

### Pass 1: First Half + Taxonomy Seeding

Spawn a classifier agent with this prompt:

````
You are an outcome classifier building an Outcome-Solution Tree (OST) for the Mermaid diagramming library's open-source roadmap.

Read `all_summaries.json` and process issues 0-697 (first half).

Your job:
1. Read every issue summary's `outcome_raw` field
2. Cluster similar outcomes into LEAF outcomes (specific, actionable)
3. Group leaf outcomes into MID-LEVEL outcomes (thematic)
4. Group mid-level outcomes into TOP-LEVEL themes (strategic)

PERSONA CLASSIFICATION (critical):

Each issue has a `persona_signals` array containing persona detections from BOTH the issue author AND commenters. Use this to build weighted persona profiles:

- An issue with persona_signals from 3 different persona types contributes to ALL THREE personas
- Weight by community_signal: an issue with 10 unique commenters and has_plus_one=true represents more user impact than a zero-comment issue
- Track both "affected personas" (who has this problem) and "requesting personas" (who filed/commented)

PRIORITY WEIGHTING (critical):

Each issue carries a weighted_impact score that reflects community interest. The formula is simple and robust:

  weighted_impact = unique_commenters + demand_bonus + severity_bonus

Where:
- unique_commenters: number of distinct people who commented (minimum 1 for the author). This is the primary signal: more people = more interest. Yes, older issues accumulate more comments. That's fine: sustained interest over time IS a signal.
- demand_bonus: 0 for "silent", 0 for "noticed", 1 for "wanted", 3 for "heated"
- severity_bonus: 0 for "cosmetic", 1 for "functional", 2 for "blocking"

Additionally, certain comment_themes act as priority boosters at the LEAF level (not per-issue):
- "affects-production": +1 to every issue in the leaf that has this tag
- "willing-to-contribute": flag this leaf as "contribution-ready" (roadmap signal: easier to land)
- "regression-report": flag this leaf as "regression" (roadmap signal: was working, broke)

Build the persona registry using persona_signals from both authors and commenters.

Output TWO files:

**File 1: `ost_draft_v1.json`**
```json
{
  "tree": [
    {
      "theme": "Rendering Correctness",
      "description": "Diagrams render accurately across all environments",
      "mid_level": [
        {
          "outcome": "Cross-theme rendering consistency",
          "description": "Diagrams look correct in both light and dark themes",
          "leaves": [
            {
              "outcome": "Dark mode color inheritance works correctly",
              "issue_numbers": [1234, 5678],
              "issue_count": 2,
              "weighted_impact": 12.0,
              "demand_profile": {"silent": 0, "noticed": 1, "wanted": 1, "heated": 0},
              "flags": ["contribution-ready"],
              "personas": ["developer", "library-integrator"],
              "diagram_types": ["flowchart", "sequence"]
            }
          ]
        }
      ],
      "total_issues": 45,
      "total_weighted_impact": 189.0
    }
  ],
  "unclustered": [
    { "number": 9999, "outcome_raw": "...", "reason": "Unique edge case" }
  ]
}
````

**File 2: `personas_v1.json`**

```json
[
  {
    "persona": "developer",
    "issue_count": 234,
    "weighted_impact": 456.5,
    "source_breakdown": {
      "as_author": 180,
      "as_commenter": 120
    },
    "top_pain_categories": ["rendering", "syntax", "layout"],
    "top_outcomes": ["Diagrams render correctly", "Syntax is intuitive", "Layout is predictable"],
    "representative_issues": [1234, 5678, 9012]
  }
]
```

Rules:

- AIM FOR 5-8 top-level themes. Not 3, not 20.
- Each mid-level outcome should have at least 3 issues to be a cluster (otherwise it's unclustered)
- Be specific: "Rendering" alone is too vague as a leaf. "SVG export preserves font styling" is good.
- Personas should be GENERIC (developer, designer, etc.), not Mermaid-specific
- Include issue counts, weighted_impact, AND demand_profile at every level of the tree
- The tree should be exhaustive: every issue must appear in exactly one leaf OR in unclustered
- weighted_impact matters for prioritization: a theme with 20 high-engagement issues may outrank one with 40 silent issues
- Propagate flags upward: if any leaf has "regression", the mid-level and theme should note it
- demand_profile at mid/theme level = sum of leaf demand_profiles

```

### Pass 2: Second Half + Taxonomy Refinement

After Pass 1 completes, spawn the second classifier:

```

You are an outcome classifier continuing the OST construction for the Mermaid diagramming library.

Read these files:

- `all_summaries.json` (process issues 698 to end, the second half)
- `ost_draft_v1.json` (the taxonomy from Pass 1)
- `personas_v1.json` (persona registry from Pass 1)

Your job:

1. Classify each issue in the second half into the EXISTING taxonomy where it fits
2. Create NEW leaf/mid-level/top-level nodes where existing ones don't fit
3. MERGE or SPLIT categories if the second half reveals they were too broad or too narrow
4. Update all issue counts, weighted_impact scores, demand_profiles, and flags
5. Re-classify any "unclustered" items from Pass 1 that now have enough peers to form clusters
6. Update the persona registry with data from the second half
7. Use the same weighting formula: weighted_impact = unique_commenters + demand_bonus + severity_bonus

Output TWO files:

**`ost_final.json`** : same schema as ost_draft_v1.json but complete and refined
**`personas_final.json`** : same schema as personas_v1.json but complete

Quality checks before writing:

- Every issue from all_summaries.json appears exactly once (in a leaf or unclustered)
- Sum of all leaf issue_counts + unclustered count = total issues
- No leaf has fewer than 2 issues (merge small leaves up)
- No top-level theme has fewer than 10 issues (consider merging)
- 5-8 top-level themes total
- weighted_impact totals are consistent (sum of leaves = mid-level, sum of mid = theme)
- demand_profiles sum correctly upward through the tree
- flags propagate upward (regression, contribution-ready)

```

---

## Phase 3: Synthesis

### 3A: Strategic Markdown Document

Spawn a synthesis agent:

```

You are a product strategist synthesizing issue analysis into a roadmap-ready document.

Read:

- `ost_final.json`
- `personas_final.json`
- `all_summaries.json` (for reference/examples)

Produce a markdown file `mermaid_ost_roadmap.md` with this structure:

# Mermaid OST: Issue-Driven Roadmap Analysis

## Executive Summary

- Total open issues analyzed: N
- Number of top-level themes: N
- Top 3 themes by weighted impact (not just count: community engagement matters)
- Key insight (1-2 sentences)

## Personas

For each persona (sorted by weighted_impact descending):

- Name, issue count, weighted impact, percentage of total weighted impact
- Source breakdown: how often they appear as issue author vs commenter (commenters-only personas are important: they represent affected users who don't file issues)
- Key needs (2-3 sentences, not bullets)
- Most affected diagram types

## Outcome-Solution Tree

For each top-level theme (sorted by weighted_impact descending):

### Theme Name (N issues, weighted impact: X, Y% of total)

Description of the theme.

**Demand Profile:** silent: N, noticed: N, wanted: N, heated: N
**Flags:** regression, contribution-ready (if applicable)

**Key Outcomes:**
For each mid-level outcome:

- Outcome name (N issues, impact: X)
  - Leaf outcomes listed concisely
  - Affected diagram types
  - Primary personas
  - Demand breakdown (how many heated/wanted vs silent)

**Community Signal:** How many of these issues have active discussion? What's the workaround availability? Are maintainers already engaged? Any "affects-production" or "regression-report" tags?

**Representative Issues:** List 3-5 most representative issue numbers with titles, prioritizing high-engagement ones (heated > wanted > noticed > silent)

**Roadmap Signal:** 2-3 sentences on what this theme means for prioritization. Call out if this theme has "contribution-ready" leaves (community might help land these).

## Cross-Cutting Patterns

- Which diagram types have the most issues (by count AND by weighted impact)?
- Which pain categories dominate?
- Are there clusters that span multiple themes?
- Which personas are most underserved (high issue count, low maintainer response)?
- Where is the "heated" demand concentrated? These are the loudest pain points.
- Which outcomes have "regression" flags? (These are trust-eroding: things that used to work.)

## Recommended Roadmap Themes

Based on the analysis, suggest 5-8 high-level roadmap items ranked by:

1. Weighted impact (community engagement, not just raw count)
2. Demand intensity profile (themes with many "heated" issues rank higher)
3. Severity distribution (how many blocking vs cosmetic)
4. Persona breadth (does it affect multiple personas)
5. Flags: regressions get priority bumps, contribution-ready items are cheaper to land

For each: theme name, issue count, weighted impact, demand profile summary, key personas, flags, suggested priority tier (P0/P1/P2).

## Appendix: Unclustered Issues

List issues that didn't fit any category, with brief notes on why.

Write to `mermaid_ost_roadmap.md`.
Keep the tone concise and technical. This is for a CTO and open-source maintainer.
Use ":" instead of "—" for separators.

```

### 3B: Tagged Spreadsheet (CSV)

Spawn another agent in parallel:

```

You are a data engineer producing a tagged issue spreadsheet.

Read:

- `all_summaries.json`
- `ost_final.json`

For each issue in all_summaries.json, look up which leaf/mid-level/top-level it belongs to in ost_final.json.

Produce a CSV file `mermaid_issues_tagged.csv` with these columns:

issue_number, title, diagram_types, outcome_raw, pain_category, personas, severity_hint, comment_count, unique_commenters, demand_intensity, comment_themes, weighted_impact, leaf_outcome, mid_level_outcome, top_level_theme

Rules:

- diagram_types should be semicolon-separated if multiple
- personas should be semicolon-separated (all detected personas from persona_signals array)
- comment_themes should be semicolon-separated
- If an issue is unclustered, set leaf/mid/top to "Unclustered"
- Sort by top_level_theme, then mid_level_outcome, then weighted_impact descending
- Ensure every issue from all_summaries.json appears exactly once
- weighted_impact per issue = unique_commenters + demand_bonus(silent=0,noticed=0,wanted=1,heated=3) + severity_bonus(cosmetic=0,functional=1,blocking=2)

Write to `mermaid_issues_tagged.csv`.

````

---

## Phase 4: Verification

After Phase 3 completes, verify the outputs yourself:

```python
import json, csv

# Load source data
summaries = json.load(open("all_summaries.json"))
ost = json.load(open("ost_final.json"))

# Check completeness
summary_numbers = {s["number"] for s in summaries}

ost_numbers = set()
for theme in ost["tree"]:
    for mid in theme["mid_level"]:
        for leaf in mid["leaves"]:
            ost_numbers.update(leaf["issue_numbers"])
for item in ost.get("unclustered", []):
    ost_numbers.add(item["number"])

missing_from_ost = summary_numbers - ost_numbers
extra_in_ost = ost_numbers - summary_numbers

print(f"Total summaries: {len(summaries)}")
print(f"Total in OST: {len(ost_numbers)}")
print(f"Missing from OST: {len(missing_from_ost)}")
print(f"Extra in OST: {len(extra_in_ost)}")

if missing_from_ost:
    print(f"  Missing issue numbers: {sorted(missing_from_ost)[:20]}...")

# Check CSV
with open("mermaid_issues_tagged.csv") as f:
    reader = csv.DictReader(f)
    csv_numbers = {int(row["issue_number"]) for row in reader}

missing_from_csv = summary_numbers - csv_numbers
print(f"Total in CSV: {len(csv_numbers)}")
print(f"Missing from CSV: {len(missing_from_csv)}")

# Theme distribution (by count and weighted impact)
print("\nTheme distribution:")
theme_stats = {}
for theme in ost["tree"]:
    theme_stats[theme["theme"]] = {
        "issues": theme["total_issues"],
        "impact": theme.get("total_weighted_impact", "N/A")
    }
for name, stats in sorted(theme_stats.items(), key=lambda x: -x[1]["issues"]):
    print(f"  {name}: {stats['issues']} issues, impact: {stats['impact']}")

# Persona distribution
personas = json.load(open("personas_final.json"))
print("\nPersona distribution:")
for p in sorted(personas, key=lambda x: -x.get("weighted_impact", x["issue_count"])):
    print(f"  {p['persona']}: {p['issue_count']} issues, impact: {p.get('weighted_impact', 'N/A')}")
    if "source_breakdown" in p:
        print(f"    as author: {p['source_breakdown'].get('as_author', '?')}, as commenter: {p['source_breakdown'].get('as_commenter', '?')}")
````

If there are discrepancies, fix them before considering the task complete.

---

## Execution Summary

| Phase | What                                      | Agents             | Parallelism                           |
| ----- | ----------------------------------------- | ------------------ | ------------------------------------- |
| 0     | Extract issues + comments via `gh`        | 0 (you do it)      | -                                     |
| 1     | Summarize issues (with comment analysis)  | ~28 workers        | 5-6 per wave, ~5 waves                |
| 2     | Build OST taxonomy with weighted personas | 2 classifiers      | Sequential (pass 2 depends on pass 1) |
| 3     | Produce deliverables                      | 2 (markdown + CSV) | Parallel                              |
| 4     | Verify outputs                            | 0 (you do it)      | -                                     |

**Expected output files:**

- `mermaid_ost_roadmap.md`: Strategic OST document for roadmap planning
- `mermaid_issues_tagged.csv`: Every issue tagged with outcome/theme/persona/engagement (convertible to .xlsx)
- `ost_final.json` + `personas_final.json`: Machine-readable intermediate data

**Total estimated agent spawns:** ~32
**Key constraint:** No agent ever calls the GitHub API. All data flows through `issues_raw.json`.

**Weighting system recap:**

weighted_impact = unique_commenters + demand_bonus + severity_bonus

- unique_commenters: distinct people on the thread (min 1). Primary signal: more people = more interest.
- demand_bonus: silent=0, noticed=0, wanted=1, heated=3. Qualitative signal from what commenters actually say.
- severity_bonus: cosmetic=0, functional=1, blocking=2.
- Leaf-level flags from comment_themes: "affects-production" (+1 per tagged issue), "regression" and "contribution-ready" (qualitative flags, not numeric).
- Older issues naturally accumulate more comments: that's accepted. Sustained interest over time IS a priority signal.
