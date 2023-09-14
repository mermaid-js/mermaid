grammar Packet
import "../common/common";

entry Packet:
	"packet-beta" NEWLINE*
  TitleAndAccessibilities?
  (blocks+=Block)*;

Block:
    start=INT ('-' end=INT)? ':' label=STRING;

hidden terminal WS: /\s+/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;
