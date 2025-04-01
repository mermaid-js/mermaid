grammar EventModeling

interface Common {
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

entry EventModeling:
    'eventmodeling'
    (accDescr=EM_ACC_DESCR | accTitle=EM_ACC_TITLE | title=EM_TITLE | modelEntities+=EmModelEntity | frames+=EmFrame | dataEntities+=EmDataEntity | noteEntities+=EmNoteEntity | gwtEntities+=EmGwt)*;


EmModelEntityType returns string:
    'rmo' | 'scn' | 'cmd' | 'evt' | 'pcr';

EmDataType returns string:
    'json' | 'jsobj' | 'figma' | 'salt' | 'uri' | 'md' | 'html' | 'text';

fragment EmDataInline: ('`' dataType=EmDataType '`')? dataInlineValue=EM_DATA_INLINE;

fragment EmDataBlock: ('`' dataType=EmDataType '`')? dataBlockValue=EM_DATA_BLOCK;

QualifiedName returns string:
    EM_EID ('.' EM_EID)*;

EmTimeFrame:
    'tf' name=EM_FI modelEntityType=EmModelEntityType entityIdentifier=QualifiedName ('>f' sourceFrames+=[EmFrame:EM_FI])* ('[[' dataReference=[EmDataEntity:EM_EID] ']]')? EmDataInline?;

EmResetFrame:
      'rf' name=EM_FI modelEntityType=EmModelEntityType entityIdentifier=QualifiedName ('>f' sourceFrames+=[EmFrame:EM_FI])* ('[[' dataReference=[EmDataEntity:EM_EID] ']]')? EmDataInline?;


EmFrame: EmTimeFrame | EmResetFrame;

EmModelEntity:
    'entity' name=QualifiedName;

EmDataEntity:
    'data' name=EM_EID EmDataBlock;

EmNoteEntity:
    'note' sourceFrame=[EmFrame:EM_FI] EmDataBlock;

EmGwt:
    'gwt' sourceFrame=[EmFrame:EM_FI] 'given' givenStatements+=EmGwtStatement+ ('when' whenStatements+=EmGwtStatement+)? 'then' thenStatements+=EmGwtStatement+;

EmGwtStatement:
    EmModelEntityType entityIdentifier=[EmModelEntity:EM_EID];

EM_EID returns string: EM_ID;
EM_FI returns string: EM_FID;

terminal EM_ID: /[_a-zA-Z][\w_]*/;
terminal EM_FID: /\d{1,3}/;

terminal EM_DATA_INLINE: /\{(.*)\}|"(.*)"|'(.*)'/;
terminal EM_DATA_BLOCK: /\{[\t ]*\r?\n(?:[\S\s]*?\r?\n)?\}(?:\r?\n|(?!\S))/;

terminal EM_ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal EM_ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal EM_TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

hidden terminal EM_WS: /\s+/;
hidden terminal EM_YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal EM_DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal EM_SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;

hidden terminal EM_ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal EM_SL_COMMENT: /\/\/[^\n\r]*/;

