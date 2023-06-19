/** mermaid */
%lex

%options case-insensitive
%options easy_keyword_rules

// when we are inside [] section we are defining attrubutes
%x attributes
// or if we use "" we are expecting a string containing value
%x string
%x value

%%
// skip all whitespace EXCEPT newlines, but not within a string
<INITIAL,attributes,value>[^\S\r\n]+ {}

// main
"sankey"                              { return 'SANKEY'; }
\d+(.\d+)?                            { return 'AMOUNT'; }
"->"                                  { return 'ARROW'; }
\w+                                   { return 'NODE'; }
(?:<<EOF>>|[\n;])+                    { return 'EOS'; } // end of statement is semicolon ; new line \n or end of file
// attributes
"["                                   { this.pushState('attributes'); return 'OPEN_ATTRIBUTES'; }
<attributes>"]"                       { this.popState(); return 'CLOSE_ATTRIBUTES'; }
<attributes>\w+                       { return 'ATTRIBUTE'; }
<attributes>\=                        { this.pushState('value'); return 'EQUAL'; }
<value>\w+                            { this.popState(); return 'VALUE'; }
// strings
<INITIAL,attributes,value>\"          { this.pushState('string'); return 'OPEN_STRING'; }
<string>(?!\\)\"                      {
																			  if(this.topState()==='string') this.popState();
																			  if(this.topState()==='value') this.popState();
																				return 'CLOSE_STRING';
																			}
<string>([^"\\]|\\\"|\\\\)+           { return 'STRING'; }

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

node
	: NODE { $$ = yy.addNode($NODE); }
	| OPEN_STRING STRING[title] CLOSE_STRING { $$ = yy.addNode($title); /* TODO: add title and id separately?*/ }
	;

