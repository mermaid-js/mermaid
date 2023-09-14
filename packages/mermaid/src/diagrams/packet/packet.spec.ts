import { parser } from './parser.js';
import { clear, getPacket } from './db.js';
describe('packet diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a packet-beta definition', () => {
    const str = `packet-beta`;
    expect(() => {
      parser.parse(str);
    }).not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot('[]');
  });

  it('should handle diagram with data', () => {
    const str = `packet-beta
    0-10: "test"
    `;
    expect(() => {
      parser.parse(str);
    }).not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 10,
            "label": "test",
            "start": 0,
          },
        ],
      ]
    `);
  });

  it('should handle single bits', () => {
    const str = `packet-beta
    0-10: "test"
    11: "single"
    `;
    expect(() => {
      parser.parse(str);
    }).not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 10,
            "label": "test",
            "start": 0,
          },
          {
            "end": 11,
            "label": "single",
            "start": 11,
          },
        ],
      ]
    `);
  });

  it('should split into multiple rows', () => {
    const str = `packet-beta
    0-10: "test"
    11-90: "multiple"
    `;
    expect(() => {
      parser.parse(str);
    }).not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 10,
            "label": "test",
            "start": 0,
          },
          {
            "end": 31,
            "label": "multiple",
            "start": 11,
          },
        ],
        [
          {
            "end": 63,
            "label": "multiple",
            "start": 32,
          },
        ],
        [
          {
            "end": 90,
            "label": "multiple",
            "start": 64,
          },
        ],
      ]
    `);
  });

  it('should split into multiple rows when cut at exact length', () => {
    const str = `packet-beta
    0-16: "test"
    17-63: "multiple"
    `;
    expect(() => {
      parser.parse(str);
    }).not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 16,
            "label": "test",
            "start": 0,
          },
          {
            "end": 31,
            "label": "multiple",
            "start": 17,
          },
        ],
        [
          {
            "end": 63,
            "label": "multiple",
            "start": 32,
          },
        ],
      ]
    `);
  });

  it('should throw error if numbers are not continuous', () => {
    const str = `packet-beta
    0-16: "test"
    18-20: "error"
    `;
    expect(() => {
      parser.parse(str);
    }).toThrowErrorMatchingInlineSnapshot(
      '"Packet block 18 - 20 is not contiguous. It should start from 17."'
    );
  });

  it('should throw error if numbers are not continuous for single packets', () => {
    const str = `packet-beta
    0-16: "test"
    18: "error"
    `;
    expect(() => {
      parser.parse(str);
    }).toThrowErrorMatchingInlineSnapshot(
      '"Packet block 18 - 18 is not contiguous. It should start from 17."'
    );
  });

  it('should throw error if numbers are not continuous for single packets - 2', () => {
    const str = `packet-beta
    0-16: "test"
    17: "good"
    19: "error"
    `;
    expect(() => {
      parser.parse(str);
    }).toThrowErrorMatchingInlineSnapshot(
      '"Packet block 19 - 19 is not contiguous. It should start from 18."'
    );
  });

  it('should throw error if end is less than start', () => {
    const str = `packet-beta
    0-16: "test"
    25-20: "error"
    `;
    expect(() => {
      parser.parse(str);
    }).toThrowErrorMatchingInlineSnapshot(
      '"Packet block 25 - 20 is invalid. End must be greater than start."'
    );
  });
});
