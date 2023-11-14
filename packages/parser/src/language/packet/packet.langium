grammar Packet
import "../common/common";

entry Packet:
  NEWLINE*
	"packet-beta"
  (  
    NEWLINE* TitleAndAccessibilities blocks+=PacketBlock*  
    | NEWLINE+ blocks+=PacketBlock+  
    | NEWLINE*  
  )
;

PacketBlock:
    start=INT('-' end=INT)? ':' label=STRING NEWLINE+
;

hidden terminal WS: /\s+/;
terminal INT returns number: /0|[1-9][0-9]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
