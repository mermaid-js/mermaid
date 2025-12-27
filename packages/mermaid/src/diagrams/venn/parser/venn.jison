%lex
%options case-insensitive

%s bol

%%
\%\%(?!\{)[^\n]*   /* skip comments */
[^\}]\%\%[^\n]*    /* skip comments */

<bol>[ \t]+(?=[\n\r])  /* ignore whitespace-only lines */
<bol>[ \t]+(?=text\b)  {
  if (yy.getIndentMode && yy.getIndentMode()) {
    yy.consumeIndentText = true;
    this.begin('INITIAL');
    return 'INDENT_TEXT';
  }
}
<bol>[ \t]+            /* ignore leading whitespace */
<bol>[^ \t\n\r]        { if (yy.setIndentMode) { yy.setIndentMode(false); } this.begin('INITIAL'); this.unput(yytext); }

[\n\r]+            { this.begin('bol'); return 'NEWLINE'; }
\%\%[^\n]*         /* do nothing */
[ \t]+             /* skip */
<<EOF>>            return 'EOF';

"title"\s[^#\n;]+  { return 'TITLE'; }
"venn-beta"        { return 'VENN'; }
"set"              { return 'SET'; }
"union"            { return 'UNION'; }
"text"             { if (yy.consumeIndentText) { yy.consumeIndentText = false; } else { return 'TEXT'; } }
"label"(?=\s*:)    { return 'LABEL'; }

[+-]?(\d+(\.\d+)?|\.\d+)                                              { return 'NUMERIC'; }
\#[0-9a-fA-F]{3,8}                                                    { return 'HEXCOLOR'; }
rgba\(\s*[0-9.]+\s*[,]\s*[0-9.]+\s*[,]\s*[0-9.]+\s*[,]\s*[0-9.]+\s*\) { return 'RGBACOLOR'; }
rgb\(\s*[0-9.]+\s*[,]\s*[0-9.]+\s*[,]\s*[0-9.]+\s*\)                  { return 'RGBCOLOR'; }
[A-Za-z_][A-Za-z0-9\-_]*                                              { return 'IDENTIFIER'; }
\"[^\"]*\"                                                            { return 'STRING'; }

","  { return 'COMMA'; }
":"  { return 'COLON'; }

/lex

%start start

%% /* language grammar */

start
  : optNewlines VENN document 'EOF' { return $3; }
  ;

optNewlines
  : /* empty */         { $$ = [] }
  | optNewlines NEWLINE { $$ = [] }
  ;

document
  : /* empty */         { $$ = [] }
  | document line       { $1.push($2); $$ = $1 }
  ;

line
  : NEWLINE { $$ = []; }
  | statement { $$ = $1; }
  ;

statement
  : TITLE                                           { yy.setDiagramTitle($1.substr(6)); $$ = $1.substr(6); }
  | SET identifierList                              { if ($identifierList.length !== 1) { throw new Error('set requires single identifier'); } yy.addSubsetData($identifierList, undefined); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | SET identifierList stylesOpt                    { if ($identifierList.length !== 1) { throw new Error('set requires single identifier'); } yy.addSubsetData($identifierList, $stylesOpt); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | UNION identifierList                            { if ($identifierList.length < 2) { throw new Error('union requires multiple identifiers'); } if (yy.validateUnionIdentifiers) { yy.validateUnionIdentifiers($identifierList); } yy.addSubsetData($identifierList, undefined); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | UNION identifierList stylesOpt                  { if ($identifierList.length < 2) { throw new Error('union requires multiple identifiers'); } if (yy.validateUnionIdentifiers) { yy.validateUnionIdentifiers($identifierList); } yy.addSubsetData($identifierList, $stylesOpt); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | TEXT identifierList labelField                  { yy.addTextData($identifierList, "", [$labelField]); }
  | TEXT identifierList labelField COMMA stylesOpt  { yy.addTextData($identifierList, "", [$labelField, ...$stylesOpt]); }
  | TEXT identifierList                             { throw new Error('text requires label'); }
  | INDENT_TEXT indentedTextTail                    { $$ = $2; }
  ;

indentedTextTail
  : labelField                  { var currentSets = yy.getCurrentSets ? yy.getCurrentSets() : undefined; if (!currentSets) { throw new Error('text requires set'); } yy.addTextData(currentSets, "", [$labelField]); }
  | labelField COMMA stylesOpt  { var currentSets = yy.getCurrentSets ? yy.getCurrentSets() : undefined; if (!currentSets) { throw new Error('text requires set'); } yy.addTextData(currentSets, "", [$labelField, ...$stylesOpt]); }
  | textValue                   { var currentSets = yy.getCurrentSets ? yy.getCurrentSets() : undefined; if (!currentSets) { throw new Error('text requires set'); } yy.addTextData(currentSets, $textValue, undefined); }
  | textValue labelField        { var currentSets = yy.getCurrentSets ? yy.getCurrentSets() : undefined; if (!currentSets) { throw new Error('text requires set'); } yy.addTextData(currentSets, $textValue, [$labelField]); }
  | textValue labelField COMMA stylesOpt { var currentSets = yy.getCurrentSets ? yy.getCurrentSets() : undefined; if (!currentSets) { throw new Error('text requires set'); } yy.addTextData(currentSets, $textValue, [$labelField, ...$stylesOpt]); }
  | textValue COMMA labelField  { var currentSets = yy.getCurrentSets ? yy.getCurrentSets() : undefined; if (!currentSets) { throw new Error('text requires set'); } yy.addTextData(currentSets, $textValue, [$labelField]); }
  | textValue COMMA labelField COMMA stylesOpt { var currentSets = yy.getCurrentSets ? yy.getCurrentSets() : undefined; if (!currentSets) { throw new Error('text requires set'); } yy.addTextData(currentSets, $textValue, [$labelField, ...$stylesOpt]); }
  | textValue styleField        { throw new Error('text requires label'); }
  | textValue COMMA styleField  { throw new Error('text requires label'); }
  | textValue COMMA styleField COMMA stylesOpt { throw new Error('text requires label'); }
  | /* empty */                 { throw new Error('text requires label'); }
  ;

stylesOpt
  : styleEntry                   { $$ = [$styleEntry] }
  | stylesOpt COMMA styleEntry   { $$ = [...$stylesOpt, $styleEntry] }
  ;

styleEntry
  : styleField { $$ = $1 }
  | labelField { $$ = $1 }
  ;

labelField
  : LABEL COLON styleValue  { $$ = ['label', $3] }
  ;

styleField
  : IDENTIFIER COLON styleValue  { $$ = [$1, $3] }
  ;

styleValue
  : STRING                       { $$ = $1; }
  | valueTokens                  { $$ = $valueTokens.join(' '); }
  ;

valueTokens
  : valueToken                   { $$ = [$valueToken]; }
  | valueTokens valueToken       { $1.push($2); $$ = $1; }
  ;

valueToken
  : IDENTIFIER                   { $$ = $1; }
  | NUMERIC                      { $$ = $1; }
  | HEXCOLOR                     { $$ = $1; }
  | RGBCOLOR                     { $$ = $1; }
  | RGBACOLOR                    { $$ = $1; }
  ;

textValue
  : STRING                       { $$ = $1; }
  | IDENTIFIER                   { $$ = $1; }
  | NUMERIC                      { $$ = $1; }
  ;

identifierList
  : identifier                         { $$ = [$identifier] }
  | identifierList COMMA identifier    { $$ = [...$identifierList, $identifier] }
  ;

identifier
  : IDENTIFIER                         { $$ = $1 }
  | STRING                             { $$ = $1 }
  ;

%%
