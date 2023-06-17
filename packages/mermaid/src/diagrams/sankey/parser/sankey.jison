/** mermaid */
%lex

%options case-insensitive
%options easy_keyword_rules

%s group
// when we are inside [] section we are defining attrubutes
%x attributes
// after attr= we are expecting a value without quotes
%x value      
// or if we use "" we are expecting a string containing value
%x string    

%%
"sankey"                         { return 'SANKEY'; }
\d+                              { return 'AMOUNT'; }
"->"                             { return 'ARROW'; }
\w+                              { return 'NODE'; }
(?:<<EOF>>|[\n;])+               { return 'EOS'; } // end of statement is ; \n or end of file
\s+                                                // skip all whitespace
"{"                              { this.pushState('group'); return 'OPEN_GROUP'; }
<group>"}"                       { this.popState(); return 'CLOSE_GROUP'; }
"["                              { this.pushState('attributes'); return 'OPEN_ATTRIBUTES'; }
<attributes>"]"                  { this.popState(); return 'CLOSE_ATTRIBUTES'; }
<attributes>\w+                  { return 'ATTRIBUTE'; }
<attributes>(?=\=s*)[\s\w]       { return 'VALUE';}
<attributes>\=                   { this.pushState('value'); return 'EQUAL'; }
<attributes>\s+                   // skip all whitespace
<value>[\w]+                     { this.popState(); return 'VALUE';}
<value>\s+                       //skip
<value>\"                        { this.pushState('string'); return 'OPEN_STRING'; }
<string>(?!\\)\" {
	if(this.topState()==='string') this.popState();
	if(this.topState()==='value') this.popState();
	return 'CLOSE_STRING';
}
<string>([^"\\]|\\\")+           { return 'STRING'; }

/lex

%start start
%left ARROW

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
	: stream optional_attributes EOS
	| node optional_attributes EOS
	| EOS
	;

optional_attributes: OPEN_ATTRIBUTES attributes CLOSE_ATTRIBUTES | ;

attributes: attribute attributes | ;
attribute: ATTRIBUTE EQUAL value | ATTRIBUTE;

value: VALUE | OPEN_STRING STRING CLOSE_STRING;

stream: node[source] ARROW amount ARROW tail[target] {
	$$=$source;
	yy.addLink($source, $target, $amount);
};

amount: AMOUNT { $$=parseFloat($AMOUNT); };

tail
	: stream { $$ = $stream }
	| node { $$ = $node; }
	;

node: NODE { $$ = yy.addNode($NODE); };

// : NODE exhaust intake exhaust_chain optional_attributes EOS
// exhaust_chain: ARROW AMOUNT intake_chain | ;
// intake_chain: ARROW NODE exhaust_chain | ;

// exhaust: ARROW AMOUNT;
// intake: ARROW NODE;

// node_chain_amount: NODE ARROW amount_node_chain | NODE;
// amount_node_chain: AMOUNT ARROW node_chain_amount | AMOUNT;
