grammar ContextMap
import "../common/common";

entry ContextMap:
    NEWLINE*
    "context-map-beta" NEWLINE*
    TitleAndAccessibilities? NEWLINE*  
    blocks+=ContextMapBlock* 
    NEWLINE*
    ;

ContextMapBlock: ('ContextMap' name=ID '{' body+=(ContextMapNode | ContextMapLink)* '}');
ContextMapNode: 'contains' name=ID;
ContextMapLabel returns string: 'D' | 'U' | 'CF' | 'ACL' | 'OHS'| 'PL' | 'SK' | 'C' | 'S' | 'P';
ContextMapLabelBox: '[' labels+=ContextMapLabel ((',' labels+=ContextMapLabel)?)* ']';
ContextMapArrow returns string: '->' | '<-' | '<->';
ContextMapLink: leftNode=[ContextMapNode:ID] leftLabelBox=(ContextMapLabelBox)? direction=ContextMapArrow rightLabelBox=(ContextMapLabelBox)? rightNode=[ContextMapNode:ID];
terminal ID returns string:     /[_a-zA-Z][\w_]*/;
hidden terminal ML_COMMENT:     /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT:     /\/\/[^\n\r]*/;
hidden terminal WS:             /\s+/;
