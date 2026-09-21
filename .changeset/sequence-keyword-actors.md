---
'mermaid': patch
---

fix(sequence): allow actor-menu keywords as participant ids in messages

A participant declared as `Link` (or `Links`, `Properties`, `Details`) could not be used as a
message endpoint: the lexer matched the name as the `link` statement keyword and the parse failed.
The `link`, `links`, `properties` and `details` keywords are now only recognized when an actor
follows them on the same line, so participant ids that happen to spell these words work in
messages, while the statements themselves keep parsing as before.
