/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
\n                    return 'NEWLINE';
"sequence"            return 'SEQ';
"TB"                  return 'DIR';
[0-9]+                return 'NUM';
":"                   return 'COLON';
\-                    return 'MINUS';
\+                    return 'PLUS';
\=                    return 'EQUALS';
[a-zåäöæøA-ZÅÄÖÆØ()]+   return 'ALPHA';
"/"                   return 'SLASH';
"("                   return 'PS';
")"                   return 'PE';
"["                   return 'SQS';
"]"                   return 'SQE';
\.                    return 'DOT';
\s                    return 'SPACE';
<<EOF>>               return 'EOF';

/lex

/* operator associations and precedence */

%right '^'

%start expressions

%% /* language grammar */

expressions
    : sequenceConfig statements
    {$$=$1;}
    | EOF
    ;
sequenceConfig
    : SEQ SPACE DIR newlines
        { $$ = $3;}
    ;

statements
    : statement newlines statements
        {$$=$1;}
    | statement EOF
        {$$=$1;}
    | statement newlines EOF
        {$$=$1;}
    ;

preStatement
    : alphaNum COLON text
              {$$={a:$1,b:$3}}
              ;

statement
    : preStatement
              {yy.addActor($1.a,'actor',$1.b);$$='actor';}
    |     preStatement DOT message
              {yy.addMessage($1.a,$1.b,$3);$$='message';}
    |     preStatement EQUALS callee DOT message
              {yy.addMessage($1.a,$3,$5,$1.b);$$='actor';}
    ;

action:
    SQS SQE
        {$$='action';}
    ;

actorDefinition:
    alphaNum COLON alphaNum
        {$$='actor';}
    ;
messageDefinition:
    caller COLON answer EQUALS callee DOT message
        {console.log('Got new message from='+$1+' to='+$5+' message='+$7+' answer='+$3);$$='actor';}
    ;

caller:
    alphaNum
    ;

answer:
    alphaNum
    ;

callee:
    alphaNum
    ;

message:
    alphaNum
    ;

spaceList
    : SPACE spaceList
    | SPACE
    ;
newlines
    : NEWLINE newlines
    | SPACE newlines
    | NEWLINE
    | SPACE
    ;
alphaNum
    :alphaNumStatement
        {$$=$1;}
    ;

alphaNumStatement
    : alphaNum alphaNumToken
        {$$=$1+''+$2;}
    | alphaNumToken
    ;

alphaNumToken
    : ALPHA
    {$$=$1;}
    | NUM
    {$$=$1;}
    ;

text
    :textStatement
        {$$=$1;}
    ;

textStatement
    : text textToken
        {$$=$1+''+$2;}
    | textToken
    ;

textToken
    : alphaNumToken
    | SPACE
    {$$=$1;}
    ;

// Characters and spaces
//text: alphaNum SPACE text
//        {$$ = $1 + ' ' +$3;}
//    | alphaNum spaceList MINUS spaceList text
//         {$$ = $1 + ' - ' +$5;}
//    | alphaNum
//        {$$ = $1;}

%%