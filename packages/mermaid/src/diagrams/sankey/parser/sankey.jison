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
<string>([^"\\]|\\\")+                    { console.log(this.state); return 'STRING'; }

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
attribute: ATTRIBUTE EQUAL value | ATTRIBUTE;

value: VALUE | OPEN_STRING STRING CLOSE_STRING;

flow: n_chain_a;

n_chain_a: NODE ARROW a_chain_n | NODE;
a_chain_n: AMOUNT ARROW n_chain_a | AMOUNT;
