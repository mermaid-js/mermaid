%lex
%options case-insensitive

%x title
%%
\%\%(?!\{)[^\n]*   /* skip comments */
[^\}]\%\%[^\n]*    /* skip comments */
[\n\r]+            return 'NEWLINE';
\%\%[^\n]*         /* do nothing */
\s+                /* skip */
<<EOF>>            return 'EOF';

"title"\s[^#\n;]+  { return 'TITLE'; }
"venn-beta"        { return 'VENN'; }
"set"              { return 'SET';  }
"text"             { return 'TEXT'; }

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
  | document line       {$1.push($2);$$ = $1}
  ;

line
  : SPACE statement  { $$ = $2 }
  | statement  { $$ = $1 }
  | NEWLINE { $$=[];}
  | EOF    { $$=[];}
  ;

statement
  : TITLE                                           { yy.setDiagramTitle( $1.substr(6));$$=$1.substr(6); }
  | SET  identifierList                             { yy.addSubsetData($identifierList, undefined); }
  | SET  identifierList stylesOpt                   { yy.addSubsetData($identifierList, $stylesOpt); }
  | TEXT identifierList labelField                  { yy.addTextData($identifierList, "", [$labelField]); }
  | TEXT identifierList labelField COMMA stylesOpt  { yy.addTextData($identifierList, "", [$labelField, ...$stylesOpt]); }
  | TEXT identifierList                             { throw new Error('text requires label'); }
  ;

stylesOpt
  : styleField                   { $$ = [$styleField] }
  | stylesOpt COMMA styleField   { $$ = [...$stylesOpt, $styleField] }
  ;

labelField
  : IDENTIFIER COLON styleValue  { if (String($1).toLowerCase() !== 'label') { throw new Error('text requires label'); } $$ = ['label', $3] }
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
  | textTokens                   { $$ = $textTokens.join(' '); }
  ;

textTokens
  : textToken                    { $$ = [$textToken]; }
  | textTokens textToken         { $1.push($2); $$ = $1; }
  ;

textToken
  : IDENTIFIER                   { $$ = $1; }
  | NUMERIC                      { $$ = $1; }
  ;

identifierList
  : IDENTIFIER                         { $$ = [$IDENTIFIER] }
  | identifierList COMMA IDENTIFIER    { $$ = [...$identifierList, $IDENTIFIER] }
  ;

%%
