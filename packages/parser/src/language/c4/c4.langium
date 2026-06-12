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
    | Direction
;

fragment Direction:
    'direction' direction=('TB' | 'BT' | 'LR' | 'RL') EOL
;

C4Element:
    (external?='external')?
    kind=('person' | 'system' | 'container' | 'component' | 'group' | 'node')
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

terminal C4_ARROW: /<-->|<--|-->/;
terminal C4_TAG: /:::[\w]([-\w]*\w)?/;
