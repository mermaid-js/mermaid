/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
\n                    return 'NEWLINE';
[0-9]+                return 'NUM';
":"                   return 'COLON';
\-                    return 'MINUS';
\+                    return 'PLUS';
\=                    return 'EQUALS';
[a-zåäöæøA-ZÅÄÖÆØ]+   return 'ALPHA';
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
    : statements
    {$$=$1;}
    | EOF
    ;

statements
    : statement newlines statements
        {$$=$1;}
    | statement EOF
        {$$=$1;}
    ;

preStatement
    : alphaNum COLON alphaNum
              {console.log('Got new actor id='+$1+' descr='+$3);$$={a:$1,b:$3}}
              ;

statement
    : preStatement
              {console.log('Got new actor id='+$1.a+' descr='+$1.b);$$='actor';}
    |     preStatement EQUALS callee DOT message
              {console.log('Got new message from='+$1.a+' to='+$3+' message='+$5+' answer='+$1.b);$$='actor';}
    ;

action:
    SQS SQE
        {console.log('#a');$$='action';}
    ;

actorDefinition:
    alphaNum COLON alphaNum
        {console.log('Got new actor id='+$1+' descr='+$3);$$='actor';}
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
    | NEWLINE
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

// Characters and spaces
text: alphaNum SPACE text
        {$$ = $1 + ' ' +$3;}
    | alphaNum spaceList MINUS spaceList text
         {$$ = $1 + ' - ' +$5;}
    | alphaNum
        {$$ = $1;}
    ;

%%