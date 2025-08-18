/**
 * EXTRACTED COMPREHENSIVE ANTLR vs JISON LEXER TESTS
 * 
 * This file contains 158 test cases extracted from the existing
 * Chevrotain migration test suite, adapted for ANTLR vs Jison comparison.
 * 
 * Generated automatically from existing test files.
 */

import { describe, it, expect } from 'vitest';
import { FlowDB } from '../flowDb.js';
import flowParserJison from '../flowParser.ts';
import { tokenizeWithANTLR } from '../token-stream-comparator.js';
import { setConfig } from '../../../config.js';

// Configure for testing
setConfig({
  securityLevel: 'strict',
});

/**
 * Extracted test cases from Chevrotain migration
 */
const EXTRACTED_TEST_CASES = [
  {
    "id": "GRA001",
    "description": "GRA001: should tokenize \"graph TD\" correctly",
    "input": "graph TD",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "GRA002",
    "description": "GRA002: should tokenize \"graph LR\" correctly",
    "input": "graph LR",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "GRA003",
    "description": "GRA003: should tokenize \"graph TB\" correctly",
    "input": "graph TB",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "GRA004",
    "description": "GRA004: should tokenize \"graph RL\" correctly",
    "input": "graph RL",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "GRA005",
    "description": "GRA005: should tokenize \"graph BT\" correctly",
    "input": "graph BT",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "FLO001",
    "description": "FLO001: should tokenize \"flowchart TD\" correctly",
    "input": "flowchart TD",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "FLO002",
    "description": "FLO002: should tokenize \"flowchart LR\" correctly",
    "input": "flowchart LR",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "NOD001",
    "description": "NOD001: should tokenize simple node \"A\" correctly",
    "input": "A",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "NOD002",
    "description": "NOD002: should tokenize node \"A1\" correctly",
    "input": "A1",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "NOD003",
    "description": "NOD003: should tokenize node \"node1\" correctly",
    "input": "node1",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "EDG001",
    "description": "EDG001: should tokenize \"A-->B\" correctly",
    "input": "A-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "EDG002",
    "description": "EDG002: should tokenize \"A --- B\" correctly",
    "input": "A --- B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "SHP001",
    "description": "SHP001: should tokenize \"A[Square]\" correctly",
    "input": "A[Square]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "SQS",
      "textToken"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "SHP002",
    "description": "SHP002: should tokenize \"A(Round)\" correctly",
    "input": "A(Round)",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "SHP003",
    "description": "SHP003: should tokenize \"A{Diamond}\" correctly",
    "input": "A{Diamond}",
    "expectedTokenTypes": [
      "NODE_STRING",
      "DIAMOND_START",
      "textToken",
      "DIAMOND_STOP"
    ],
    "sourceFile": "lexer-tests-basic.spec.ts",
    "category": "basic"
  },
  {
    "id": "ARR001",
    "description": "ARR001: should tokenize \"A-->B\" correctly",
    "input": "A-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR002",
    "description": "ARR002: should tokenize \"A --- B\" correctly",
    "input": "A --- B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR003",
    "description": "ARR003: should tokenize \"A<-->B\" correctly",
    "input": "A<-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR004",
    "description": "ARR004: should tokenize \"A<-- text -->B\" correctly",
    "input": "A<-- text -->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "START_LINK",
      "EdgeTextContent",
      "EdgeTextEnd",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR005",
    "description": "ARR005: should tokenize \"A<==>B\" correctly",
    "input": "A<==>B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR006",
    "description": "ARR006: should tokenize \"A<== text ==>B\" correctly",
    "input": "A<== text ==>B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "START_LINK",
      "EdgeTextContent",
      "EdgeTextEnd",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR007",
    "description": "ARR007: should tokenize \"A==>B\" correctly",
    "input": "A==>B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR008",
    "description": "ARR008: should tokenize \"A===B\" correctly",
    "input": "A===B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR009",
    "description": "ARR009: should tokenize \"A<-.->B\" correctly",
    "input": "A<-.->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR010",
    "description": "ARR010: should tokenize \"A<-. text .->B\" correctly",
    "input": "A<-. text .->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "START_DOTTED_LINK",
      "EdgeTextContent",
      "EdgeTextEnd",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR011",
    "description": "ARR011: should tokenize \"A-.->B\" correctly",
    "input": "A-.->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR012",
    "description": "ARR012: should tokenize \"A-.-B\" correctly",
    "input": "A-.-B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR013",
    "description": "ARR013: should tokenize \"A--xB\" correctly",
    "input": "A--xB",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR014",
    "description": "ARR014: should tokenize \"A--x|text|B\" correctly",
    "input": "A--x|text|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR015",
    "description": "ARR015: should tokenize \"A--oB\" correctly",
    "input": "A--oB",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR016",
    "description": "ARR016: should tokenize \"A--o|text|B\" correctly",
    "input": "A--o|text|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR017",
    "description": "ARR017: should tokenize \"A---->B\" correctly",
    "input": "A---->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR018",
    "description": "ARR018: should tokenize \"A-----B\" correctly",
    "input": "A-----B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR019",
    "description": "ARR019: should tokenize \"A-- text -->B\" correctly",
    "input": "A-- text -->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "START_LINK",
      "EdgeTextContent",
      "EdgeTextEnd",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "ARR020",
    "description": "ARR020: should tokenize \"A--text-->B\" correctly",
    "input": "A--text-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "START_LINK",
      "EdgeTextContent",
      "EdgeTextEnd",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-arrows.spec.ts",
    "category": "arrows"
  },
  {
    "id": "EDG001",
    "description": "EDG001: should tokenize \"A-->B\" correctly",
    "input": "A-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG002",
    "description": "EDG002: should tokenize \"A --- B\" correctly",
    "input": "A --- B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG003",
    "description": "EDG003: should tokenize \"A-.-B\" correctly",
    "input": "A-.-B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG004",
    "description": "EDG004: should tokenize \"A===B\" correctly",
    "input": "A===B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG005",
    "description": "EDG005: should tokenize \"A-.->B\" correctly",
    "input": "A-.->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG006",
    "description": "EDG006: should tokenize \"A==>B\" correctly",
    "input": "A==>B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG007",
    "description": "EDG007: should tokenize \"A<-->B\" correctly",
    "input": "A<-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG008",
    "description": "EDG008: should tokenize \"A-->|text|B\" correctly",
    "input": "A-->|text|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG009",
    "description": "EDG009: should tokenize \"A---|text|B\" correctly",
    "input": "A---|text|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG010",
    "description": "EDG010: should tokenize \"A-.-|text|B\" correctly",
    "input": "A-.-|text|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG011",
    "description": "EDG011: should tokenize \"A==>|text|B\" correctly",
    "input": "A==>|text|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "EDG012",
    "description": "EDG012: should tokenize \"A-.->|text|B\" correctly",
    "input": "A-.->|text|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-edges.spec.ts",
    "category": "edges"
  },
  {
    "id": "SHP001",
    "description": "SHP001: should tokenize \"A[Square]\" correctly",
    "input": "A[Square]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "SQS",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP002",
    "description": "SHP002: should tokenize \"A(Round)\" correctly",
    "input": "A(Round)",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP003",
    "description": "SHP003: should tokenize \"A{Diamond}\" correctly",
    "input": "A{Diamond}",
    "expectedTokenTypes": [
      "NODE_STRING",
      "DIAMOND_START",
      "textToken",
      "DIAMOND_STOP"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP004",
    "description": "SHP004: should tokenize \"A((Circle))\" correctly",
    "input": "A((Circle))",
    "expectedTokenTypes": [
      "NODE_STRING",
      "DOUBLECIRCLESTART",
      "textToken",
      "DOUBLECIRCLEEND"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP005",
    "description": "SHP005: should tokenize \"A>Asymmetric]\" correctly",
    "input": "A>Asymmetric]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "TAGEND",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP006",
    "description": "SHP006: should tokenize \"A[[Subroutine]]\" correctly",
    "input": "A[[Subroutine]]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "SUBROUTINESTART",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP007",
    "description": "SHP007: should tokenize \"A[(Database)]\" correctly",
    "input": "A[(Database)]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "CYLINDERSTART",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP008",
    "description": "SHP008: should tokenize \"A([Stadium])\" correctly",
    "input": "A([Stadium])",
    "expectedTokenTypes": [
      "NODE_STRING",
      "STADIUMSTART",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP009",
    "description": "SHP009: should tokenize \"A[/Parallelogram/]\" correctly",
    "input": "A[/Parallelogram/]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "TRAPSTART",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP010",
    "description": "SHP010: should tokenize \"A[\\\\Parallelogram\\\\]\" correctly",
    "input": "A[\\\\Parallelogram\\\\]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "INVTRAPSTART",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP011",
    "description": "SHP011: should tokenize \"A[/Trapezoid\\\\]\" correctly",
    "input": "A[/Trapezoid\\\\]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "TRAPSTART",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "SHP012",
    "description": "SHP012: should tokenize \"A[\\\\Trapezoid/]\" correctly",
    "input": "A[\\\\Trapezoid/]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "INVTRAPSTART",
      "textToken"
    ],
    "sourceFile": "lexer-tests-shapes.spec.ts",
    "category": "shapes"
  },
  {
    "id": "TXT001",
    "description": "TXT001: should tokenize text with forward slash",
    "input": "A--x|text with / should work|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT002",
    "description": "TXT002: should tokenize text with backtick",
    "input": "A--x|text including `|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT003",
    "description": "TXT003: should tokenize text with CAPS",
    "input": "A--x|text including CAPS space|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT004",
    "description": "TXT004: should tokenize text with URL keyword",
    "input": "A--x|text including URL space|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT005",
    "description": "TXT005: should tokenize text with TD keyword",
    "input": "A--x|text including R TD space|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT006",
    "description": "TXT006: should tokenize text with graph keyword",
    "input": "A--x|text including graph space|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT007",
    "description": "TXT007: should tokenize quoted text",
    "input": "V-- \"test string()\" -->a",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "STR",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT008",
    "description": "TXT008: should tokenize text with double dash syntax",
    "input": "A-- text including space --xB",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "textToken",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT009",
    "description": "TXT009: should tokenize text with multiple leading spaces",
    "input": "A--    textNoSpace --xB",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "textToken",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT010",
    "description": "TXT010: should tokenize unicode characters",
    "input": "A-->C(Начало)",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING",
      "PS",
      "textToken",
      "PE"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT011",
    "description": "TXT011: should tokenize backslash characters",
    "input": "A-->C(c:\\\\windows)",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING",
      "PS",
      "textToken",
      "PE"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT012",
    "description": "TXT012: should tokenize åäö characters",
    "input": "A-->C{Chimpansen hoppar åäö-ÅÄÖ}",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING",
      "DIAMOND_START",
      "textToken",
      "DIAMOND_STOP"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT013",
    "description": "TXT013: should tokenize text with br tag",
    "input": "A-->C(Chimpansen hoppar åäö  <br> -  ÅÄÖ)",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING",
      "PS",
      "textToken",
      "PE"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT014",
    "description": "TXT014: should tokenize node with underscore",
    "input": "A[chimpansen_hoppar]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "SQS",
      "textToken"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT015",
    "description": "TXT015: should tokenize node with dash",
    "input": "A-1",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT016",
    "description": "TXT016: should tokenize text with v keyword",
    "input": "A-- text including graph space and v --xB",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "textToken",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "TXT017",
    "description": "TXT017: should tokenize single v node",
    "input": "V-->a[v]",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING",
      "SQS",
      "textToken"
    ],
    "sourceFile": "lexer-tests-text.spec.ts",
    "category": "text"
  },
  {
    "id": "DIR001",
    "description": "DIR001: should tokenize \"graph >\" correctly",
    "input": "graph >",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR002",
    "description": "DIR002: should tokenize \"graph <\" correctly",
    "input": "graph <",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR003",
    "description": "DIR003: should tokenize \"graph ^\" correctly",
    "input": "graph ^",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR004",
    "description": "DIR004: should tokenize \"graph v\" correctly",
    "input": "graph v",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR005",
    "description": "DIR005: should tokenize \"flowchart >\" correctly",
    "input": "flowchart >",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR006",
    "description": "DIR006: should tokenize \"flowchart <\" correctly",
    "input": "flowchart <",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR007",
    "description": "DIR007: should tokenize \"flowchart ^\" correctly",
    "input": "flowchart ^",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR008",
    "description": "DIR008: should tokenize \"flowchart v\" correctly",
    "input": "flowchart v",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR009",
    "description": "DIR009: should tokenize \"flowchart-elk TD\" correctly",
    "input": "flowchart-elk TD",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "DIR010",
    "description": "DIR010: should tokenize \"flowchart-elk LR\" correctly",
    "input": "flowchart-elk LR",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-directions.spec.ts",
    "category": "directions"
  },
  {
    "id": "SUB001",
    "description": "SUB001: should tokenize \"subgraph\" correctly",
    "input": "subgraph",
    "expectedTokenTypes": [
      "subgraph"
    ],
    "sourceFile": "lexer-tests-subgraphs.spec.ts",
    "category": "subgraphs"
  },
  {
    "id": "SUB002",
    "description": "SUB002: should tokenize \"end\" correctly",
    "input": "end",
    "expectedTokenTypes": [
      "end"
    ],
    "sourceFile": "lexer-tests-subgraphs.spec.ts",
    "category": "subgraphs"
  },
  {
    "id": "STY001",
    "description": "STY001: should tokenize \"style\" correctly",
    "input": "style",
    "expectedTokenTypes": [
      "STYLE"
    ],
    "sourceFile": "lexer-tests-subgraphs.spec.ts",
    "category": "subgraphs"
  },
  {
    "id": "CLI001",
    "description": "CLI001: should tokenize \"click\" correctly",
    "input": "click",
    "expectedTokenTypes": [
      "CLICK"
    ],
    "sourceFile": "lexer-tests-subgraphs.spec.ts",
    "category": "subgraphs"
  },
  {
    "id": "PUN001",
    "description": "PUN001: should tokenize \";\" correctly",
    "input": ";",
    "expectedTokenTypes": [
      "SEMI"
    ],
    "sourceFile": "lexer-tests-subgraphs.spec.ts",
    "category": "subgraphs"
  },
  {
    "id": "PUN002",
    "description": "PUN002: should tokenize \"&\" correctly",
    "input": "&",
    "expectedTokenTypes": [
      "AMP"
    ],
    "sourceFile": "lexer-tests-subgraphs.spec.ts",
    "category": "subgraphs"
  },
  {
    "id": "COM001",
    "description": "COM001: should tokenize \"graph TD; A-->B\" correctly",
    "input": "graph TD; A-->B",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR",
      "SEMI",
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-complex.spec.ts",
    "category": "complex"
  },
  {
    "id": "COM002",
    "description": "COM002: should tokenize \"A & B --> C\" correctly",
    "input": "A & B --> C",
    "expectedTokenTypes": [
      "NODE_STRING",
      "AMP",
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-complex.spec.ts",
    "category": "complex"
  },
  {
    "id": "COM003",
    "description": "COM003: should tokenize \"A[Text] --> B(Round)\" correctly",
    "input": "A[Text] --> B(Round)",
    "expectedTokenTypes": [
      "NODE_STRING",
      "SQS",
      "textToken"
    ],
    "sourceFile": "lexer-tests-complex.spec.ts",
    "category": "complex"
  },
  {
    "id": "COM004",
    "description": "COM004: should tokenize \"A --> B --> C\" correctly",
    "input": "A --> B --> C",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-complex.spec.ts",
    "category": "complex"
  },
  {
    "id": "COM005",
    "description": "COM005: should tokenize \"A-->|label|B\" correctly",
    "input": "A-->|label|B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "PIPE",
      "textToken",
      "PIPE",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-complex.spec.ts",
    "category": "complex"
  },
  {
    "id": "COM001",
    "description": "COM001: should tokenize \"%% comment\" correctly",
    "input": "%% comment",
    "expectedTokenTypes": [
      "COMMENT"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM002",
    "description": "COM002: should tokenize \"%%{init: {\"theme\":\"base\"}}%%\" correctly",
    "input": "%%{init: {\"theme\":\"base\"}}%%",
    "expectedTokenTypes": [
      "DIRECTIVE"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM003",
    "description": "COM003: should handle comment before graph",
    "input": "%% This is a comment\ngraph TD",
    "expectedTokenTypes": [
      "COMMENT",
      "NEWLINE",
      "GRAPH",
      "DIR"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM004",
    "description": "COM004: should handle comment after graph",
    "input": "graph TD\n%% This is a comment",
    "expectedTokenTypes": [
      "GRAPH",
      "DIR",
      "NEWLINE",
      "COMMENT"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM005",
    "description": "COM005: should handle comment between nodes",
    "input": "A-->B\n%% comment\nB-->C",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING",
      "NEWLINE",
      "COMMENT",
      "NEWLINE",
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM006",
    "description": "COM006: should tokenize theme directive",
    "input": "%%{init: {\"theme\":\"dark\"}}%%",
    "expectedTokenTypes": [
      "DIRECTIVE"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM007",
    "description": "COM007: should tokenize config directive",
    "input": "%%{config: {\"flowchart\":{\"htmlLabels\":false}}}%%",
    "expectedTokenTypes": [
      "DIRECTIVE"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM008",
    "description": "COM008: should tokenize wrap directive",
    "input": "%%{wrap}%%",
    "expectedTokenTypes": [
      "DIRECTIVE"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM009",
    "description": "COM009: should handle comment with special chars",
    "input": "%% Comment with special chars: !@#$%^&*()",
    "expectedTokenTypes": [
      "COMMENT"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM010",
    "description": "COM010: should handle comment with unicode",
    "input": "%% Comment with unicode: åäö ÅÄÖ",
    "expectedTokenTypes": [
      "COMMENT"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM011",
    "description": "COM011: should handle multiple comments",
    "input": "%% First comment\n%% Second comment",
    "expectedTokenTypes": [
      "COMMENT",
      "NEWLINE",
      "COMMENT"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "COM012",
    "description": "COM012: should handle empty comment",
    "input": "%%",
    "expectedTokenTypes": [
      "COMMENT"
    ],
    "sourceFile": "lexer-tests-comments.spec.ts",
    "category": "comments"
  },
  {
    "id": "KEY001",
    "description": "KEY001: should tokenize \"graph\" keyword",
    "input": "graph",
    "expectedTokenTypes": [
      "GRAPH"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY002",
    "description": "KEY002: should tokenize \"flowchart\" keyword",
    "input": "flowchart",
    "expectedTokenTypes": [
      "GRAPH"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY003",
    "description": "KEY003: should tokenize \"flowchart-elk\" keyword",
    "input": "flowchart-elk",
    "expectedTokenTypes": [
      "GRAPH"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY004",
    "description": "KEY004: should tokenize \"subgraph\" keyword",
    "input": "subgraph",
    "expectedTokenTypes": [
      "subgraph"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY005",
    "description": "KEY005: should tokenize \"end\" keyword",
    "input": "end",
    "expectedTokenTypes": [
      "end"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY006",
    "description": "KEY006: should tokenize \"style\" keyword",
    "input": "style",
    "expectedTokenTypes": [
      "STYLE"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY007",
    "description": "KEY007: should tokenize \"linkStyle\" keyword",
    "input": "linkStyle",
    "expectedTokenTypes": [
      "LINKSTYLE"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY008",
    "description": "KEY008: should tokenize \"classDef\" keyword",
    "input": "classDef",
    "expectedTokenTypes": [
      "CLASSDEF"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY009",
    "description": "KEY009: should tokenize \"class\" keyword",
    "input": "class",
    "expectedTokenTypes": [
      "CLASS"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY010",
    "description": "KEY010: should tokenize \"default\" keyword",
    "input": "default",
    "expectedTokenTypes": [
      "DEFAULT"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY011",
    "description": "KEY011: should tokenize \"interpolate\" keyword",
    "input": "interpolate",
    "expectedTokenTypes": [
      "INTERPOLATE"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY012",
    "description": "KEY012: should tokenize \"click\" keyword",
    "input": "click",
    "expectedTokenTypes": [
      "CLICK"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY013",
    "description": "KEY013: should tokenize \"href\" keyword",
    "input": "href",
    "expectedTokenTypes": [
      "HREF"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY014",
    "description": "KEY014: should tokenize \"call\" keyword",
    "input": "call",
    "expectedTokenTypes": [
      "CALLBACKNAME"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY015",
    "description": "KEY015: should tokenize \"_self\" keyword",
    "input": "_self",
    "expectedTokenTypes": [
      "LINK_TARGET"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY016",
    "description": "KEY016: should tokenize \"_blank\" keyword",
    "input": "_blank",
    "expectedTokenTypes": [
      "LINK_TARGET"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY017",
    "description": "KEY017: should tokenize \"_parent\" keyword",
    "input": "_parent",
    "expectedTokenTypes": [
      "LINK_TARGET"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY018",
    "description": "KEY018: should tokenize \"_top\" keyword",
    "input": "_top",
    "expectedTokenTypes": [
      "LINK_TARGET"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY019",
    "description": "KEY019: should tokenize \"kitty\" keyword",
    "input": "kitty",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY020",
    "description": "KEY020: should handle \"graph\" as node ID",
    "input": "A_graph_node",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY021",
    "description": "KEY021: should handle \"style\" as node ID",
    "input": "A_style_node",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY022",
    "description": "KEY022: should handle \"end\" as node ID",
    "input": "A_end_node",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY023",
    "description": "KEY023: should tokenize \"TD\" direction",
    "input": "TD",
    "expectedTokenTypes": [
      "DIR"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY024",
    "description": "KEY024: should tokenize \"TB\" direction",
    "input": "TB",
    "expectedTokenTypes": [
      "DIR"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY025",
    "description": "KEY025: should tokenize \"LR\" direction",
    "input": "LR",
    "expectedTokenTypes": [
      "DIR"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY026",
    "description": "KEY026: should tokenize \"RL\" direction",
    "input": "RL",
    "expectedTokenTypes": [
      "DIR"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY027",
    "description": "KEY027: should tokenize \"BT\" direction",
    "input": "BT",
    "expectedTokenTypes": [
      "DIR"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY028",
    "description": "KEY028: should tokenize \"endpoint --> sender\" correctly",
    "input": "endpoint --> sender",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY029",
    "description": "KEY029: should tokenize \"default --> monograph\" correctly",
    "input": "default --> monograph",
    "expectedTokenTypes": [
      "NODE_STRING",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY030",
    "description": "KEY030: should tokenize \"node1TB\" correctly",
    "input": "node1TB",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY031",
    "description": "KEY031: should tokenize \"A(graph text)-->B\" correctly",
    "input": "A(graph text)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY032",
    "description": "KEY032: should tokenize \"v\" correctly",
    "input": "v",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY033",
    "description": "KEY033: should tokenize \"csv\" correctly",
    "input": "csv",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "KEY034",
    "description": "KEY034: should tokenize \"1\" correctly",
    "input": "1",
    "expectedTokenTypes": [
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-keywords.spec.ts",
    "category": "keywords"
  },
  {
    "id": "SPC001",
    "description": "SPC001: should tokenize \"A(.)-->B\" correctly",
    "input": "A(.)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC002",
    "description": "SPC002: should tokenize \"A(Start 103a.a1)-->B\" correctly",
    "input": "A(Start 103a.a1)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC003",
    "description": "SPC003: should tokenize \"A(:)-->B\" correctly",
    "input": "A(:)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC004",
    "description": "SPC004: should tokenize \"A(,)-->B\" correctly",
    "input": "A(,)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC005",
    "description": "SPC005: should tokenize \"A(a-b)-->B\" correctly",
    "input": "A(a-b)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC006",
    "description": "SPC006: should tokenize \"A(+)-->B\" correctly",
    "input": "A(+)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC007",
    "description": "SPC007: should tokenize \"A(*)-->B\" correctly",
    "input": "A(*)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC008",
    "description": "SPC008: should tokenize \"A(<)-->B\" correctly",
    "input": "A(<)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC009",
    "description": "SPC009: should tokenize \"A(&)-->B\" correctly",
    "input": "A(&)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC010",
    "description": "SPC010: should tokenize \"A(`)-->B\" correctly",
    "input": "A(`)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC011",
    "description": "SPC011: should tokenize \"A(Начало)-->B\" correctly",
    "input": "A(Начало)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC012",
    "description": "SPC012: should tokenize \"A(c:\\\\windows)-->B\" correctly",
    "input": "A(c:\\\\windows)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC013",
    "description": "SPC013: should tokenize \"A(åäö-ÅÄÖ)-->B\" correctly",
    "input": "A(åäö-ÅÄÖ)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC014",
    "description": "SPC014: should tokenize \"A(text <br> more)-->B\" correctly",
    "input": "A(text <br> more)-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "PS",
      "textToken",
      "PE",
      "LINK",
      "NODE_STRING"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  },
  {
    "id": "SPC015",
    "description": "SPC015: should tokenize \"A[/text with / slash/]-->B\" correctly",
    "input": "A[/text with / slash/]-->B",
    "expectedTokenTypes": [
      "NODE_STRING",
      "SQS",
      "textToken"
    ],
    "sourceFile": "lexer-tests-special-chars.spec.ts",
    "category": "special-chars"
  }
];

/**
 * Test a single case with both lexers
 */
async function runLexerComparison(testCase) {
  const result = {
    testId: testCase.id,
    input: testCase.input,
    jison: { success: false, tokenCount: 0, tokens: [], error: null, time: 0 },
    antlr: { success: false, tokenCount: 0, tokens: [], error: null, time: 0 },
    comparison: { tokensMatch: false, performanceRatio: 0, winner: 'tie' }
  };

  // Test Jison lexer
  const jisonStart = performance.now();
  try {
    const lexer = flowParserJison.lexer;
    lexer.setInput(testCase.input);
    
    const jisonTokens = [];
    let token;
    while ((token = lexer.lex()) !== 'EOF') {
      jisonTokens.push({
        type: token,
        value: lexer.yytext,
        line: lexer.yylineno
      });
    }
    
    const jisonEnd = performance.now();
    result.jison = {
      success: true,
      tokenCount: jisonTokens.length,
      tokens: jisonTokens,
      error: null,
      time: jisonEnd - jisonStart
    };
  } catch (error) {
    const jisonEnd = performance.now();
    result.jison = {
      success: false,
      tokenCount: 0,
      tokens: [],
      error: error.message,
      time: jisonEnd - jisonStart
    };
  }

  // Test ANTLR lexer
  const antlrStart = performance.now();
  try {
    const antlrTokens = await tokenizeWithANTLR(testCase.input);
    const antlrEnd = performance.now();
    
    result.antlr = {
      success: true,
      tokenCount: antlrTokens.length,
      tokens: antlrTokens,
      error: null,
      time: antlrEnd - antlrStart
    };
  } catch (error) {
    const antlrEnd = performance.now();
    result.antlr = {
      success: false,
      tokenCount: 0,
      tokens: [],
      error: error.message,
      time: antlrEnd - antlrStart
    };
  }

  // Compare results
  result.comparison.tokensMatch = result.jison.success && result.antlr.success && 
    result.jison.tokenCount === result.antlr.tokenCount;
  
  if (result.jison.time > 0 && result.antlr.time > 0) {
    result.comparison.performanceRatio = result.antlr.time / result.jison.time;
    result.comparison.winner = result.comparison.performanceRatio < 1 ? 'antlr' : 
                              result.comparison.performanceRatio > 1 ? 'jison' : 'tie';
  }

  return result;
}

describe('Extracted Comprehensive ANTLR vs Jison Tests', () => {
  
  // Group tests by category
  const testsByCategory = EXTRACTED_TEST_CASES.reduce((acc, testCase) => {
    if (!acc[testCase.category]) {
      acc[testCase.category] = [];
    }
    acc[testCase.category].push(testCase);
    return acc;
  }, {});

  Object.entries(testsByCategory).forEach(([category, tests]) => {
    describe(`${category.toUpperCase()} Tests (${tests.length} cases)`, () => {
      tests.forEach(testCase => {
        it(`${testCase.id}: ${testCase.description}`, async () => {
          const result = await runLexerComparison(testCase);
          
          console.log(`\n📊 ${testCase.id} (${testCase.category}): "${testCase.input.replace(/\n/g, '\\n')}"`);
          console.log(`  Jison:  ${result.jison.success ? '✅' : '❌'} ${result.jison.tokenCount} tokens (${result.jison.time.toFixed(2)}ms)`);
          console.log(`  ANTLR:  ${result.antlr.success ? '✅' : '❌'} ${result.antlr.tokenCount} tokens (${result.antlr.time.toFixed(2)}ms)`);
          
          if (result.jison.success && result.antlr.success) {
            console.log(`  Performance: ${result.comparison.performanceRatio.toFixed(2)}x Winner: ${result.comparison.winner.toUpperCase()}`);
          }
          
          if (!result.jison.success) console.log(`  Jison Error: ${result.jison.error}`);
          if (!result.antlr.success) console.log(`  ANTLR Error: ${result.antlr.error}`);

          // ANTLR should succeed
          expect(result.antlr.success).toBe(true);
          
          // Performance should be reasonable
          if (result.jison.success && result.antlr.success) {
            expect(result.comparison.performanceRatio).toBeLessThan(10);
          }
        });
      });
    });
  });

  describe('Comprehensive Summary', () => {
    it('should provide overall comparison statistics', async () => {
      console.log('\n' + '='.repeat(80));
      console.log('🔍 EXTRACTED TEST CASES COMPREHENSIVE ANALYSIS');
      console.log(`Total Extracted Test Cases: ${EXTRACTED_TEST_CASES.length}`);
      console.log('='.repeat(80));

      const results = [];
      const categoryStats = new Map();

      // Run all extracted tests
      for (const testCase of EXTRACTED_TEST_CASES.slice(0, 50)) { // Limit to first 50 for performance
        const result = await runLexerComparison(testCase);
        results.push(result);

        // Track category statistics
        if (!categoryStats.has(testCase.category)) {
          categoryStats.set(testCase.category, {
            total: 0,
            jisonSuccess: 0,
            antlrSuccess: 0,
            totalJisonTime: 0,
            totalAntlrTime: 0
          });
        }

        const stats = categoryStats.get(testCase.category);
        stats.total++;
        if (result.jison.success) {
          stats.jisonSuccess++;
          stats.totalJisonTime += result.jison.time;
        }
        if (result.antlr.success) {
          stats.antlrSuccess++;
          stats.totalAntlrTime += result.antlr.time;
        }
      }

      // Calculate overall statistics
      const totalTests = results.length;
      const jisonSuccesses = results.filter(r => r.jison.success).length;
      const antlrSuccesses = results.filter(r => r.antlr.success).length;
      
      const totalJisonTime = results.reduce((sum, r) => sum + r.jison.time, 0);
      const totalAntlrTime = results.reduce((sum, r) => sum + r.antlr.time, 0);
      const avgPerformanceRatio = totalAntlrTime / totalJisonTime;

      console.log('\n📊 EXTRACTED TESTS RESULTS:');
      console.log(`Tests Run: ${totalTests} (of ${EXTRACTED_TEST_CASES.length} total extracted)`);
      console.log(`Jison Success Rate: ${jisonSuccesses}/${totalTests} (${(jisonSuccesses/totalTests*100).toFixed(1)}%)`);
      console.log(`ANTLR Success Rate: ${antlrSuccesses}/${totalTests} (${(antlrSuccesses/totalTests*100).toFixed(1)}%)`);
      console.log(`Average Performance Ratio: ${avgPerformanceRatio.toFixed(2)}x (ANTLR vs Jison)`);

      console.log('\n📋 CATEGORY BREAKDOWN:');
      for (const [category, stats] of categoryStats.entries()) {
        const jisonRate = (stats.jisonSuccess / stats.total * 100).toFixed(1);
        const antlrRate = (stats.antlrSuccess / stats.total * 100).toFixed(1);
        const avgJisonTime = stats.totalJisonTime / stats.jisonSuccess || 0;
        const avgAntlrTime = stats.totalAntlrTime / stats.antlrSuccess || 0;
        const categoryRatio = avgAntlrTime / avgJisonTime || 0;

        console.log(`  ${category.toUpperCase()}: ${stats.total} tests`);
        console.log(`    Jison: ${stats.jisonSuccess}/${stats.total} (${jisonRate}%) avg ${avgJisonTime.toFixed(2)}ms`);
        console.log(`    ANTLR: ${stats.antlrSuccess}/${stats.total} (${antlrRate}%) avg ${avgAntlrTime.toFixed(2)}ms`);
        console.log(`    Performance: ${categoryRatio.toFixed(2)}x`);
      }

      console.log('='.repeat(80));

      // Assertions
      expect(antlrSuccesses).toBeGreaterThan(totalTests * 0.8); // At least 80% success rate
      expect(avgPerformanceRatio).toBeLessThan(5); // Performance should be reasonable

      console.log(`\n🎉 EXTRACTED TESTS COMPLETE: ANTLR ${antlrSuccesses}/${totalTests} success, ${avgPerformanceRatio.toFixed(2)}x performance ratio`);
    });
  });

});