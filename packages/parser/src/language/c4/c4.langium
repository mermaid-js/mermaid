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
    | Legend
;

fragment Direction:
    'direction' direction=('TB' | 'BT' | 'LR' | 'RL') EOL
;

fragment Legend:
    'legend' legend=('on' | 'off') EOL
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
    (step=C4_STEP ':')?
    sourceId=C4Id arrow=C4_ARROW targetId=C4Id
    (':' description=STRING (technology=STRING)?)?
    (tags+=C4_TAG)*
    EOL
;

C4Style:
    'style' tag=C4Id entries+=C4StyleEntry (',' entries+=C4StyleEntry)* EOL
;

C4StyleEntry:
    key=C4_ID ':' value=(C4_HEX_COLOR | C4_ID)
;

// An id is any word but the six that open a statement: `title`, `accTitle`, `accDescr`
// (terminals), `direction` and `style` (keywords) and `legend`. The kind words are ids too.
C4Id returns string:
    C4_ID
    | 'c4-beta' | 'context' | 'container' | 'component' | 'dynamic' | 'deployment'
    | 'person' | 'softwareSystem' | 'group' | 'deploymentNode' | 'infrastructureNode'
    | 'instances' | 'on' | 'off' | 'TB' | 'BT' | 'LR' | 'RL'
;

// The digits of a step, `2:`, at the start of a line. Declared before C4_ID so `2:` is a step.
terminal C4_STEP returns number: /(?<=[\r\n][\t ]*)[0-9]+(?=[\t ]*:(?!:))/;
// Words of letters, digits and `_` joined by single `-`, so `a-->b` splits and `3ds` is an id.
// The words that start a title or an accessibility statement are left to their own terminals.
terminal C4_ID: /(?!(?:accTitle|accDescr|title)(?!\w|-\w))\w+(?:-\w+)*/;
terminal C4_ARROW: /<-->|<--|-->/;
terminal C4_TAG: /:::[\w]([-\w]*\w)?/;
terminal C4_HEX_COLOR: /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/;
