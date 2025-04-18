grammar KanbanDiagram

entry KanbanModel:
    'kanban' (NL | SPACELINE)* document=Document;

Document:
    statements+=Statement*;

Statement:
    (indent=SPACELIST)? node=Node shapeData=ShapeData? |
    (indent=SPACELIST)? icon=ICON |
    (indent=SPACELIST)? class=CLASS |
    SPACELINE;

Node:
    NodeWithId | NodeWithoutId;

NodeWithId:
    id=NODE_ID (dstart=NODE_DSTART descr=NODE_DESCR dend=NODE_DEND)?;

NodeWithoutId:
    dstart=NODE_DSTART descr=NODE_DESCR dend=NODE_DEND;

ShapeData:
    '@{' data=STRING? '}';

// Terminal definitions
terminal KANBAN: 'kanban';
terminal CLASS: ':::' -> !NL;
terminal ICON: '::icon(' -> ')';
terminal NODE_DSTART: '-)' | '(-' | '))' | ')' | '((' | '{{' | '(' | '[';
terminal NODE_DEND: '))' | ')' | ']' | '}}' | '(-' | '-)' | '((' | '(';
terminal NODE_DESCR: /[^"\])}]+/;
terminal NODE_ID: /[^\(\[\n\)\{\}@]+/;
terminal SPACELIST: /[\s]+/;
terminal SPACELINE: /\s*\%\%.*/ | /[\s]+[\n]/;
terminal NL: /[\n]+/;
terminal STRING: '"' -> '"';
terminal COMMENT: /\s*\%\%.*/ -> NL;

// Hide these terminals from the language server
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
