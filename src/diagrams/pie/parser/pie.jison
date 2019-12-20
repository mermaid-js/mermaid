/** mermaid
 *  https://knsv.github.io/mermaid
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex
%x string
%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%
\%\%[^\n]*               /* do nothing */
\s+                      /* skip whitespace */
"pie"		             return 'pie'    ;
[\s\n\r]+                 return 'NL'      ;
[\s]+ 		              return 'space';
"title"\s[^#\n;]+         return 'title';
["]                       {/*console.log('begin str');*/this.begin("string");}
<string>["]               {/*console.log('pop-state');*/this.popState();}
<string>[^"]*             {/*console.log('ending string')*/return "STR";}
":"[\s]*[\d]+(?:\.[\d]+)? return "VALUE";

<<EOF>>           return 'EOF'     ;


/lex

%start start

%% /* language grammar */

start
// %{	: info document 'EOF' { return yy; } }
	: pie document 'EOF'
	;

document
	: /* empty */
	| document line
	;

line
	: statement { }
	| 'NL'
	;

statement
	:  STR VALUE {
		/*console.log('str:'+$1+' value: '+$2)*/
		yy.addSection($1,yy.cleanupValue($2));  }
	| title {yy.setTitle($1.substr(6));$$=$1.substr(6);}
	;

%%
