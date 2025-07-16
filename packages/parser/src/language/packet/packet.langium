grammar Packet
import "../common/common";

entry Packet:
  NEWLINE*
  ("packet"| "packet-beta")
  (
    TitleAndAccessibilities
    | blocks+=PacketBlock
    | NEWLINE
  )*
;

PacketBlock:
  (
    start=POSITIVE_INT('-' end=POSITIVE_INT)?
    | '+' bits=POSITIVE_INT
  )
  ':' label=STRING
  EOL
;
