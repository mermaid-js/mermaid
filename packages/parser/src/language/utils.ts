import type { TokenType } from 'chevrotain';

export const swapByIndex = (array: TokenType[], fromIndex: number, toIndex: number) => {
  const element: TokenType = array[fromIndex];
  array.splice(fromIndex, 1);
  array.splice(toIndex, 0, element);
};
