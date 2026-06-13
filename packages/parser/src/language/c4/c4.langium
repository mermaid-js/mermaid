grammar C4Grammar
import "../common/common";

entry C4:
    NEWLINE*
    "c4-beta" kind=('context' | 'container' | 'component' | 'dynamic' | 'deployment')?
    (
        NEWLINE
        | TitleAndAccessibilities
        | Statement
    )*
;

fragment Statement:
    elements+=C4Element
    | relationships+=C4Relationship
    | styles+=C4Style
    | Direction
;

fragment Direction:
    'direction' direction=('TB' | 'BT' | 'LR' | 'RL') EOL
;

C4Element:
    kind=('person' | 'softwareSystem' | 'container' | 'component' | 'group' | 'deploymentNode')
    id=ID
    name=STRING (description=STRING (technology=STRING)?)?
    (tags+=C4_TAG)*
    ('{' (NEWLINE | children+=C4Element)* '}')?
    EOL
;

C4Relationship:
    (step=INT ':')?
    sourceId=ID arrow=C4_ARROW targetId=ID
    (':' description=STRING (technology=STRING)?)?
    (tags+=C4_TAG)*
    EOL
;

C4Style:
    'style' tag=ID entries+=C4StyleEntry (',' entries+=C4StyleEntry)* EOL
;

C4StyleEntry:
    key=ID ':' value=(C4_HEX_COLOR | ID)
;

terminal C4_ARROW: /<-->|<--|-->/;
terminal C4_TAG: /:::[\w]([-\w]*\w)?/;
terminal C4_HEX_COLOR: /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/;
