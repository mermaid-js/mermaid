# Mermaid Local Editor

Standalone local editor for Mermaid diagrams.
Runs entirely from `dist/` with no external dependencies.

---

## Usage

```sh
pnpm build:mermaid:full
```

---

## Build Pipeline

The `build:mermaid:full` command performs the following steps:

1. **Clean**

   Removes the existing build output:

   ```sh
   pnpm clean
   ```

2. **Build Mermaid**

   Compiles Mermaid using the repository build pipeline:

   ```sh
   pnpm build:mermaid
   ```

3. **Copy Editor**

   Copies the local editor sources into the distribution directory:

   ```sh
   pnpm copy:editor
   ```

4. **Bundle Dependencies**

   Copies required runtime dependencies into the editor bundle:

   ```sh
   pnpm copy:mermaid
   pnpm copy:dompurify
   ```

5. **Serve**

   Starts a local static server:

   ```sh
   pnpm serve:dist
   ```

---

## Output

After build, the editor is available at [`packages/mermaid/dist/mermaid-local-editor/`](../mermaid/dist/mermaid-local-editor):

---

## Notes

- No external CDN dependencies are used
- DOMPurify is bundled locally
- The editor is fully offline-capable
- Designed to run directly from the `dist/` directory
