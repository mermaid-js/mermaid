/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
"style"               return 'STYLE';
"linkStyle"           return 'LINKSTYLE';
"classDef"            return 'CLASSDEF';
"class"               return 'CLASS';
"click"               return 'CLICK';
"graph"               return 'GRAPH';
"LR"                  return 'DIR';
"RL"                  return 'DIR';
"TB"                  return 'DIR';
"BT"                  return 'DIR';
"TD"                  return 'DIR';
"BR"                  return 'DIR';
[0-9]                 return 'NUM';
\#                    return 'BRKT';
":"                   return 'COLON';
";"                   return 'SEMI';
","                   return 'COMMA';
"="                   return 'EQUALS';
"*"                   return 'MULT';
"."                   return 'DOT';
"<"                   return 'TAGSTART';
">"                   return 'TAGEND';
\-\-[x]               return 'ARROW_CROSS';
\-\-\>                return 'ARROW_POINT';
\-\-[o]               return 'ARROW_CIRCLE';
\-\-\-                return 'ARROW_OPEN';
\-                    return 'MINUS';
\+                    return 'PLUS';
\=                    return 'EQUALS';
[a-zåäöæøA-ZÅÄÖÆØ_]   return 'ALPHA';
"|"                   return 'PIPE';
"("                   return 'PS';
")"                   return 'PE';
"["                   return 'SQS';
"]"                   return 'SQE';
"{"                   return 'DIAMOND_START'
"}"                   return 'DIAMOND_STOP'
"\""                  return 'QUOTE';
\s                    return 'SPACE';
\n                    return 'NEWLINE';

<<EOF>>               return 'EOF';

/lex

/* operator associations and precedence */

%left '^'

%start expressions

%% /* language grammar */

expressions
    : graphConfig statements EOF
    | graphConfig spaceList statements EOF
        {$$=$1;}
    ;

graphConfig
    : GRAPH SPACE DIR SEMI
        { yy.setDirection($3);$$ = $3;}
    ;

statements
    : statement spaceList statements
    | statement
    ;

spaceList
    : SPACE spaceList
    | SPACE
    ;

statement
    : verticeStatement SEMI
    | styleStatement SEMI
    | linkStyleStatement SEMI
    | classDefStatement SEMI
    | classStatement SEMI
    | clickStatement SEMI
    ;

verticeStatement:
     vertex link vertex
        { yy.addLink($1,$3,$2);$$ = 'oy'}
     | vertex
        {$$ = 'yo';}
    ;

vertex:  alphaNum SQS text SQE
        {$$ = $1;yy.addVertex($1,$3,'square');}
    | alphaNum PS PS text PE PE
        {$$ = $1;yy.addVertex($1,$4,'circle');}
    | alphaNum PS text PE
        {$$ = $1;yy.addVertex($1,$3,'round');}
    | alphaNum DIAMOND_START text DIAMOND_STOP
        {$$ = $1;yy.addVertex($1,$3,'diamond');}
    | alphaNum TAGEND text SQE
        {$$ = $1;yy.addVertex($1,$3,'odd');}
    | alphaNum TAGSTART text TAGEND
        {$$ = $1;yy.addVertex($1,$3,'diamond');}
    | alphaNum
        {$$ = $1;yy.addVertex($1);}
    ;

alphaNum
    : alphaNumStatement
    {$$=$1;}
    | alphaNumStatement alphaNum
    {$$=$1+''+$2;}
    ;

alphaNumStatement
    : alphaNumToken
        {$$=$1;}
    | alphaNumToken MINUS alphaNumToken
        {$$=$1+'-'+$3;}
    ;

alphaNumToken
    : ALPHA
    {$$=$1;}
    | NUM
    {$$=$1;}
    | COLON
        {$$ = $1;}
    | COMMA
        {$$ = $1;}
    | PLUS
        {$$ = $1;}
    | EQUALS
        {$$ = $1;}
    | MULT
        {$$ = $1;}
    | DOT
        {$$ = $1;}

    | BRKT
        {$$ = '<br>';}
    ;

link: linkStatement arrowText
    {$1.text = $2;$$ = $1;}
    | linkStatement
    {$$ = $1;}
    ;

linkStatement: ARROW_POINT
        {$$ = {"type":"arrow"};}
    | ARROW_CIRCLE
        {$$ = {"type":"arrow_circle"};}
    | ARROW_CROSS
        {$$ = {"type":"arrow_cross"};}
    | ARROW_OPEN
        {$$ = {"type":"arrow_open"};}
    ;

arrowText:
    PIPE text PIPE
    {$$ = $2;}
    ;

text: textToken
    {$$=$1;}
    | text textToken
    {$$=$1+''+$2;}
    ;

textStatement: textToken
    | textToken textStatement
    ;

textToken: ALPHA
   {$$=$1;}
   | NUM
   {$$=$1;}
   | COLON
       {$$ = $1;}
   | COMMA
       {$$ = $1;}
   | PLUS
       {$$ = $1;}
   | EQUALS
       {$$ = $1;}
   | MULT
       {$$ = $1;}
   | DOT
       {$$ = $1;}
   | TAGSTART
       {$$ = $1;}
   | TAGEND
       {$$ = $1;}
   | BRKT
       {$$ = '<br>';}
   | SPACE
       {$$ = $1;}
   | MINUS
       {$$ = $1;}
    ;
textNoTags: textNoTagsToken
    {$$=$1;}
    | textNoTags textNoTagsToken
    {$$=$1+''+$2;}
    ;

textNoTagsToken: ALPHA
   {$$=$1;}
   | NUM
   {$$=$1;}
   | COLON
       {$$ = $1;}
   | COMMA
       {$$ = $1;}
   | PLUS
       {$$ = $1;}
   | EQUALS
       {$$ = $1;}
   | MULT
       {$$ = $1;}
   | DOT
       {$$ = $1;}
   | BRKT
       {$$ = '<br>';}
   | SPACE
       {$$ = $1;}
   | MINUS
       {$$ = $1;}
    ;

classDefStatement:CLASSDEF SPACE alphaNum SPACE stylesOpt
    {$$ = $1;yy.addClass($3,$5);}
    ;

classStatement:CLASS SPACE alphaNum SPACE alphaNum
    {$$ = $1;yy.setClass($3, $5);}
    ;

clickStatement:CLICK SPACE alphaNum SPACE alphaNum
    {$$ = $1;yy.setClickEvent($3, $5);}
    ;

styleStatement:STYLE SPACE alphaNum SPACE stylesOpt
    {$$ = $1;yy.addVertex($3,undefined,undefined,$5);}
    | STYLE SPACE HEX SPACE stylesOpt
          {$$ = $1;yy.updateLink($3,$5);}
    ;

linkStyleStatement:
    LINKSTYLE SPACE NUM SPACE stylesOpt
          {$$ = $1;yy.updateLink($3,$5);}
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
    | BRKT
    {$$=$1}
    | DOT
    {$$=$1}
    ;
%%