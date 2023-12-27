// @ts-ignore: Jison doesn't  support type.
import { parser } from './matrixchart.jison';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

const parserFnConstructor = (str: string) => {
  return () => {
    parser.parse(str);
  };
};

const mockDB: Record<string, Mock<any, any>> = {
  setOrientation: vi.fn(),
  setDiagramTitle: vi.fn(),
  setXAxisTitle: vi.fn(),
  setXAxisBand: vi.fn(),
  setYAxisBand: vi.fn(),
  setYAxisTitle: vi.fn(),
  setLineData: vi.fn(),
  setBarData: vi.fn(),
};

function clearMocks() {
  for (const key in mockDB) {
    mockDB[key].mockRestore();
  }
}

describe('Testing matrixchart jison file', () => {
  beforeEach(() => {
    parser.yy = mockDB;
    clearMocks();
  });
});
