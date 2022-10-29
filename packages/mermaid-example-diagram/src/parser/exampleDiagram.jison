%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%

"example-diagram"		      return 'example-diagram'    ;
[\s\n\r]+         return 'NL'      ;
[\s]+ 		      return 'space';
"showInfo"		  return 'showInfo';
<<EOF>>           return 'EOF'     ;
.                 return 'TXT' ;

/lex

%start start

%% /* language grammar */

start
// %{	: example-diagram document 'EOF' { return yy; } }
	: example-diagram document 'EOF' { return yy; }
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
