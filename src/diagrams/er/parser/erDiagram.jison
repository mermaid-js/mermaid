%lex

%options case-insensitive

%%
\s+                       /* skip whitespace */
[\s]+                     return 'SPACE';
\"[^"]*\"                 return 'WORD';
"erDiagram"               return 'ER_DIAGRAM';
\|o                       return 'ZERO_OR_ONE';
\}o                       return 'ZERO_OR_MORE';
\}\|                      return 'ONE_OR_MORE';
\|\|                      return 'ONLY_ONE';
o\|                       return 'ZERO_OR_ONE';
o\{                       return 'ZERO_OR_MORE';
\|\{                      return 'ONE_OR_MORE';
\.\.                      return 'NON_IDENTIFYING';
\-\-                      return 'IDENTIFYING';
\.\-                      return 'NON_IDENTIFYING';
\-\.                      return 'NON_IDENTIFYING';
[A-Za-z][A-Za-z0-9\-]*    return 'ALPHANUM';
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
    : entityName relSpec entityName ':' role
      {
          yy.addEntity($1); 
          yy.addEntity($3); 
          yy.addRelationship($1, $5, $3, $2);
          /*console.log($1 + $2 + $3 + ':' + $5);*/
      };

entityName
    : 'ALPHANUM' { $$ = $1; /*console.log('Entity: ' + $1);*/ }
    ;

relSpec
    : cardinality relType cardinality
      {
        $$ = { cardA: $3, relType: $2, cardB: $1 };
        /*console.log('relSpec: ' + $3 + $2 + $1);*/
      }
    ;

cardinality
    : 'ZERO_OR_ONE'                  { $$ = yy.Cardinality.ZERO_OR_ONE; }
    | 'ZERO_OR_MORE'                 { $$ = yy.Cardinality.ZERO_OR_MORE; }
    | 'ONE_OR_MORE'                  { $$ = yy.Cardinality.ONE_OR_MORE; }
    | 'ONLY_ONE'                     { $$ = yy.Cardinality.ONLY_ONE; }
    ; 

relType
    : 'NON_IDENTIFYING'              { $$ = yy.Identification.NON_IDENTIFYING;  }
    | 'IDENTIFYING'                  { $$ = yy.Identification.IDENTIFYING; }
    ;

role
    : 'WORD'      { $$ = $1.replace(/"/g, ''); }
    | 'ALPHANUM'  { $$ = $1; }
    ;
%%
