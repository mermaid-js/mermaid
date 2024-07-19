import { imgSnapshotTest } from '../../helpers/util';

describe('packet structure', () => {
  it('should render a simple packet diagram', () => {
    imgSnapshotTest(
      `packet-beta
  title Hello world
  0-10: "hello"
`
    );
  });

  it('should render a simple packet diagram without ranges', () => {
    imgSnapshotTest(
      `packet-beta
  0: "h"
  1: "i"
`
    );
  });

  it('should render a complex packet diagram', () => {
    imgSnapshotTest(
      `packet-beta
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
      packet-beta
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
});
