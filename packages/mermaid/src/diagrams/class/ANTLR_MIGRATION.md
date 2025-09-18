## ANTLR migration plan for Class Diagrams (parity with Sequence)

This guide summarizes how to migrate the Class diagram parser from Jison to ANTLR (antlr4ng), following the approach used for Sequence diagrams. The goal is full feature parity and 100% test pass rate, while keeping the Jison implementation as the reference until the ANTLR path is green.

### Objectives

- Keep the existing Jison parser as the authoritative reference until parity is achieved
- Add an ANTLR parser behind a runtime flag (`USE_ANTLR_PARSER=true`), mirroring Sequence
- Achieve 100% test compatibility with the current Jison behavior, including error cases
- Keep the public DB and rendering contracts unchanged

---

## 1) Prep and references

- Use the Sequence migration as a template for structure, scripts, and patterns:
  - antlr4ng grammar files: `SequenceLexer.g4`, `SequenceParser.g4`
  - wrapper: `antlr-parser.ts` providing a Jison-compatible `parse()` and `yy`
  - generation script: `pnpm --filter mermaid run antlr:sequence`
- For Class diagrams, identify analogous files:
  - Jison grammar: `packages/mermaid/src/diagrams/class/parser/classDiagram.jison`
  - DB: `packages/mermaid/src/diagrams/class/classDb.ts`
  - Tests: `packages/mermaid/src/diagrams/class/classDiagram.spec.js`
- Confirm Class diagram features in the Jison grammar and tests: classes, interfaces, enums, relationships (e.g., `--`, `*--`, `o--`, `<|--`, `--|>`), visibility markers (`+`, `-`, `#`, `~`), generics (`<T>`, nested), static/abstract indicators, fields/properties, methods (with parameters and return types), stereotypes (`<< >>`), notes, direction, style/config lines, and titles/accessibility lines if supported.

---

## 2) Create ANTLR grammars

- Create `ClassLexer.g4` and `ClassParser.g4` under `packages/mermaid/src/diagrams/class/parser/antlr/`
- Lexer design guidelines (mirror Sequence approach):
  - Implement stateful lexing with modes to replicate Jison behavior (e.g., default, line/rest-of-line, config/title/acc modes if used)
  - Ensure token precedence resolves conflicts between relation arrows and generics (`<|--` vs `<T>`). Prefer longest-match arrow tokens and handle generics in parser context
  - Accept identifiers that include special characters that Jison allowed (quotes, underscores, digits, unicode as applicable)
  - Provide tokens for core keywords and symbols: `class`, `interface`, `enum`, relationship operators, visibility markers, `<< >>` stereotypes, `{ }` blocks, `:` type separators, `,` parameter separators, `[` `]` arrays, `<` `>` generics
  - Reuse common tokens shared across diagrams where appropriate (e.g., `TITLE`, `ACC_...`) if Class supports them
- Parser design guidelines:
  - Follow the Jison grammar structure closely to minimize semantic drift
  - Allow the final statement in the file to omit a trailing newline (to avoid EOF vs NEWLINE mismatches)
  - Keep non-ambiguous rules for:
    - Class declarations and bodies (members split into fields/properties vs methods)
    - Modifiers (visibility, static, abstract)
    - Types (simple, namespaced, generic with nesting)
    - Relationships with labels (left->right/right->left forms) and multiplicities
    - Stereotypes and notes
    - Optional global lines (title, accTitle, accDescr) if supported by class diagrams

---

## 3) Add the wrapper and flag switch

- Add `packages/mermaid/src/diagrams/class/parser/antlr/antlr-parser.ts`:
  - Export an object `{ parse, parser, yy }` that mirrors the Jison parser shape
  - `parse(input)` should:
    - `this.yy.clear()` to reset DB (same as Sequence)
    - Build ANTLR's lexer/parser, set `BailErrorStrategy` to fail-fast on syntax errors
    - Walk the tree with a listener that calls classDb methods
  - Implement no-op bodies for `visitTerminal`, `visitErrorNode`, `enterEveryRule`, `exitEveryRule` (required by ParseTreeWalker)
  - Avoid `require()`; import from `antlr4ng`
  - Use minimal `any`; when casting is unavoidable, add clear comments
- Add `packages/mermaid/src/diagrams/class/parser/classParser.ts` similar to Sequence `sequenceParser.ts`:
  - Import both the Jison parser and the ANTLR wrapper
  - Gate on `process.env.USE_ANTLR_PARSER === 'true'`
  - Normalize whitespace if Jison relies on specific newlines (keep parity with Sequence patterns)

---

## 4) Implement the listener (semantic actions)

Map parsed constructs to classDb calls. Typical handlers include:

- Class-like declarations
  - `db.addClass(id, { type: 'class'|'interface'|'enum', ... })`
  - `db.addClassMember(id, member)` for fields/properties/methods (capture visibility, static/abstract, types, params)
  - Stereotypes, annotations, notes: `db.addAnnotation(...)`, `db.addNote(...)` if applicable
- Relationships
  - Parse arrow/operator to relation type; map to db constants (composition/aggregation/inheritance/realization/association)
  - `db.addRelation(lhs, rhs, { type, label, multiplicity })`
- Title/Accessibility (if supported in Class diagrams)
  - `db.setDiagramTitle(...)`, `db.setAccTitle(...)`, `db.setAccDescription(...)`
- Styles/Directives/Config lines as supported by the Jison grammar

Error handling:

- Use BailErrorStrategy; let invalid constructs throw where Jison tests expect failure
- For robustness parity, only swallow exceptions in places where Jison tolerated malformed content without aborting

---

## 5) Scripts and generation

- Add package scripts similar to Sequence in `packages/mermaid/package.json`:
  - `antlr:class:clean`: remove generated TS
  - `antlr:class`: run antlr4ng to generate TS into `parser/antlr/generated`
- Example command (once scripts exist):
  - `pnpm --filter mermaid run antlr:class`

---

## 6) Tests (Vitest)

- Run existing Class tests with the ANTLR parser enabled:
  - `USE_ANTLR_PARSER=true pnpm vitest packages/mermaid/src/diagrams/class/classDiagram.spec.js --run`
- Start by making a small focused subset pass, then expand to the full suite
- Add targeted tests for areas where the ANTLR grammar needs extra coverage (e.g., nested generics, tricky arrow/operator precedence, stereotypes, notes)
- Keep test expectations identical to Jison’s behavior; only adjust if Jison’s behavior was explicitly flaky and already tolerated in the repo

---

## 7) Linting and quality

- Satisfy ESLint rules enforced in the repo:
  - Prefer imports over `require()`; no empty methods, avoid untyped `any` where reasonable
  - If `@ts-ignore` is necessary, include a descriptive reason (≥10 chars)
- Provide minimal types for listener contexts where helpful; keep casts localized and commented
- Prefix diagnostic debug logs with the project’s preferred prefix if temporary logging is needed (and clean up before commit)

---

## 8) Common pitfalls and tips

- NEWLINE vs EOF: allow the last statement without a trailing newline to prevent InputMismatch
- Token conflicts: order matters; ensure relationship operators (e.g., `<|--`, `--|>`, `*--`, `o--`) win over generic `<`/`>` in the right contexts
- Identifiers: match Jison’s permissiveness (quoted names, digits where allowed) and avoid over-greedy tokens that eat operators
- Listener resilience: ensure classes and endpoints exist before adding relations (create implicitly if Jison did so)
- Error parity: do not swallow exceptions for cases where tests expect failure

---

## 9) Rollout checklist

- [ ] Grammar compiles and generated files are committed
- [ ] `USE_ANTLR_PARSER=true` passes all Class diagram tests
- [ ] Sequence and other diagram suites remain green
- [ ] No new ESLint errors; warnings minimized
- [ ] PR includes notes on parity and how to run the ANTLR tests

---

## 10) Quick command reference

- Generate ANTLR targets (after adding scripts):
  - `pnpm --filter mermaid run antlr:class`
- Run Class tests with ANTLR parser:
  - `USE_ANTLR_PARSER=true pnpm vitest packages/mermaid/src/diagrams/class/classDiagram.spec.js --run`
- Run a single test:
  - `USE_ANTLR_PARSER=true pnpm vitest packages/mermaid/src/diagrams/class/classDiagram.spec.js -t "some test name" --run`
