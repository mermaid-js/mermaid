/** mermaid */
%lex

%options case-insensitive
%s group
// %x attributes

%%
"{"       { this.pushState('group'); return 'OPEN_GROUP'; }
<group>"}" { this.popState('group'); return 'CLOSE_GROUP'; }
"sankey" return 'SANKEY'
\d+    return 'VALUE'
"->"     return 'ARROW'
\w+      return 'NODE'
"["             {/*this.pushState('attributes');*/ return 'OPEN_ATTRIBUTES'; }
"]" { /* this.popState(); */ return 'CLOSE_ATTRIBUTES'; }
(<<EOF>>|[\n;])+ return 'EOS' // end of statement
\s+ // skip all whitespace
// [\n]+ return 'NEWLINE';

// TODO: check if jison will return 2 separate tokens (for nodes) while ignoring whitespace

/lex

%start start

%% // language grammar

start
	: EOS SANKEY document
	| SANKEY document
	;

document
	: line document
	| // empty
	;

line
	// : node_with_attributes // one node with attributes
	: flow EOS
	| node_with_attributes EOS
	| EOS
	;
	

node_with_attributes
	: NODE
	| NODE attributes_group
	;

attributes_group
	: OPEN_ATTRIBUTES attributes CLOSE_ATTRIBUTES
	;

attributes:
	| // TODO
	;

flow
	: NODE ARROW value_or_values_group ARROW flow
	| NODE
	;

value_or_values_group
	: OPEN_GROUP values CLOSE_GROUP
	| VALUE
	;

values
	: values VALUE
	| /* empty */
	;
