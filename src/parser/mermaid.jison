/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
"style"               return 'STYLE';
"background"          return 'BKG';
"red"                 return 'COLOR';
"blue"                return 'COLOR';
"black"               return 'COLOR';
\#[a-f0-9]+           return 'HEX';
[0-9]+                return 'NUM';
"border"              return 'BORDER';
"dotted"              return 'BORDER_STYLE';
"dashed"              return 'BORDER_STYLE';
"solid"               return 'BORDER_STYLE';
"px"                  return 'UNIT';
"pt"                  return 'UNIT';
"dot"                 return 'UNIT';
":"                   return 'COLON';
";"                   return ';';
","                   return 'COMMA';
\-\-[x]               return 'ARROW_CROSS';
\-\-">"               return 'ARROW_POINT';
\-\-[o]               return 'ARROW_CIRCLE';
\-\-\-                return 'ARROW_OPEN';
[a-zA-Z]+             return 'ALPHA';
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

edge: vertex link vertex PIPE text
        { yy.addLink($1,$3,$2,$5);$$ = 'oy'}
    | vertex link vertex
        { yy.addLink($1,$3,$2);$$ = 'oy'}
    | vertex
        {$$ = 'yo';}
    ;


vertex: STYLE SPACE ALPHA SPACE styles
        {$$ = $1;yy.addVertex($3,undefined,undefined,$5);}
    | ALPHA SQS text SQE
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
    | ALPHA SPACE
        {$$ = $1;}
    | ALPHA
        {$$ = $1;}        
    ;

link: ARROW_POINT
        {$$ = {"type":"arrow"};}
    | ARROW_CIRCLE
        {$$ = {"type":"arrow_circle"};}
    | ARROW_CROSS
        {$$ = {"type":"arrow_cross"};}
    | ARROW_OPEN
        {$$ = {"type":"arrow_open"};}
    ;
styles:
    styledef
        {$$ = [$1];}
    | styles COMMA styledef
        {console.log('in styles:'+JSON.stringify($1));$1.push($3);$$ = $1;}
    ;
styledef: BKG COLON colordef
    {$$={"background":$3}}
    | COL COLON COLORDEF
    {$$={"color":$3}}
    | BORDER COLON borderWidth SPACE borderStyle SPACE colordef
    {$$={"border":$3+' '+$5+' '+$7}}
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
define('parser/mermaid',function(){
    return mermaid;
});