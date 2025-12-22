# Dev Explorer frontend: architecture + debugging notes

## Root cause of the “CSS changes do nothing” problem

The page loads `/dev/styles.css`, but **document-level CSS does not apply through a shadow DOM boundary**.

Historically, `dev-explorer-app` was a `LitElement` using Lit’s default `shadowRoot`, while the rest of the UI used light DOM. That meant:

- The browser showed the _right classes_ (`card`, `card-folder`, `card-file`) in Elements panel.
- `/dev/styles.css` was clearly being served/updated.
- Yet computed styles for `.card` looked like UA defaults because the selector never matched across the shadow root.

Fix: make `dev-explorer-app` light DOM too (`createRenderRoot() { return this; }`), so `/dev/styles.css` reliably styles the whole UI.

## Debugging traps (and fast detection)

- **Shadow DOM trap**
  - Symptom: “CSS is loaded but doesn’t apply”, especially for simple class selectors.
  - Fast check:
    - DevTools console: `document.querySelector('dev-explorer-app')?.shadowRoot`
      - If non-null, global CSS won’t style inside it.
    - Or: right-click an element you expect styled → “Reveal in Elements” → see if it’s under `#shadow-root`.

- **“Light DOM child inside shadow DOM parent” trap**
  - Even if a child component uses `createRenderRoot() { return this; }`,
    if it’s _rendered inside the parent’s shadow root_, it’s still effectively in shadow for document styles.

- **Dev loop trap (CSS-only changes don’t trigger reload)**
  - The server watches TypeScript bundle inputs + `.mmd` files; static `/dev/styles.css` previously didn’t emit SSE reload events.
  - That makes CSS changes look flaky unless you manually refresh.
  - Fix: watch `.esbuild/dev-explorer/public/**/*` and emit SSE on changes.

- **Caching trap (less common here, but real)**
  - If a query param is constant (`?v=3`) and you don’t reload, the browser can keep a cached stylesheet.
  - Fast check: DevTools → Network → disable cache + hard reload; or check “(from disk cache)” on the CSS request.

## Styling strategy recommendation (pragmatic)

For a dev-only explorer, keep it simple:

- **Light DOM everywhere**
- **One stylesheet**: `.esbuild/dev-explorer/public/styles.css` served as `/dev/styles.css`
- **Scoped selectors** under `dev-explorer-app` to avoid generic class collisions (`.header`, `.content`, etc.)

If you later _want_ Shadow DOM isolation, do it deliberately:

- Put UI styles in Lit `static styles` or adopt a `CSSStyleSheet` into `this.renderRoot.adoptedStyleSheets`.
- Avoid relying on document CSS selectors for component internals.

## Shoelace integration notes

- Current setup is correct for dev: `setBasePath('/dev/vendor/shoelace')` and `registerIconLibrary(...)`.
- Prefer theming via CSS variables (Shoelace tokens) rather than overriding internal parts everywhere.
