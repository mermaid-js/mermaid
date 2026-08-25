---
'mermaid': patch
---

fix: stop a trailing comma on a Gantt task line from killing the render. The empty field pushed the task past the three fields the parser handles and fell through an empty `default:`, leaving the task with no start time and throwing "Cannot read properties of undefined (reading 'type')" at draw time. A trailing comma is now ignored, and a task with genuinely too many fields fails at parse with the offending line named.
