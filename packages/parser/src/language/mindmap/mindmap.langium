grammar MindMap

import 'Terminals'

entry Diagram:
    keyword='mindmap'
    statements+=Statement*;

Statement:
    RootNode | Node;

RootNode:
    root=Text (child=Node)?;

Node:
    depth=DEPTH text=Text (child=Node)?;

terminal DEPTH:
    /\t+/ | / {2,}/;

Text:
    content=TEXT_CONTENT shorthand=SHORTHAND?;

terminal TEXT_CONTENT:
    /[^\n\r\[\]]+/;

terminal SHORTHAND:
    /\[[^\]]*\]/;

terminal ICON:
    /::icon\([^\)]+\)/;

terminal CLASSNAME:
    /:::[^\n]*/;

hidden terminal WS:
    /\s+/;

hidden terminal NEWLINE:
    /\r?\n/;

hidden terminal ML_COMMENT:
    /\/\*[\s\S]*?\*\//;

hidden terminal SL_COMMENT:
    /\/\/[^\n\r]*/;

hidden terminal DIRECTIVE:
    /%%[^\n\r]*/;
