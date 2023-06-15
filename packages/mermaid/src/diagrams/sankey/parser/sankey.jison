/** mermaid */
%lex

%options case-insensitive

%%
"sankey" return 'SANKEY'
"->" return 'ARROW'
\w+ return 'NODE'
[\n]+ return 'NEWLINE';
\s+ /* skip all whitespace */

// TODO: check if jison will return 2 separate tokens (for nodes) while ignoring whitespace

/lex

%start start

%% /* language grammar */

start
	: SPACE start
	| SANKEY document
	;

document
	: node document
	| /* empty */
	;
	