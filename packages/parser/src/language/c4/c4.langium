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
    kind=('person' | 'softwareSystem' | 'container' | 'component' | 'group' | 'deploymentNode' | 'infrastructureNode')
    id=C4Id
    name=STRING (description=STRING (technology=STRING)?)?
    ('instances' instances=STRING)?
    (tags+=C4_TAG)*
    ('{' (NEWLINE | children+=C4Element)* '}')?
    EOL
;

C4Relationship:
    (step=INT ':')?
    sourceId=C4Id arrow=C4_ARROW targetId=C4Id
    (':' description=STRING (technology=STRING)?)?
    (tags+=C4_TAG)*
    EOL
;

// Element kind keywords are also valid element identifiers, so e.g.
// `softwareSystem softwareSystem "System"` parses.
C4Id returns string:
    ID | 'person' | 'softwareSystem' | 'container' | 'component' | 'group' | 'deploymentNode' | 'infrastructureNode'
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
