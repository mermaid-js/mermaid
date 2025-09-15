// Debug script to understand node processing order

console.log('=== Node Order Debug ===');

// Test case 1: n2["label for n2"] &   n4@{ label: "label for n4"}   & n5@{ label: "label for n5"}
// Expected: nodes[0] = n2, nodes[1] = n4, nodes[2] = n5
// Actual: nodes[0] = n4 (wrong!)

console.log('Test 1: n2["label for n2"] &   n4@{ label: "label for n4"}   & n5@{ label: "label for n5"}');
console.log('Expected: n2, n4, n5');
console.log('Actual: n4, ?, ?');

// Test case 2: A["A"] --> B["for B"] &    C@{ label: "for c"} & E@{label : "for E"}
// Expected: nodes[1] = B, nodes[2] = C
// Actual: nodes[1] = C (wrong!)

console.log('\nTest 2: A["A"] --> B["for B"] &    C@{ label: "for c"} & E@{label : "for E"}');
console.log('Expected: A, B, C, E, D');
console.log('Actual: A, C, ?, ?, ?');

console.log('\nThe issue appears to be that ampersand-chained nodes are processed in reverse order');
console.log('or the node collection is not matching the Jison parser behavior.');
