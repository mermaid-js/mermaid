---
'@mermaid-js/examples': minor
---

Add relatable, real-world examples for every diagram type, showcasing each diagram's strengths

- Most diagrams now ship multiple examples: a relatable default plus examples that highlight distinctive features (e.g. flowchart subgraphs and expanded node shapes, sequence `alt`/`par`/`loop` blocks, state composite states and concurrency, gantt milestones and dependencies, git tags and cherry-picks, ER keys and comments, quadrant point styling, treemap value formatting, architecture junctions).
- Replaced placeholder content (abstract `A/B/C` nodes, lorem-ipsum-style boards) with realistic scenarios such as checkout flows, sprint boards, budgets, release workflows, and root-cause analyses.
- Every example is now parse-validated in the package test suite and rendered in the Cypress rendering tests.
