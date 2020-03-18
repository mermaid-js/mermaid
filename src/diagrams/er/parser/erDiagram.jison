%lex

%x string
%options case-insensitive

%%
\s+                       /* skip whitespace */
[\s]+                     return 'SPACE';
["]                       { this.begin("string");}
<string>["]               { this.popState(); }
<string>[^"]*             { return 'STR'; }
"erDiagram"               return 'ER_DIAGRAM';
[A-Za-z][A-Za-z0-9\-]*    return 'ALPHANUM';
\>\?\-\?\<                return 'ZERO_OR_MORE_TO_ZERO_OR_MORE';
\>\?\-\!\<                return 'ZERO_OR_MORE_TO_ONE_OR_MORE';
\>\!\-\!\<                return 'ONE_OR_MORE_TO_ONE_OR_MORE';
\>\!\-\?\<                return 'ONE_OR_MORE_TO_ZERO_OR_MORE';
\!\-\!\<                  return 'ONLY_ONE_TO_ONE_OR_MORE';
\!\-\?\<                  return 'ONLY_ONE_TO_ZERO_OR_MORE';
\?\-\?\<                  return 'ZERO_OR_ONE_TO_ZERO_OR_MORE';
\?\-\!\<                  return 'ZERO_OR_ONE_TO_ONE_OR_MORE';
\>\!\-\!                  return 'ONE_OR_MORE_TO_ONLY_ONE';
\>\?\-\!                  return 'ZERO_OR_MORE_TO_ONLY_ONE';
\>\?\-\?                  return 'ZERO_OR_MORE_TO_ZERO_OR_ONE';
\>\!\-\?                  return 'ONE_OR_MORE_TO_ZERO_OR_ONE';
\?\-\!                    return 'ZERO_OR_ONE_TO_ONLY_ONE';
\!\-\!                    return 'ONLY_ONE_TO_ONLY_ONE';
\!\-\?                    return 'ONLY_ONE_TO_ZERO_OR_ONE';
\?\-\?                    return 'ZERO_OR_ONE_TO_ZERO_OR_ONE';
.                         return yytext[0];
<<EOF>>                   return 'EOF';


/lex

%start start
%% /* language grammar */

start
    : 'ER_DIAGRAM' document 'EOF' { /*console.log('finished parsing');*/ }
    ;

document
    : /* empty */
    | document statement
    ;

statement
    : entityName relationship entityName ':' role 
      { 
          yy.addEntity($1); 
          yy.addEntity($3); 
          yy.addRelationship($1, $5, $3, $2);
          /*console.log($1 + $2 + $3 + ':' + $5);*/
      };

entityName
    : 'ALPHANUM' { $$ = $1; }
    ;

relationship
    : 'ONLY_ONE_TO_ONE_OR_MORE'      { $$ = yy.Cardinality.ONLY_ONE_TO_ONE_OR_MORE; }
    | 'ONLY_ONE_TO_ZERO_OR_MORE'     { $$ = yy.Cardinality.ONLY_ONE_TO_ZERO_OR_MORE; }
    | 'ZERO_OR_ONE_TO_ZERO_OR_MORE'  { $$ = yy.Cardinality.ZERO_OR_ONE_TO_ZERO_OR_MORE; }
    | 'ZERO_OR_ONE_TO_ONE_OR_MORE'   { $$ = yy.Cardinality.ZERO_OR_ONE_TO_ONE_OR_MORE; }
    | 'ONE_OR_MORE_TO_ONLY_ONE'      { $$ = yy.Cardinality.ONE_OR_MORE_TO_ONLY_ONE; }
    | 'ZERO_OR_MORE_TO_ONLY_ONE'     { $$ = yy.Cardinality.ZERO_OR_MORE_TO_ONLY_ONE; }
    | 'ZERO_OR_MORE_TO_ZERO_OR_ONE'  { $$ = yy.Cardinality.ZERO_OR_MORE_TO_ZERO_OR_ONE; }
    | 'ONE_OR_MORE_TO_ZERO_OR_ONE'   { $$ = yy.Cardinality.ONE_OR_MORE_TO_ZERO_OR_ONE; }
    | 'ZERO_OR_ONE_TO_ONLY_ONE'      { $$ = yy.Cardinality.ZERO_OR_ONE_TO_ONLY_ONE; }
    | 'ONLY_ONE_TO_ONLY_ONE'         { $$ = yy.Cardinality.ONLY_ONE_TO_ONLY_ONE; }
    | 'ONLY_ONE_TO_ZERO_OR_ONE'      { $$ = yy.Cardinality.ONLY_ONE_TO_ZERO_OR_ONE; }
    | 'ZERO_OR_ONE_TO_ZERO_OR_ONE'   { $$ = yy.Cardinality.ZERO_OR_ONE_TO_ZERO_OR_ONE; }
    | 'ZERO_OR_MORE_TO_ZERO_OR_MORE' { $$ = yy.Cardinality.ZERO_OR_MORE_TO_ZERO_OR_MORE; }
    | 'ZERO_OR_MORE_TO_ONE_OR_MORE'  { $$ = yy.Cardinality.ZERO_OR_MORE_TO_ONE_OR_MORE; }
    | 'ONE_OR_MORE_TO_ONE_OR_MORE'   { $$ = yy.Cardinality.ONE_OR_MORE_TO_ONE_OR_MORE; }
    | 'ONE_OR_MORE_TO_ZERO_OR_MORE'  { $$ = yy.Cardinality.ONE_OR_MORE_TO_ZERO_OR_MORE; }
    ;

role
    : 'STR'       { $$ = $1; }
    | 'ALPHANUM'  { $$ = $1; }
    ;
%%
