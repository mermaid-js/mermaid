grammar Packet
import "../common/common";

entry Packet:
  NEWLINE*
  "packet-beta"
  (
    TitleAndAccessibilities
    | blocks+=PacketBlock
    | NEWLINE
  )*
;

PacketBlock:
  start=INT('-' end=INT)? ':' label=STRING EOL
;