import { parseUsecase } from './usecaseParser.js';

// Test basic usecase diagram parsing
function testBasicUsecaseParsing() {
  const input = `usecase
 actor Developer1
 actor Developer2
 actor Developer3`;

  const result = parseUsecase(input);
  console.log('Test Basic Usecase Parsing:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test simple usecase diagram
function testSimpleUsecaseParsing() {
  const input = `usecase
 actor User
 actor Admin`;

  const result = parseUsecase(input);
  console.log('Test Simple Usecase Parsing:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test metadata parsing
function testMetadataParsing() {
  const input = `usecase
 actor Developer1@{ icon : 'icon_name', place: "sample place" }`;

  const result = parseUsecase(input);
  console.log('Test Metadata Parsing:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test complex metadata parsing
function testComplexMetadataParsing() {
  const input = `usecase
 actor Developer1@{ icon : 'icon_name', type : 'hollow', place: "sample place", material:"sample" }`;

  const result = parseUsecase(input);
  console.log('Test Complex Metadata Parsing:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test mixed actors (with and without metadata)
function testMixedActorsParsing() {
  const input = `usecase
 actor User
 actor Developer1@{ icon : 'dev_icon' }
 actor Admin@{ type: 'admin', place: "office" }`;

  const result = parseUsecase(input);
  console.log('Test Mixed Actors Parsing:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test multiple actors in single line
function testMultipleActorsSingleLine() {
  const input = `usecase
 actor Developer1, Developer2, Developer3`;

  const result = parseUsecase(input);
  console.log('Test Multiple Actors Single Line:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test multiple actors with metadata
function testMultipleActorsWithMetadata() {
  const input = `usecase
 actor Developer1@{ icon: 'dev' }, Developer2, Developer3@{ type: 'admin' }`;

  const result = parseUsecase(input);
  console.log('Test Multiple Actors With Metadata:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test five actors in single line
function testFiveActorsSingleLine() {
  const input = `usecase
 actor Developer1, Developer2, Developer3, Developer4, Developer5`;

  const result = parseUsecase(input);
  console.log('Test Five Actors Single Line:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test system boundary parsing
function testSystemBoundaryParsing() {
  const input = `usecase
 actor Developer1
 systemBoundary Tasks
   coding
   testing
   deploying
 end`;

  const result = parseUsecase(input);
  console.log('Test System Boundary Parsing:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test mixed actors and system boundaries
function testMixedActorsAndBoundaries() {
  const input = `usecase
 actor Developer1, Developer2
 systemBoundary Tasks
   coding
   testing
 end
 actor Admin`;

  const result = parseUsecase(input);
  console.log('Test Mixed Actors and Boundaries:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test curly brace system boundary parsing
function testCurlyBraceSystemBoundary() {
  const input = `usecase
 actor Developer1
 systemBoundary Tasks {
   playing
   reviewing
 }`;

  const result = parseUsecase(input);
  console.log('Test Curly Brace System Boundary:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test relationship parsing
function testRelationshipParsing() {
  const input = `usecase
 actor Developer1
 systemBoundary Tasks {
   playing
   reviewing
 }
 Developer1 --> playing
 Developer1 --> reviewing`;

  const result = parseUsecase(input);
  console.log('Test Relationship Parsing:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test complete example
function testCompleteExample() {
  const input = `usecase
 actor Developer1
 systemBoundary Tasks {
   playing
   reviewing
 }
 Developer1 --> playing
 Developer1 --> reviewing`;

  const result = parseUsecase(input);
  console.log('Test Complete Example:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test node definitions
function testNodeDefinitions() {
  const input = `usecase
 actor Tester1
 Tester1 --> c(Go through testing)`;

  const result = parseUsecase(input);
  console.log('Test Node Definitions:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test inline actor-node relationships
function testInlineActorNodeRelationships() {
  const input = `usecase
 actor Developer1 --> a(Go through code)
 actor Developer2 --> b(Go through implementation)`;

  const result = parseUsecase(input);
  console.log('Test Inline Actor-Node Relationships:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test mixed syntax
function testMixedSyntax() {
  const input = `usecase
 actor Tester1
 Tester1 --> c(Go through testing)
 actor Developer1 --> a(Go through code)
 actor Developer2 --> b(Go through implementation)`;

  const result = parseUsecase(input);
  console.log('Test Mixed Syntax:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test edge labels
function testEdgeLabels() {
  const input = `usecase
 actor Developer1
 Developer1 --task2--> c(Go through testing)`;

  const result = parseUsecase(input);
  console.log('Test Edge Labels:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test edge labels with inline syntax
function testInlineEdgeLabels() {
  const input = `usecase
 actor Developer1 --task1--> a(Go through code)`;

  const result = parseUsecase(input);
  console.log('Test Inline Edge Labels:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Test mixed edge labels and regular arrows
function testMixedEdgeLabels() {
  const input = `usecase
 actor Developer1
 actor Tester1
 Developer1 --task1--> a(Go through code)
 Tester1 --> b(Go through testing)`;

  const result = parseUsecase(input);
  console.log('Test Mixed Edge Labels:');
  console.log('Success:', result.success);
  if (result.success && result.ast) {
    console.log('Statements:', result.ast.statements.length);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  } else {
    console.log('Errors:', result.errors);
  }
  console.log('---');
}

// Run tests
console.log('Running Usecase Parser Tests...\n');
testBasicUsecaseParsing();
testSimpleUsecaseParsing();
testMetadataParsing();
testComplexMetadataParsing();
testMixedActorsParsing();
testMultipleActorsSingleLine();
testMultipleActorsWithMetadata();
testFiveActorsSingleLine();
testSystemBoundaryParsing();
testMixedActorsAndBoundaries();
testCurlyBraceSystemBoundary();
testRelationshipParsing();
testCompleteExample();
testNodeDefinitions();
testInlineActorNodeRelationships();
testMixedSyntax();
testEdgeLabels();
testInlineEdgeLabels();
testMixedEdgeLabels();
console.log('Tests completed.');
