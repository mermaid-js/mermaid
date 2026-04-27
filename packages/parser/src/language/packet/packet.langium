grammar PacketGrammar
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
    start=INT('-' end=INT)?
    | '+' bits=INT
  )
  ':' label=STRING
  EOL
;
