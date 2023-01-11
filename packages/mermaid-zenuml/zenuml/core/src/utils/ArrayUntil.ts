declare global {
  interface Array<T> {
    until(predicate: (value: T, index: number, array: T[]) => boolean): T[];
  }
}

Array.prototype['until'] = function (
  predicate: (value: any, index: number, array: any[]) => boolean
): any[] {
  let result: any[] = [];
  for (let i = 0; i < this.length; i++) {
    result.push(this[i]);
    if (predicate(this[i], i, this)) {
      break;
    }
  }
  return result;
};
// https://stackoverflow.com/a/59499895/529187
export {};
