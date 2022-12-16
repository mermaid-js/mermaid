// Advanced functionality:
// Move the Fragment to the left most participant
export default `RET ret = A.methodA() {
  B.method() {
    if (X) { 
      C.methodC() {
        a = A.methodA() {
          D.method()
        }
      }
    } 
    while (Y) { 
      C.methodC() {
        A.methodA()
      }
    } 
   }
 }`;
