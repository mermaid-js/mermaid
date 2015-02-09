/** js sequence diagrams
 *  http://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%

[\n]+             return 'NL';
"showInfo"		  return 'showInfo';
"info"		  return 'info';
"say"			  return 'say';
":"[^#\n;]+       return 'TXT';
<<EOF>>           return 'EOF';
.                 return 'INVALID';

/lex

%start start

%% /* language grammar */

start
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
	|  message    { yy.setMessage($1);  }
	;

message
	: 'say' TXT { $$ = $1.substring(1).trim().replace(/\\n/gm, "\n"); }
	;

%%