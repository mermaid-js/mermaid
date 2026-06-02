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
"style"            { return 'STYLE'; }

\[\"[^\"]*\"\]                                                    { yytext = yytext.slice(2, -2); return 'BRACKET_LABEL'; }
\[[^\]\"]+\]                                                      { yytext = yytext.slice(1, -1).trim(); return 'BRACKET_LABEL'; }

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
  : TITLE                                            { yy.setDiagramTitle($1.substr(6)); $$ = $1.substr(6); }
  | SET identifier                                   { yy.addSubsetData([$identifier], undefined, undefined); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | SET identifier BRACKET_LABEL                     { yy.addSubsetData([$identifier], $BRACKET_LABEL, undefined); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | SET identifier COLON NUMERIC                     { yy.addSubsetData([$identifier], undefined, parseFloat($NUMERIC)); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | SET identifier BRACKET_LABEL COLON NUMERIC       { yy.addSubsetData([$identifier], $BRACKET_LABEL, parseFloat($NUMERIC)); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | UNION identifierList                             { if ($identifierList.length < 2) { throw new Error('union requires multiple identifiers'); } if (yy.validateUnionIdentifiers) { yy.validateUnionIdentifiers($identifierList); } yy.addSubsetData($identifierList, undefined, undefined); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | UNION identifierList BRACKET_LABEL               { if ($identifierList.length < 2) { throw new Error('union requires multiple identifiers'); } if (yy.validateUnionIdentifiers) { yy.validateUnionIdentifiers($identifierList); } yy.addSubsetData($identifierList, $BRACKET_LABEL, undefined); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | UNION identifierList COLON NUMERIC               { if ($identifierList.length < 2) { throw new Error('union requires multiple identifiers'); } if (yy.validateUnionIdentifiers) { yy.validateUnionIdentifiers($identifierList); } yy.addSubsetData($identifierList, undefined, parseFloat($NUMERIC)); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | UNION identifierList BRACKET_LABEL COLON NUMERIC { if ($identifierList.length < 2) { throw new Error('union requires multiple identifiers'); } if (yy.validateUnionIdentifiers) { yy.validateUnionIdentifiers($identifierList); } yy.addSubsetData($identifierList, $BRACKET_LABEL, parseFloat($NUMERIC)); if (yy.setIndentMode) { yy.setIndentMode(true); } }
  | TEXT identifierList IDENTIFIER                     { yy.addTextData($identifierList, $IDENTIFIER, undefined); }
  | TEXT identifierList STRING                          { yy.addTextData($identifierList, $STRING, undefined); }
  | TEXT identifierList NUMERIC                         { yy.addTextData($identifierList, $NUMERIC, undefined); }
  | TEXT identifierList IDENTIFIER BRACKET_LABEL        { yy.addTextData($identifierList, $IDENTIFIER, $BRACKET_LABEL); }
  | TEXT identifierList STRING BRACKET_LABEL            { yy.addTextData($identifierList, $STRING, $BRACKET_LABEL); }
  | INDENT_TEXT indentedTextTail                     { $$ = $2; }
  | STYLE identifierList stylesOpt                   { yy.addStyleData($identifierList, $stylesOpt); }
  ;

indentedTextTail
  : IDENTIFIER               { var cs = yy.getCurrentSets(); if (!cs) throw new Error('text requires set'); yy.addTextData(cs, $IDENTIFIER, undefined); }
  | STRING                   { var cs = yy.getCurrentSets(); if (!cs) throw new Error('text requires set'); yy.addTextData(cs, $STRING, undefined); }
  | NUMERIC                  { var cs = yy.getCurrentSets(); if (!cs) throw new Error('text requires set'); yy.addTextData(cs, $NUMERIC, undefined); }
  | IDENTIFIER BRACKET_LABEL { var cs = yy.getCurrentSets(); if (!cs) throw new Error('text requires set'); yy.addTextData(cs, $IDENTIFIER, $BRACKET_LABEL); }
  | STRING BRACKET_LABEL     { var cs = yy.getCurrentSets(); if (!cs) throw new Error('text requires set'); yy.addTextData(cs, $STRING, $BRACKET_LABEL); }
  ;

stylesOpt
  : styleField                  { $$ = [$styleField] }
  | stylesOpt COMMA styleField  { $$ = [...$stylesOpt, $styleField] }
  ;

styleField
  : IDENTIFIER COLON styleValue { $$ = [$1, $3] }
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

identifierList
  : identifier                         { $$ = [$identifier] }
  | identifierList COMMA identifier    { $$ = [...$identifierList, $identifier] }
  ;

identifier
  : IDENTIFIER                         { $$ = $1 }
  | STRING                             { $$ = $1 }
  ;

%%
