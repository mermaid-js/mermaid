/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
"style"               return 'STYLE';
\#[a-f0-9]+           return 'HEX';
[0-9]+                return 'NUM';
\#                    return 'BRKT';
"px"                  return 'UNIT';
"pt"                  return 'UNIT';
"dot"                 return 'UNIT';
":"                   return 'COLON';
\-                    return 'MINUS';
";"                   return ';';
","                   return 'COMMA';
[x]                   return 'ARROW_CROSS';
">"                   return 'ARROW_POINT';
[o]                   return 'ARROW_CIRCLE';
[a-zåäöæøA-ZÅÄÖÆØ]+   return 'ALPHA';
"|"                   return 'PIPE';
"("                   return 'PS';
")"                   return 'PE';
"["                   return 'SQS';
"]"                   return 'SQE';
"{"                   return 'DIAMOND_START'
"}"                   return 'DIAMOND_STOP'
\s                    return 'SPACE';
\n                    return 'NEWLINE';
<<EOF>>               return 'EOF';

/lex

/* operator associations and precedence */

%left '^'

%start expressions

%% /* language grammar */

expressions
    : graph EOF
        {return $1;}
    ;

graph
    : SPACE graph
        { $$ = $2;}
    | edge ';' graph
        { $$ = $3;}
    | edge ';'
        { $$ = $1;}
    ;

edge: styleStatement
    {$$ = 'ya';}
    | vertex link vertex PIPE text
        { yy.addLink($1,$3,$2,$5);$$ = 'oy'}
    | vertex link vertex
        { yy.addLink($1,$3,$2);$$ = 'oy'}
    | vertex
        {$$ = 'yo';}
    ;

styleStatement:STYLE SPACE ALPHA SPACE stylesOpt
    {$$ = $1;yy.addVertex($3,undefined,undefined,$5);}
    | STYLE SPACE HEX SPACE stylesOpt
          {console.log('In parser - style: '+$5);$$ = $1;yy.updateLink($3,$5);}
    ;

vertex:  ALPHA SQS text SQE
        {$$ = $1;yy.addVertex($1,$3,'square');}
    | ALPHA PS text PE
        {$$ = $1;yy.addVertex($1,$3,'round');}
    | ALPHA DIAMOND_START text DIAMOND_STOP
        {$$ = $1;yy.addVertex($1,$3,'diamond');}
    | ALPHA 
        {$$ = $1;yy.addVertex($1);}
    ;
// Characters and spaces
text: ALPHA SPACE text
        {$$ = $1 + ' ' +$3;}
    | ALPHA MINUS text
         {$$ = $1 + '-' +$3;}
    | ALPHA SPACE
        {$$ = $1;}
    | ALPHA
        {$$ = $1;}        
    ;

link: MINUS MINUS ARROW_POINT
        {$$ = {"type":"arrow"};}
    | MINUS MINUS ARROW_CIRCLE
        {$$ = {"type":"arrow_circle"};}
    | MINUS MINUS ARROW_CROSS
        {$$ = {"type":"arrow_cross"};}
    | MINUS MINUS MINUS
        {$$ = {"type":"arrow_open"};}
    ;

stylesOpt: style
        {$$ = [$1]}
    | stylesOpt COMMA style
        {$1.push($3);$$ = $1;}
    ;

style: styleComponent
    {$$=$1;}
    |style styleComponent
    {$$ = $1 + $2;}
    ;

styleComponent: ALPHA
    {$$=$1}
    | COLON
    {$$=$1}
    | MINUS
    {$$=$1}
    | NUM
    {$$=$1}
    | UNIT
    {$$=$1}
    | SPACE
    {$$=$1}
    | HEX
    {$$=$1}
    ;

colordef: COLOR
        {$$ = yytext;}
    |   HEX
        {$$ = yytext;}
    ;

borderWidth: NUM UNIT
        {$$ = $1+''+$2;}
    ;

borderStyle: BORDER_STYLE
        {$$ = $1;}
    ;

%%
/*define('parser/mermaid',function(){
    return parser;
});*/