/**
 * Comprehensive Test Cases for ANTLR Lexer Validation
 * 
 * This file contains flowchart input strings extracted from existing test files
 * to be used for lexer validation between ANTLR and Jison implementations.
 * 
 * Test cases are organized by category for systematic validation.
 */

export const LEXER_TEST_CASES = {
  
  // Basic graph declarations
  basicDeclarations: [
    'graph TD',
    'graph LR',
    'graph RL',
    'graph BT',
    'graph TB',
    'flowchart TD',
    'flowchart LR',
    'flowchart RL',
    'flowchart BT',
    'flowchart TB',
    'flowchart-elk TD',
    'graph >',  // angle bracket direction
    'graph <',
    'graph ^',
    'graph v'
  ],
  
  // Simple node connections
  simpleConnections: [
    'A-->B',
    'A --> B',
    'A->B',
    'A -> B',
    'A---B',
    'A --- B',
    'A-.-B',
    'A -.-> B',
    'A<-->B',
    'A<->B',
    'A===B',
    'A ==> B',
    'A~~B',
    'A ~~ B'
  ],
  
  // Complete simple graphs
  simpleGraphs: [
    'graph TD;\nA-->B;',
    'graph TD\nA-->B',
    'graph TD;\nA --> B;',
    'graph TD\nA --> B\n style e red',
    'graph TD\nendpoint --> sender',
    'graph TD;A--x|text including URL space|B;',
    'graph TB;subgraph "number as labels";1;end;'
  ],
  
  // Node shapes
  nodeShapes: [
    'graph TD;A;',
    'graph TD;A ;',
    'graph TD;a[A];',
    'graph TD;a((A));',
    'graph TD;a(A);',
    'graph TD;a>A];',
    'graph TD;a{A};',
    'graph TD;a[/A/];',
    'graph TD;a[\\A\\];',
    'graph TD;a([A]);',
    'graph TD;a[[A]];',
    'graph TD;a[(A)];',
    'graph TD;a(((A)));',
    'graph TD;a(-A-);'
  ],
  
  // Edge text and labels
  edgeLabels: [
    'A-->|Text|B',
    'A -->|Text| B',
    'A--Text-->B',
    'A -- Text --> B',
    'A-.Text.->B',
    'A -. Text .-> B',
    'A==Text==>B',
    'A == Text ==> B'
  ],
  
  // Subgraphs
  subgraphs: [
    'subgraph A\nend',
    'subgraph "Title"\nend',
    'subgraph A\nB-->C\nend',
    'subgraph A[Title]\nB-->C\nend'
  ],
  
  // Styling
  styling: [
    'style A fill:#f9f,stroke:#333,stroke-width:4px',
    'style A fill:red',
    'linkStyle 0 stroke:#ff3,stroke-width:4px',
    'classDef default fill:#f9f,stroke:#333,stroke-width:4px',
    'class A,B,C someclass'
  ],
  
  // Interactivity
  interactivity: [
    'click A "http://www.github.com"',
    'click A call callback()',
    'click A href "http://www.github.com"',
    'click A call callback("arg1", "arg2")'
  ],
  
  // Accessibility
  accessibility: [
    'accTitle: Big decisions',
    'accDescr: Flow chart description',
    'accDescr {\nMultiline description\nwith second line\n}'
  ],
  
  // Markdown strings
  markdownStrings: [
    'A["`The cat in **the** hat`"]',
    'A -- "`The *bat* in the chat`" --> B',
    'A["`**Bold** and *italic*`"]'
  ],
  
  // Complex real-world examples
  complexExamples: [
    `graph LR
      accTitle: Big decisions
      accDescr: Flow chart of the decision making process
      A[Hard] -->|Text| B(Round)
      B --> C{Decision}
      C -->|One| D[Result 1]
      C -->|Two| E[Result 2]`,
      
    `graph LR
      accTitle: Big decisions
      accDescr {
        Flow chart of the decision making process
        with a second line
      }
      A[Hard] -->|Text| B(Round)
      B --> C{Decision}
      C -->|One| D[Result 1]
      C -->|Two| E[Result 2]`,
      
    `flowchart
A["\`The cat in **the** hat\`"]-- "\`The *bat* in the chat\`" -->B["The dog in the hog"] -- "The rat in the mat" -->C;`,

    `graph TD
      A --> B
      B --> C
      C --> D
      style A fill:#f9f,stroke:#333,stroke-width:4px
      style B fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5`
  ],
  
  // Edge cases and special characters
  edgeCases: [
    '',  // empty input
    '   \n  \t  ',  // whitespace only
    'graph TD;\n\n\n %% Comment\n A-->B; \n B-->C;',  // comments and whitespace
    'graph TD;  node1TB\n',  // direction in node names
    'graph TD; default.node;default-node;default/node;',  // keywords in node names
    'A-->B;B-->A;',  // minimal without graph declaration
    'graph LR;A-->B;B-->A;A-->B;B-->A;A-->B;'  // repeated patterns
  ],
  
  // Unicode and special characters
  unicodeAndSpecial: [
    'graph TD; α --> β',
    'graph TD; 中文 --> 日本語',
    'graph TD; "Node with spaces" --> B',
    'graph TD; A --> "Another node with spaces"',
    'graph TD; A[Node with [brackets]] --> B',
    'graph TD; A{Node with {braces}} --> B'
  ],
  
  // Direction variations
  directions: [
    'graph TD;A-->B;',
    'graph LR;A-->B;',
    'graph RL;A-->B;',
    'graph BT;A-->B;',
    'graph TB;A-->B;',
    'flowchart TD;A-->B;',
    'flowchart LR;A-->B;',
    'flowchart RL;A-->B;',
    'flowchart BT;A-->B;',
    'flowchart TB;A-->B;'
  ]
};

/**
 * Get all test cases as a flat array
 * @returns {Array<string>} All test case strings
 */
export function getAllTestCases() {
  const allCases = [];
  for (const category in LEXER_TEST_CASES) {
    allCases.push(...LEXER_TEST_CASES[category]);
  }
  return allCases;
}

/**
 * Get test cases by category
 * @param {string} category - Category name
 * @returns {Array<string>} Test cases for the category
 */
export function getTestCasesByCategory(category) {
  return LEXER_TEST_CASES[category] || [];
}

/**
 * Get all category names
 * @returns {Array<string>} Category names
 */
export function getCategories() {
  return Object.keys(LEXER_TEST_CASES);
}
