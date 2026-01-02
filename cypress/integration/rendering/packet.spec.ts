import { imgSnapshotTest } from '../../helpers/util';

describe('packet structure', () => {
  it('should render a simple packet-beta diagram', () => {
    imgSnapshotTest(
      `packet-beta
  title Hello world
  0-10: "hello"
`
    );
  });

  it('should render a simple packet diagram', () => {
    imgSnapshotTest(
      `packet
  title Hello world
  0-10: "hello"
`
    );
  });

  it('should render a simple packet diagram without ranges', () => {
    imgSnapshotTest(
      `packet
  0: "h"
  1: "i"
`
    );
  });

  it('should render a complex packet diagram', () => {
    imgSnapshotTest(
      `packet
        0-15: "Source Port"
        16-31: "Destination Port"
        32-63: "Sequence Number"
        64-95: "Acknowledgment Number"
        96-99: "Data Offset"
        100-105: "Reserved"
        106: "URG"
        107: "ACK"
        108: "PSH"
        109: "RST"
        110: "SYN"
        111: "FIN"
        112-127: "Window"
        128-143: "Checksum"
        144-159: "Urgent Pointer"
        160-191: "(Options and Padding)"
        192-223: "data"
      `
    );
  });

  it('should render a complex packet diagram with showBits false', () => {
    imgSnapshotTest(
      `
      ---
      title: "Packet Diagram"
      config:
        packet:
          showBits: false
      ---
      packet
        0-15: "Source Port"
        16-31: "Destination Port"
        32-63: "Sequence Number"
        64-95: "Acknowledgment Number"
        96-99: "Data Offset"
        100-105: "Reserved"
        106: "URG"
        107: "ACK"
        108: "PSH"
        109: "RST"
        110: "SYN"
        111: "FIN"
        112-127: "Window"
        128-143: "Checksum"
        144-159: "Urgent Pointer"
        160-191: "(Options and Padding)"
        192-223: "data"
      `
    );
  });

  it('should render a simple packet with hand-drawn look', () => {
    imgSnapshotTest(
      `packet-beta
      0-13: "Test Block"
      14-31: "Another Block"
      32-40: "Final Block"`,
      {
        look: 'handDrawn',
      },
      false,
      ($svg: any) => {
        const paths = $svg.find('path');
        const rects = $svg.find('rect');

        expect(paths.length).to.be.greaterThan(0);
        const blockRects = $svg.find('.packetBlock').filter('rect');
        expect(blockRects.length).to.equal(0);
      }
    );
  });
});
