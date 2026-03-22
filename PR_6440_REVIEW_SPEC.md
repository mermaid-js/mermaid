# PR #6440 - Event Modeling Diagram: Code Review Specification

**Review URL:** https://github.com/mermaid-js/mermaid/pull/6440#pullrequestreview-3974084714  
**Reviewer:** pbrolin47 (sisyphus-bot)  
**Date:** 2026-03-19  
**Status:** CHANGES_REQUESTED

---

## What's Working Well

### Langium Grammar

- Clean and idiomatic (`event-modeling.langium`)
- Good use of fragment rules and proper hidden terminals
- QualifiedName support for namespacing is a nice touch

### Architecture (Decider/Evolver)

- The Decider/Evolver architecture in `db.ts` is elegant and testable
- Using CQRS-style patterns to separate layout commands from state evolution makes the layout logic much easier to reason about and extend
- Better design than a monolithic `draw()` function

### Parser Tests

- Solid test coverage in `packages/parser/tests/eventmodeling.test.ts`
- Good coverage of multiple frame types, qualified names, data blocks, and multi-source relations

---

## Blocking Issues

### XSS: Unsanitized User Content Reaches D3 `.html()` via `foreignObject`

**Location:** `renderer.ts:48–57`

The renderer uses `foreignObject` + `xhtml:div` + `.html(box.text)`. D3's `.html()` is a direct wrapper around `element.innerHTML` and fires immediately on a live DOM node — **before** the final DOMPurify pass on the serialized SVG runs.

**Root Cause in `db.ts calculateTextProps()`:**

```typescript
const name = extractName(frame.entityIdentifier); // user text
let content = `<b>${name}</b>`; // raw interpolation

// ...dataInlineValue path:
toHtml = frame.dataInlineValue; // raw grammar token
toHtml = toHtml.substring(toHtml.indexOf('{') + 1); // stripped, not sanitized

// ...dataBlockValue path:
toHtml = dataEntity.dataBlockValue; // raw user block
toHtml = toHtml.replaceAll('\n', '<br/>');
toHtml = toHtml.replaceAll(' ', '&nbsp;'); // only spaces encoded; < > & are still raw
```

**Required Fix:**

1. Sanitize user strings at the **input** side in `calculateTextProps()`:
   ```typescript
   import { sanitizeText } from '../../diagrams/common/common.js';
   const name = sanitizeText(extractName(frame.entityIdentifier), getConfig());
   toHtml = sanitizeText(toHtml, getConfig());
   ```
2. Call `wrapLabel()` on plain text **before** wrapping in HTML tags
3. Preferred: Replace `foreignObject`/`.html()` with SVG `<text>`/`<tspan>` elements

### No Cypress E2E Visual Regression Tests

There are no Cypress test files for this diagram (nothing in `cypress/integration/rendering/eventmodeling*`).

**Required:** Add `cypress/integration/rendering/eventmodeling.spec.js` covering:

- State view pattern
- State change pattern
- Translation pattern

Example:

```javascript
import { imgSnapshotTest } from '../../helpers/util.ts';
describe('Event Modeling Diagram', () => {
  it('renders a state view pattern', () => {
    imgSnapshotTest(`
      eventmodeling
      tf 01 scn CartScreen
      tf 02 cmd AddItem
      tf 03 evt ItemAdded
    `);
  });
});
```

### Hardcoded Colors Break Theming

**Location:** `db.ts calculateEntityVisualProps()`

```typescript
case 'command': return { fill: '#bcd6fe', stroke: '#679ac3' };
case 'event':   return { fill: '#ffb778', stroke: '#c19a0f' };
```

Also hardcoded:

- Swimlane backgrounds in `renderer.ts` (`rgb(250,250,250)`, `rgb(240,240,240)`)
- Arrowhead fill (`#000`)

**Required:** Expose colors as theme variables in `config.schema.yaml`'s `$defs/EventModelingDiagramConfig`.

### Missing Changeset

No `.changeset/*.md` file was generated.

**Required:**

```bash
pnpm changeset
# select packages/mermaid, bump: minor
# message: feat: add Event Modeling diagram
```

---

## Important Issues

### Arrow Marker ID Not Scoped to Diagram

**Location:** `renderer.ts`

```typescript
diagram.append('defs').append('marker').attr('id', 'arrowhead');
```

**Fix:** Use scoped ID:

```typescript
.attr('id', `arrowhead-${id}`)
// ...
.attr('marker-end', `url(#arrowhead-${id})`)
```

### `eventmodeling.spec.ts` Fixture Uses Invalid Syntax

The fixture `fixtureMultipleRelations` uses:

```
tf 01 rmo CartScreen >f 02 >f 03 >f 04 >f 05
```

But the grammar defines source frame references as `('->>' sourceFrames+=[EmFrame:EM_FI])*`. `>f` is not valid grammar syntax — should be `->>`.

### `populateCommonDb` Is Not Called

**Location:** `parser.ts`

Accessibility and title won't work without calling `populateCommonDb(ast, db)`.

### Config Schema `rowHeight` Description Is Incorrect

**Location:** `config.schema.yaml`

```yaml
rowHeight:
  description: The height of each row in the packet diagram. # ← should say "event modeling"
```

Also: Verify `rowHeight` is actually used; if not, consider removing.

### `setupGraphViewbox` Called with `undefined`

**Location:** `renderer.ts` end of `draw()`

```typescript
setupGraphViewbox(undefined, diagram, 30, undefined);
```

**Fix:**

```typescript
setupGraphViewbox(
  undefined,
  diagram,
  DEFAULT_EVENTMODELING_CONFIG.padding ?? 30,
  DEFAULT_EVENTMODELING_CONFIG.useMaxWidth
);
```

---

## Nit Issues

- Stale `// @ts-ignore: JISON doesn't support types` comment in `diagram.ts` (diagram uses Langium, not JISON)
- `getDirection()` returns placeholder string `"the direction"`
- Large blocks of commented-out code in `db.ts`, `parser.ts`, `renderer.ts`
- `hasOwnProperty` called directly on object (use `Object.prototype.hasOwnProperty.call()` or `in` operator)
- `concept.md` and `pm.md` files appear to be working notes, not user documentation

---

## Summary

The architecture and implementation quality are genuinely impressive. Before merge:

1. **XSS/Sanitization** — User content must go through `sanitizeText()` before reaching `.html()`
2. **Cypress E2E Tests** — Visual regression tests are required
3. **Hardcoded Colors** — Expose as theme variables
4. **Missing Changeset** — Generate changeset for minor release
