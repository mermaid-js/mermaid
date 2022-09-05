let interactionFunctions: (() => {})[] = [];
export const addFunction = (func: () => {}) => {
  interactionFunctions.push(func);
};
export const attachFunctions = () => {
  interactionFunctions.forEach((f) => {
    f();
  });
  interactionFunctions = [];
};
