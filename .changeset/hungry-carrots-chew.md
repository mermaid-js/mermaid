---
'mermaid': patch
---

fix: loosen `uuid` dependency range to allow v14

Mermaid does not use any of the vulnerable code in CVE-2026-41907,
but this allows users to silence any `npm audit` alerts on it.
