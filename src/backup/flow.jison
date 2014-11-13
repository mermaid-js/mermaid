/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
"style"               return 'STYLE';
[a-zåäöæøA-ZÅÄÖÆØ]+   return 'ALPHA';
\#[a-f0-9]+           return 'HEX';
[0-9]+                return 'NUM';
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
    : id EOF
        {return $1;}
    ;

flow: id
    {$$='key';}
    | STYLE
    {$$=$1;}
    ;

id: id MINUS word
	{$$=$1+'-'+$3}
	| word
	{$$=$1}
	;

word: ALPHA
	{$$=$1}
	;



%%
define('parser/flow',function(){
    console.log('bcs123');
    return parser;
});