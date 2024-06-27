%lex
%options case-insensitive

%x string
%x title
%%
\%\%(?!\{)[^\n]*                          /* skip comments */
[^\}]\%\%[^\n]*                           /* skip comments */
[\n\r]+                                   return 'NEWLINE';
\%\%[^\n]*                                /* do nothing */
\s+                                       /* skip */
<<EOF>>                                   return 'EOF';

"title"\s[^#\n;]+                       {return 'TITLE';}
"venn-beta"                            {return 'VENN';}
"sets"                                  {  return 'SETS'; }

[+-]?(?:\d+(?:\.\d+)?|\.\d+)              { return 'NUMERIC'; }
[A-Za-z_][A-Za-z0-9\-_]*                { return 'IDENTIFIER'; }
[^":,]+                                 {  return "OPT_VALUE"; }

","                    { return 'COMMA'; }
":"                    { return 'COLON'; }

/lex

%start start

%% /* language grammar */

start
  : VENN document 'EOF' { return $2; }
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
  : TITLE                                                       {yy.setDiagramTitle( $1.substr(6));$$=$1.substr(6);}
  | SETS  identifierList                                         { yy.addSubsetData($identifierList, undefined); }
  | SETS  identifierList stylesOpt                               { yy.addSubsetData($identifierList, $stylesOpt); }
  ;

stylesOpt
  : styleField                                                 { $$ = [$styleField] }
  | stylesOpt COMMA styleField                                       { $$ = [...$stylesOpt, $styleField] }
  ;

styleField
  : IDENTIFIER COLON IDENTIFIER                                      { $$ = [$1, $3] }
  | IDENTIFIER COLON OPT_VALUE                                      { $$ = [$IDENTIFIER, $OPT_VALUE] }
  | IDENTIFIER COLON NUMERIC                                   { $$ = [$IDENTIFIER, $NUMERIC] }
  ;

text:  STR
  ;

identifierList
  : IDENTIFIER                         { $$ = [$IDENTIFIER] }
  | identifierList COMMA IDENTIFIER    { $$ = [...$identifierList, $IDENTIFIER] }
  ;

%%
