grammar EventModeling

interface Common {
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

entry EventModeling:
    'eventmodeling'
    (accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE | modelEntities+=ModelEntity | frames+=Frame | dataEntities+=DataEntity | noteEntities+=NoteEntity | gwtEntities+=Gwt)*;


ModelEntityType returns string:
    'rmo' | 'scn' | 'cmd' | 'evt' | 'job';

DataType returns string:
    'json' | 'jsobj' | 'figma' | 'salt' | 'uri' | 'md' | 'html' | 'text';

fragment DataInline: ('`' dataType=DataType '`')? dataInlineValue=DATA_INLINE;

fragment DataBlock: ('`' dataType=DataType '`')? dataBlockValue=DATA_BLOCK;

Frame:
    'tf' name=FI modelEntityType=ModelEntityType entityIdentifier=EID ('>t' sourceFrame=[Frame:FI])? ('[[' dataReference=[DataEntity:EID] ']]')? DataInline?;

ModelEntity:
    'entity' name=EID;

DataEntity:
    'data' name=EID DataBlock;

NoteEntity:
    'note' sourceFrame=[Frame:FI] DataBlock;

Gwt:
    'gwt' sourceFrame=[Frame:FI] 'given' givenStatements+=GwtStatement+ ('when' whenStatements+=GwtStatement+)? 'then' thenStatements+=GwtStatement+;

GwtStatement:
    ModelEntityType entityIdentifier=[ModelEntity:EID];

EID returns string: ID;
FI returns string: FID;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal FID: /\d{1,3}/;

terminal DATA_INLINE: /\{(.*)\}|"(.*)"|'(.*)'/;
terminal DATA_BLOCK: /\{[\t ]*\r?\n(?:[\S\s]*?\r?\n)?\}(?:\r?\n|(?!\S))/;

terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

hidden terminal WS: /\s+/;
hidden terminal YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

