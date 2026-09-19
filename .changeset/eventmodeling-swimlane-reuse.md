---
'mermaid': patch
---

fix(eventmodeling): reuse a namespace's swimlane when it re-enters its lane

Each namespace + band (UI/automation, command/read-model, event) combination should
map to a single swimlane. When a namespace returned to a band after another namespace
had appeared in it, a duplicate lane was created, because the generated swimlanes never
stored their namespace and the reuse lookup was not scoped to the band. Swimlanes now
carry their namespace and are matched within the correct band, so a namespace reuses its
existing lane instead of opening a new one.
