/** mermaid
 *  https://knsv.github.io/mermaid
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%

"info"		      return 'info'    ;
[\s\n\r]+         return 'NL'      ;
[\s]+ 		      return 'space';
"showInfo"		  return 'showInfo';
<<EOF>>           return 'EOF'     ;
.                 return 'TXT' ;

/lex

%start start

%% /* language grammar */

start
// %{	: info document 'EOF' { return yy; } }
	: info document 'EOF' { return yy; }
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
	:  showInfo   { yy.setInfo(true);  }
	;

%%
