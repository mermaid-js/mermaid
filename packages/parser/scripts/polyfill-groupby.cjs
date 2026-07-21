// Polyfill Object.groupBy for Node.js < 21
// Required by langium-cli via chevrotain@12
if (!Object.groupBy) {
  // eslint-disable-next-line no-extend-native
  Object.groupBy = function (items, callbackFn) {
    const groups = Object.create(null);
    for (let i = 0; i < items.length; i++) {
      const key = callbackFn(items[i], i);
      (groups[key] ??= []).push(items[i]);
    }
    return groups;
  };
}