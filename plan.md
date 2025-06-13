# Chevrotain Parser Implementation Plan

## Current Status: 86% Complete ✅

**Progress**: 174/203 tests passing (86% success rate)

**Major Achievements**:
- ✅ Fixed grammar ambiguity issues
- ✅ Added `standaloneLinkStatement` to statement rule with proper lookahead
- ✅ Core parser architecture is working
- ✅ Most single node, vertex, and basic edge tests are passing

## Remaining Issues: 29 Tests (3 Core Problems)

### ✅ COMPLETED: Phase 3 - Special Characters (4 tests)
**Status**: FIXED - All special character tests now passing
**Solution**: Removed conflicting punctuation tokens from lexer main mode
**Impact**: +2 tests (174/203 passing)

### 1. Node Creation in Edges (17 tests) - HIGH PRIORITY
**Problem**: `Cannot read properties of undefined (reading 'id')`
**Root Cause**: When parsing edges like `A-->B`, vertices A and B are not being created in the vertices map

**Examples of Failing Tests**:
- `should handle basic arrow` (`A-->B`)
- `should handle multiple edges` (`A-->B; B-->C`)
- `should handle chained edges` (`A-->B-->C`)

**Solution Strategy**:
1. **Investigate which grammar rule is actually being used** for failing tests
2. **Add vertex creation to all edge processing paths**:
   - `standaloneLinkStatement` visitor (already has `ensureVertex()`)
   - `vertexStatement` with link chains
   - Any other edge processing methods
3. **Test the fix incrementally** with one failing test at a time

**Implementation Steps**:
```typescript
// In flowAst.ts - ensure all edge processing creates vertices
private ensureVertex(nodeId: string): void {
  if (!this.vertices[nodeId]) {
    this.vertices[nodeId] = {
      id: nodeId,
      text: nodeId,
      type: 'default',
    };
  }
}

// Add to ALL methods that process edges:
// - standaloneLinkStatement ✅ (already done)
// - vertexStatement (when it has link chains)
// - linkChain processing
// - Any other edge creation paths
```

### 2. Arrow Text Parsing (10 tests) - MEDIUM PRIORITY
**Problem**: `Parse error: Expecting token of type --> EOF <-- but found --> '|' <--`
**Root Cause**: Lexer not properly handling pipe character `|` in arrow text patterns like `A-->|text|B`

**Examples of Failing Tests**:
- `should handle arrow with text` (`A-->|text|B`)
- `should handle edges with quoted text` (`A-->|"quoted text"|B`)

**Solution Strategy**:
1. **Fix lexer mode switching** for pipe characters
2. **Follow original JISON grammar** for arrow text patterns
3. **Implement proper tokenization** of `LINK + PIPE + text + PIPE` sequences

**Implementation Steps**:
```typescript
// In flowLexer.ts - fix pipe character handling
// Current issue: PIPE token conflicts with text content
// Solution: Use lexer modes or proper token precedence

// 1. Check how JISON handles |text| patterns
// 2. Implement similar tokenization in Chevrotain
// 3. Ensure link text is properly captured and processed
```

### 3. Special Characters at Node Start (4 tests) - LOW PRIORITY
**Problem**: Specific characters (`:`, `&`, `,`, `-`) at start of node IDs not being parsed
**Root Cause**: TOKEN precedence issues where punctuation tokens override NODE_STRING

**Examples of Failing Tests**:
- Node IDs starting with `:`, `&`, `,`, `-`

**Solution Strategy**:
1. **Adjust token precedence** in lexer
2. **Modify NODE_STRING pattern** to handle special characters
3. **Test with each special character individually**

## Execution Plan

### Phase 1: Fix Node Creation (Target: +17 tests = 189/203 passing)
**Timeline**: 1-2 hours
**Priority**: HIGH - This affects the most tests

1. **Debug which grammar rule is being used** for failing edge tests
   ```bash
   # Add logging to AST visitor methods to see which path is taken
   vitest packages/mermaid/src/diagrams/flowchart/parser/flow-chev-arrows.spec.js -t "should handle basic arrow" --run
   ```

2. **Add vertex creation to all edge processing paths**
   - Check `vertexStatement` when it processes link chains
   - Check `linkChain` processing
   - Ensure `ensureVertex()` is called for all edge endpoints

3. **Test incrementally**
   ```bash
   # Test one failing test at a time
   vitest packages/mermaid/src/diagrams/flowchart/parser/flow-chev-arrows.spec.js -t "should handle basic arrow" --run
   ```

### Phase 2: Fix Arrow Text Parsing (Target: +10 tests = 199/203 passing)
**Timeline**: 2-3 hours
**Priority**: MEDIUM - Complex lexer issue

1. **Analyze original JISON grammar** for arrow text patterns
   ```bash
   # Check how flow.jison handles |text| patterns
   grep -n "EdgeText\|PIPE" packages/mermaid/src/diagrams/flowchart/parser/flow.jison
   ```

2. **Fix lexer tokenization** for pipe characters
   - Implement proper mode switching or token precedence
   - Ensure `A-->|text|B` tokenizes as `NODE_STRING LINK PIPE TEXT PIPE NODE_STRING`

3. **Update grammar rules** to handle arrow text
   - Ensure link rules can consume pipe-delimited text
   - Test with various text patterns (quoted, unquoted, complex)

### Phase 3: Fix Special Characters (Target: +4 tests = 203/203 passing)
**Timeline**: 1 hour
**Priority**: LOW - Affects fewest tests

1. **Identify token conflicts** for each special character
2. **Adjust lexer token order** or patterns
3. **Test each character individually**

## Success Criteria

### Phase 1 Success:
- [ ] All basic edge tests pass (`A-->B`, `A-->B-->C`, etc.)
- [ ] Vertices are created for all edge endpoints
- [ ] No regression in currently passing tests

### Phase 2 Success:
- [ ] All arrow text tests pass (`A-->|text|B`)
- [ ] Lexer properly tokenizes pipe-delimited text
- [ ] Grammar correctly parses arrow text patterns

### Phase 3 Success:
- [ ] All special character tests pass
- [ ] Node IDs can start with `:`, `&`, `,`, `-`
- [ ] No conflicts with other tokens

### Final Success:
- [ ] **203/203 tests passing (100%)**
- [ ] Full compatibility with original JISON parser
- [ ] All existing functionality preserved

## Risk Mitigation

### High Risk: Breaking Currently Passing Tests
**Mitigation**: Run full test suite after each change
```bash
vitest packages/mermaid/src/diagrams/flowchart/parser/*flow*-chev*.spec.js --run
```

### Medium Risk: Lexer Changes Affecting Other Patterns
**Mitigation**: Test with diverse input patterns, not just failing tests

### Low Risk: Performance Impact
**Mitigation**: Current implementation is already efficient, changes should be minimal

## Tools and Commands

### Run Specific Test:
```bash
vitest packages/mermaid/src/diagrams/flowchart/parser/flow-chev-arrows.spec.js -t "should handle basic arrow" --run
```

### Run All Chevrotain Tests:
```bash
vitest packages/mermaid/src/diagrams/flowchart/parser/*flow*-chev*.spec.js --run
```

### Debug Lexer Tokenization:
```typescript
// In flowParserAdapter.ts
const lexResult = FlowChevLexer.tokenize(input);
console.debug('Tokens:', lexResult.tokens.map(t => [t.image, t.tokenType.name]));
console.debug('Errors:', lexResult.errors);
```

### Check Grammar Rule Usage:
```typescript
// Add logging to AST visitor methods
console.debug('Using standaloneLinkStatement for:', ctx);
```

## Next Actions

1. **Start with Phase 1** - Fix node creation (highest impact)
2. **Debug the exact grammar path** being taken for failing tests
3. **Add vertex creation to all edge processing methods**
4. **Test incrementally** to avoid regressions
5. **Move to Phase 2** only after Phase 1 is complete

This systematic approach ensures we fix the most impactful issues first while maintaining the stability of the 85% of tests that are already passing.
