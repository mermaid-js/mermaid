// Advanced functionality:
// Nested alt
// Nested loop
// Nested alt (self message)
// Nested loop (self message)
export default `RET ret = a:A.methodA() { 
  if (x) { 
    B.methodB() 
    if (y) { 
      C.methodC() 
    }
  }
  while (x) { 
    B.methodB() 
    while (y) { 
      C.methodC() 
    }
  }
  if (x) { 
    method() 
    if (y) { 
      method2() 
    }
  }
  while (x) { 
    method() 
    while (y) { 
      method2() 
    }
  }
  while (x) { 
    method() 
    if (y) { 
      method2() 
    }
  }
  if (x) { 
    method() 
    while (y) { 
      method2() 
    }
  }
}`;
