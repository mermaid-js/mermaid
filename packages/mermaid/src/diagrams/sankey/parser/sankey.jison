/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2014-2015 Knut Sveidqvist
 *  MIT license.
 *
 *  Based on js sequence diagrams jison grammr
 *  https://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive

%%
"sankey" return 'SANKEY'
\w+ return 'NODE'
-> return 'ARROW'

/lex

%start start

%% /* language grammar */

start
	: SPACE start
	: SANKEY document
	;

document
	: document
	| /* empty */
	;

