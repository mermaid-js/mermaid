/** mermaid */
%lex

%options case-insensitive
%s group
%x attributes
%x attribute
%x value

%%
"sankey" return 'SANKEY'
\d+      return 'AMOUNT'
"->"     return 'ARROW'
\w+      return 'NODE'
(?:<<EOF>>|[\n;])+ { return 'EOS'; } // end of statement is ; \n or end of file
\s+ // skip all whitespace
"{"             { this.pushState('group'); return 'OPEN_GROUP'; }
<group>"}"      { this.popState('group'); return 'CLOSE_GROUP'; }
"["             { this.pushState('attributes'); return 'OPEN_ATTRIBUTES'; }
<attributes>"]" { this.popState(); return 'CLOSE_ATTRIBUTES'; }
<attributes>\w+ { return 'ATTRIBUTE'; } // string followed by = sign is "attrName"
<attributes>(?=\=s*)[\s\w] {return 'VALUE';}
<attributes>\= { this.pushState('attribute'); return 'EQUAL'; }
<attributes>\s+ // skip all whitespace
<attribute>[\w]+ {this.popState(); return 'VALUE';}
<attribute>\s+ //skip
<attribute>\" { this.pushState('value'); return 'OPEN_VALUE'; }
<value>\"  { this.popState(); return 'CLOSE_VALUE'; }

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
	|
	;

line
	: flow EOS
	| node_with_attributes EOS
	| EOS
	;

node_with_attributes: NODE OPEN_ATTRIBUTES attributes CLOSE_ATTRIBUTES;

attributes: attribute attributes | ;
attribute: ATTRIBUTE EQUAL VALUE | ATTRIBUTE;

// flow
// 	: NODE ARROW value_or_values_group ARROW flow
// 	| NODE
// 	;

flow: n_chain_a;

n_chain_a: NODE ARROW a_chain_n | NODE;
a_chain_n: AMOUNT ARROW n_chain_a | AMOUNT;
