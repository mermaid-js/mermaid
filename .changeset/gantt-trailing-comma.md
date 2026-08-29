---
'mermaid': patch
---

fix: report a Gantt task with more comma separated fields than it can have, instead of crashing at render. A trailing comma or an extra field pushed the task past the three fields the parser handles and fell through an empty `default:`, leaving it with no start time and throwing "Cannot read properties of undefined (reading 'type')" at draw time. It now fails at parse with the offending definition quoted.
