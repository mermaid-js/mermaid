let interactionFunctions: (() => void)[] = [];
export const addFunction = (func: () => void) => {
  interactionFunctions.push(func);
};
export const attachFunctions = () => {
  interactionFunctions.forEach((f) => {
    f();
  });
  interactionFunctions = [];
};
