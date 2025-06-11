# Jison to Chevrotain Parser Conversion Instructions

## Overview
This guide provides step-by-step instructions for converting a Jison-based parser to Chevrotain, specifically for the flowchart parser located at `src/diagrams/flowchart/parser/flow.jison`.

## Critical Requirements
- **Multi-mode lexing is MANDATORY** - This is crucial for mirroring Jison's lexical states
- Preserve the existing parser structure to maintain compatibility
- All original test cases must be included in the converted test suite
- Minimize changes to test implementation

## Understanding Jison States
The Jison parser uses multiple lexical states defined with `%x`:
- string, md_string, acc_title, acc_descr, acc_descr_multiline
- dir, vertex, text, ellipseText, trapText, edgeText
- thickEdgeText, dottedEdgeText, click, href, callbackname
- callbackargs, shapeData, shapeDataStr, shapeDataEndBracket

### State Management in Jison:
- `this.pushState(stateName)` or `this.begin(stateName)` - Enter a new state
- `this.popState()` - Return to the previous state
- States operate as a stack (LIFO - Last In, First Out)

## Conversion Process

### Phase 1: Analysis
1. **Study the Jison file thoroughly**
   - Map all lexical states and their purposes
   - Document which tokens are available in each state
   - Note all state transitions (when states are entered/exited)
   - Identify semantic actions and their data transformations

2. **Create a state transition diagram**
   - Document which tokens trigger state changes
   - Map the relationships between states
   - Identify any nested state scenarios

### Phase 2: Lexer Implementation
1. **Set up Chevrotain multi-mode lexer structure**
   - Create a mode for each Jison state
   - Define a default mode corresponding to Jison's INITIAL state
   - Ensure mode names match Jison state names for clarity

2. **Convert token definitions**
   - For each Jison token rule, create equivalent Chevrotain token
   - Pay special attention to tokens that trigger state changes
   - Preserve token precedence and ordering from Jison

3. **Implement state transitions**
   - Tokens that call `pushState` should use Chevrotain's push_mode
   - Tokens that call `popState` should use Chevrotain's pop_mode
   - Maintain the stack-based behavior of Jison states

### Phase 3: Parser Implementation
1. **Convert grammar rules**
   - Translate each Jison grammar rule to Chevrotain's format
   - Preserve the rule hierarchy and structure
   - Maintain the same rule names where possible

2. **Handle semantic actions**
   - Convert Jison's semantic actions to Chevrotain's visitor pattern
   - Ensure data structures remain compatible
   - Preserve any side effects or state mutations

### Phase 4: Testing Strategy
1. **Test file naming convention**
   - Original: `*.spec.js`
   - Converted: `*-chev.spec.ts`
   - Keep test files in the same directory: `src/diagrams/flowchart/parser/`

2. **Test conversion approach**
   - Copy each original test file
   - Rename with `-chev.spec.ts` suffix
   - Modify only the import statements and parser initialization
   - Keep test cases and assertions unchanged
   - Run tests individually: `vitest packages/mermaid/src/diagrams/flowchart/parser/flow-chev.spec.ts --run`

3. **Validation checklist**
   - All original test cases must pass
   - Test coverage should match the original
   - Performance should be comparable or better

### Phase 5: Integration
1. **API compatibility**
   - Ensure the new parser exposes the same public interface
   - Return values should match the original parser
   - Error messages should be equivalent

2. **Gradual migration**
   - Create a feature flag to switch between parsers
   - Allow parallel testing of both implementations
   - Monitor for any behavioral differences

## Common Pitfalls to Avoid
1. **State management differences**
   - Chevrotain's modes are more rigid than Jison's states
   - Ensure proper mode stack behavior is maintained
   - Test deeply nested state scenarios

2. **Token precedence**
   - Chevrotain's token ordering matters more than in Jison
   - Longer patterns should generally come before shorter ones
   - Test edge cases with ambiguous inputs

3. **Semantic action timing**
   - Chevrotain processes semantic actions differently
   - Ensure actions execute at the correct parse phase
   - Validate that data flows correctly through the parse tree

## Success Criteria
- All original tests pass with the new parser
- No changes required to downstream code
- Performance is equal or better
- Parser behavior is identical for all valid inputs
- Error handling remains consistent


# This is a reference to how Chevrotain handles multi-mode lexing

## Summary: Using Multi-Mode Lexing in Chevrotain

Chevrotain supports *multi-mode lexing*, allowing you to define different sets of tokenization rules (modes) that the lexer can switch between based on context. This is essential for parsing languages with embedded or context-sensitive syntax, such as HTML or templating languages[3][2].

**Key Concepts:**

- **Modes:** Each mode is an array of token types (constructors) defining the valid tokens in that context.
- **Mode Stack:** The lexer maintains a stack of modes. Only the top (current) mode's tokens are active at any time[2].
- **Switching Modes:**
  - Use `PUSH_MODE` on a token to switch to a new mode after matching that token.
  - Use `POP_MODE` on a token to return to the previous mode.

**Implementation Steps:**

1. **Define Tokens with Mode Switching:**
   - Tokens can specify `PUSH_MODE` or `POP_MODE` to control mode transitions.
   ```javascript
   const EnterLetters = createToken({ name: "EnterLetters", pattern: /LETTERS/, push_mode: "letter_mode" });
   const ExitLetters = createToken({ name: "ExitLetters", pattern: /EXIT_LETTERS/, pop_mode: true });
   ```

2. **Create the Multi-Mode Lexer Definition:**
   - Structure your modes as an object mapping mode names to arrays of token constructors.
   ```javascript
   const multiModeLexerDefinition = {
     modes: {
       numbers_mode: [One, Two, EnterLetters, ExitNumbers, Whitespace],
       letter_mode: [Alpha, Beta, ExitLetters, Whitespace],
     },
     defaultMode: "numbers_mode"
   };
   ```

3. **Instantiate the Lexer:**
   - Pass the multi-mode definition to the Chevrotain `Lexer` constructor.
   ```javascript
   const MultiModeLexer = new Lexer(multiModeLexerDefinition);
   ```

4. **Tokenize Input:**
   - The lexer will automatically switch modes as it encounters tokens with `PUSH_MODE` or `POP_MODE`.
   ```javascript
   const lexResult = MultiModeLexer.tokenize(input);
   ```

5. **Parser Integration:**
   - When constructing the parser, provide a flat array of all token constructors used in all modes, as the parser does not natively accept the multi-mode structure[1].
   ```javascript
   // Flatten all tokens from all modes for the parser
   let tokenCtors = [];
   for (let mode in multiModeLexerDefinition.modes) {
     tokenCtors = tokenCtors.concat(multiModeLexerDefinition.modes[mode]);
   }
   class MultiModeParser extends Parser {
     constructor(tokens) {
       super(tokens, tokenCtors);
     }
   }
   ```

**Best Practices:**

- Place more specific tokens before more general ones to avoid prefix-matching issues[2].
- Use the mode stack judiciously to manage nested or recursive language constructs.

**References:**
- Chevrotain documentation on [lexer modes][3]
- Example code and integration notes from Chevrotain issues and docs[1][2]

This approach enables robust, context-sensitive lexing for complex language grammars in Chevrotain.

[1] https://github.com/chevrotain/chevrotain/issues/395
[2] https://chevrotain.io/documentation/0_7_2/classes/lexer.html
[3] https://chevrotain.io/docs/features/lexer_modes.html
[4] https://github.com/SAP/chevrotain/issues/370
[5] https://galaxy.ai/youtube-summarizer/understanding-lexers-parsers-and-interpreters-with-chevrotain-l-jMsoAY64k
[6] https://chevrotain.io/documentation/8_0_1/classes/lexer.html
[7] https://fastly.jsdelivr.net/npm/chevrotain@11.0.3/src/scan/lexer.ts
[8] https://chevrotain.io/docs/guide/resolving_lexer_errors.html
[9] https://www.youtube.com/watch?v=l-jMsoAY64k
[10] https://github.com/SAP/chevrotain/blob/master/packages/chevrotain/test/scan/lexer_spec.ts

**Important**
Always assume I want the exact code edit!
Always assume I want you to apply this fixes directly!

# Running tests

Run tests in one file from the project root using this command:
`vitest #filename-relative-to-project-root# --run`

Example:
`vitest packages/mermaid/src/diagrams/flowchart/parser/flow-chev.spec.ts --run`

To run all flowchart test for the migration
`vitest packages/mermaid/src/diagrams/flowchart/parser/*flow*-chev.spec.ts --run`

To run a specific test in a test file:
`vitest #filename-relative-to-project-root# -t "string-matching-test" --run`

Example:
`vitest packages/mermaid/src/diagrams/flowchart/parser/flow-chev-singlenode.spec.js -t "diamond node with html in it (SN3)" --run`
