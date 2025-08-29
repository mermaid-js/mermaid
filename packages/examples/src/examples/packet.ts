import type { DiagramMetadata } from '../types.js';

export default {
  id: 'packet',
  name: 'Packet Diagram',
  description: 'Visualize packet data and network traffic',
  examples: [
    {
      title: 'TCP Packet',
      isDefault: true,
      code: `---
title: "TCP Packet"
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
192-255: "Data (variable length)"`,
    },
  ],
} satisfies DiagramMetadata;
