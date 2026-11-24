grammar EventModeling

interface Common {
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

entry EventModel:
    'eventmodeling'
    (accDescr=EM_ACC_DESCR | accTitle=EM_ACC_TITLE | title=EM_TITLE | modelEntities+=EmModelEntity | frames+=EmFrame | dataEntities+=EmDataEntity | noteEntities+=EmNoteEntity | gwtEntities+=EmGwt)*;


EmModelEntityType returns string:
    'rmo' | 'readmodel' | 'ui' | 'cmd' | 'command' | 'evt' | 'event' | 'pcr' | 'processor';

EmDataType returns string:
    'json' | 'jsobj' | 'figma' | 'salt' | 'uri' | 'md' | 'html' | 'text';

fragment EmDataInline: ('`' dataType=EmDataType '`')? dataInlineValue=EM_DATA_INLINE;

fragment EmDataBlock: ('`' dataType=EmDataType '`')? dataBlockValue=EM_DATA_BLOCK;

QualifiedName returns string:
    EM_EID ('.' EM_EID)*;

EmTimeFrame:
    ('tf' | 'timeframe') name=EM_FI modelEntityType=EmModelEntityType entityIdentifier=QualifiedName ('->>' sourceFrames+=[EmFrame:EM_FI])* ('[[' dataReference=[EmDataEntity:EM_EID] ']]')? EmDataInline?;

EmResetFrame:
    ('rf' | 'resetframe') name=EM_FI modelEntityType=EmModelEntityType entityIdentifier=QualifiedName ('->>' sourceFrames+=[EmFrame:EM_FI])* ('[[' dataReference=[EmDataEntity:EM_EID] ']]')? EmDataInline?;


EmFrame: EmTimeFrame | EmResetFrame;

EmModelEntity:
    'entity' name=QualifiedName;

EmDataEntity:
    'data' name=EM_EID EmDataBlock;

EmNoteEntity:
    'note' sourceFrame=[EmFrame:EM_FI] EmDataBlock;

EmGwt:
    'gwt' sourceFrame=[EmFrame:EM_FI] (label=EM_DATA_INLINE)? 'given' givenStatements+=EmGwtStatement+ ('when' whenStatements+=EmGwtStatement+)? 'then' thenStatements+=EmGwtStatement+;

EmGwtStatement:
    EmModelEntityType entityIdentifier=[EmModelEntity:QualifiedName] (EmDataInline | EmDataBlock)?;

EM_EID returns string: EM_ID;
EM_FI returns string: EM_FID;

terminal EM_ID: /[_a-zA-Z][\w_]*/;
terminal EM_FID: /\d{1,3}/;

// Braced data may nest: each inner level is matched by a `\{...\}` alternative,
// which also keeps a `}` inside one level from ending the value early and makes
// an unclosed outer `{` fail to match. Quoted strings are matched as
// indivisible units first, so a brace inside a string never counts toward the
// nesting, and quote delimiters are excluded from the generic alternatives so a
// quoted section cannot hide an opening brace. The standalone quoted
// alternatives stay bounded at their closing quote but accept balanced
// `{...}` groups, so payloads like `json`" { "a": { "c": true } } " keep
// matching as one value while a `gwt` label cannot absorb `given`.
// EM_DATA_BLOCK is declared first so that a `{` followed by a newline lexes as
// a block rather than inline data.
terminal EM_DATA_BLOCK: /\{[\t ]*\r?\n(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\{(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\{(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^{}"'])*\}|[^{}"'])*\}|[^{}"'])*?\}(?:\r?\n|(?!\S))/;
terminal EM_DATA_INLINE: /\{(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|\{(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|\{(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^{}\r\n"'])*\}|[^{}\r\n"'])*\}|[^{}\r\n"'])*?\}|"(?:\\.|[^"\\\r\n{]|\{(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|\{(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^{}\r\n"'])*\}|[^{}\r\n"'])*\})*"|'(?:\\.|[^'\\\r\n{]|\{(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|\{(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^{}\r\n"'])*\}|[^{}\r\n"'])*\})*'/;

terminal EM_ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal EM_ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal EM_TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

hidden terminal EM_WS: /\s+/;
hidden terminal EM_YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal EM_DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal EM_SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;

hidden terminal EM_ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal EM_SL_COMMENT: /\/\/[^\n\r]*/;
