import { RootContext } from '../../../src/parser/index';

// Performance base line 1.966 ~ 2.1s on My MBP.
// 2021-02-14: Improved to 1.4s.
// 2021-02-14: Improved to 1s.
// 2021-02-14: Re-baseline to 1.5s after add 'x='
// Performance base line 1.966 ~ 2.1s on My MBP.
// 2021-02-14: Improved to 1.4s.
// 2021-02-14: Improved to 1s.
// 2021-02-14: Re-baseline to 1.5s after add 'x='
// 2021-02-16: Re-baseline to 1.618s after inlined 'name' to other rules
// 2021-02-16: Improved to 1.559 by simplifying 'return'
// 2021-02-16: Improved to 1.321 by simplifying 'parameter'
// 2021-02-16: Improved to 1.214 after merged branches
// 2021-02-21: Improved to 824 after moved 'to DOT' to messageBody.
// 2021-02-21: Improved to 765 after merged 'source->target' to 'from->to'.
test('Profiling sync message', () => {
  var t0 = performance.now();
  for (let i = 0; i < 100; i++) {
    let rootContext = RootContext('x = B."method. {a,b} 1"(1,2)');
  }
  var t1 = performance.now();
  console.log('parsing', t1 - t0);
});

// Perf baseline 100ms
// 2021-02-21: Re-baselined to 110 after merged 'source->target' to 'from->to'.
// 2021-02-23: Re-baselined to 1500(!) after enabled optional (from->). The default message in cloud version has that.
test('Profiling async message', () => {
  var t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    let rootContext = RootContext('A->B:m');
  }
  var t1 = performance.now();
  console.log('parsing', t1 - t0);
});

// Perf baseline: 814ms on my MBP.
// 2021-02-14: Improved to 243ms.
// 2021-02-14: Improved to 228ms (10%) by simplifying starterEpx
// 2021-02-21: Improved to 204 by merging 'AT' into ANNOTATION in lexer.
test('Profiling prog.head', () => {
  var t0 = performance.now();
  for (let i = 0; i < 100; i++) {
    let rootContext = RootContext('<<>> A group B {C} @Starter(D)');
  }
  var t1 = performance.now();
  console.log('parsing', t1 - t0);
});

// Perf re-baseline: 11461 on my MBP.
// 2021-02-14: Improved to 2499ms.
// 2021-02-14: Improved to 1454ms (~20%). Was for removing alternative rule for braceBlock.
// 2021-02-14: Improved to 1363ms (~8%) by moving (to DOT) to messageBody
// 2021-02-14: Regressed to 2400 after added alternative rules for braceBlock and invocation
// 2021-02-16: Re-baseline to 2800 to 3000ms after merging branches.
// 2021-02-16: Improved to 1694 after removed alternative rule for braceBlock.
// 2021-02-21: Improved to 1560 after merged 'source->target' to 'from->to'.
test('Profiling if/else', () => {
  const t0 = performance.now();
  for (let i = 0; i < 100; i++) {
    let rootContext = RootContext('if(x>1){A.m} else if(y>1){B.m}else{C.m}');
  }
  const t1 = performance.now();
  console.log('parsing', t1 - t0);
});
