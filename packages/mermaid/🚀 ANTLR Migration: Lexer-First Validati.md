🚀 ANTLR Migration: Lexer-First Validation Strategy
Two-Phase Methodology for ANTLR
Phase 1: Lexer Validation (CURRENT FOCUS) 🎯
Objective: Ensure the ANTLR lexer rules produce identical tokenization results to the Jison lexer for ALL existing test cases.

Why This Matters:

❌ Jison → ANTLR migrations often fail because grammar rules hide subtle lexer differences

🔍 Tokenization is the backbone — wrong tokens guarantee wrong parse trees

✅ Validation-first ensures confidence: 100% token compatibility before parser work

Phase 1 Strategy:

Create a dedicated ANTLR lexer grammar (FlowLexer.g4) separate from the parser grammar at first

Extract all tokens (keywords, operators, symbols, whitespace, comments) from flow.jison

Generate ANTLR lexer and compare token streams against Jison’s lexer

Build a lexer comparison test harness:

Use ANTLR’s LexerATNSimulator (via Node.js / Java runtime)

Compare token-by-token with Jison lexer output

Fix discrepancies (regex patterns, greedy matching, fragment rules, modes) until 100% match

Document tricky edge cases (e.g. multiline strings, nested subgraphs)

Phase 2: Parser Implementation (FUTURE) 🔮
Objective: Implement ANTLR parser rules once lexer compatibility is guaranteed.

Phase 2 Strategy:

Promote lexer into a full grammar (Flow.g4) by adding parser rules

Incrementally port Jison grammar rules to ANTLR syntax

Jison productions → ANTLR parser rules

Inline regex tokens → references to validated lexer rules

Attach semantic actions via a Visitor/Listener pattern

Run parser validation tests on existing flowchart test suite

Iterate until all parser cases pass

Implementation Status for Migration
✅ Jison test cases available: flow.spec.js, flow-arrows.spec.js, etc.

✅ Lexer-first methodology proven with Chevrotain

❌ ANTLR lexer yet to be validated

❌ Parser work blocked until Phase 1 complete

Phase 1 Deliverables 📋
FlowLexer.g4 file replicating Jison tokenization

Lexer validation test suite comparing ANTLR vs Jison token streams

Report of all resolved lexer discrepancies

Baseline for Phase 2 parser work

Key Files for Phase 1 📁
packages/mermaid/src/diagrams/flowchart/parser/flow.jison – Original Jison grammar

packages/mermaid/src/diagrams/flowchart/parser/FlowLexer.g4 – New ANTLR lexer grammar

packages/mermaid/src/diagrams/flowchart/parser/flow\*.spec.js – Existing test suites

NEW: antlr-lexer-validation.spec.js – Token stream comparison tests

Why This Approach Will Succeed 🎯
Lexer-First Discipline: No parser distractions until tokens are validated

Systematic Validation: Every token sequence must match

ANTLR Visitor Pattern: Easier than embedding actions in grammar

Cross-Validation: Jison provides a gold standard for tokenization

Battle-Tested: Chevrotain migration proved this strategy works

Immediate Next Steps ⚡
Write initial FlowLexer.g4 with tokens from Jison

Build ANTLR lexer test harness for Node.js

Run test cases: Jison lexer vs ANTLR lexer

Fix greedy/non-greedy mismatches, regex fragments, modes

Achieve 100% token match

Begin parser migration with confidence

Success Criteria for Phase 1 ✅
100% ANTLR lexer compatibility with Jison on all tests

Comprehensive lexer test suite

No lexer discrepancies remain

Well-documented lexer behavior for edge cases

Ready-to-implement parser grammar

Expected Timeline ⏰
Phase 1 (Lexer): 1–2 weeks

Phase 2 (Parser): 2–3 weeks

Total: 3–5 weeks

Why This Will Work with ANTLR 💪
ANTLR Lexer Modes can replicate Jison’s start conditions

Fragments & Channels give fine-grained control over whitespace/comments

Visitor pattern separates parsing logic from semantic processing

Validation-first eliminates hidden lexer bugs

🎯 CURRENT MISSION: Create FlowLexer.g4, build lexer validation harness, and achieve 100% ANTLR-Jison lexer compatibility before writing parser rules.
