/** mermaid */
%lex
TOKEN \w+
NUM \d+(.\d+)?

%options case-insensitive
%options easy_keword_rules

%s link_value

%x attributes
%x attr_value
%x string

%%
//--------------------------------------------------------------
// skip all whitespace EXCEPT newlines, but not within a string
//--------------------------------------------------------------

<INITIAL,link_value,attributes,attr_value>[^\S\r\n]+   {}

//--------------
// basic tokens
//--------------

(<<EOF>>|[\n;])+                            { return 'EOS'; } // end of statement is semicolon ; new line \n or end of file
"sankey-beta"                               { return 'SANKEY'; }
<INITIAL>{TOKEN}                            { return 'NODE_ID'; }
<link_value>{NUM}                           { return 'AMOUNT'; }
"->"                                        {
                                              if(this.topState()!=='link_value') this.pushState('link_value');
                                              else this.popState();
                                              return 'ARROW';
                                            }
//------------
// attributes
//------------

"["                                         { this.pushState('attributes'); return 'OPEN_ATTRIBUTES'; }
<attributes>"]"                             { this.popState(); return 'CLOSE_ATTRIBUTES'; }
<attributes>{TOKEN}                         { return 'ATTRIBUTE'; }
<attributes>\=                              { this.pushState('attr_value'); return 'EQUAL'; }
<attr_value>{TOKEN}                         { this.popState(); return 'VALUE'; }

//------------
// strings
//------------

<INITIAL,attributes,attr_value>\"           { this.pushState('string'); return 'OPEN_STRING'; }
<string>(?!\\)\"                            {
                                              if(this.topState()==='string') this.popState();
                                              if(this.topState()==='attr_value') this.popState();
                                              return 'CLOSE_STRING';
                                            }
<string>([^"\\]|\\\"|\\\\)+                 { return 'STRING'; }

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
  : node optional_attributes EOS
  | stream optional_attributes EOS
  | EOS
  ;

optional_attributes: OPEN_ATTRIBUTES attributes CLOSE_ATTRIBUTES | ;

attributes: attribute attributes | ;
attribute: ATTRIBUTE EQUAL value | ATTRIBUTE;

value: VALUE | OPEN_STRING STRING CLOSE_STRING;

stream
  : node\[source] ARROW amount ARROW tail\[target] {
      $$=$source;
      yy.addLink($source, $target, $amount);
    }
  ;

tail
  : stream { $$ = $stream }
  | node { $$ = $node; }
    ;

amount: AMOUNT { $$=parseFloat($AMOUNT); };

node
  : NODE_ID { $$ = yy.findOrCreateNode($NODE_ID); }
  | OPEN_STRING STRING\[node_label] CLOSE_STRING { $$ = yy.findOrCreateNode($node_label); }
  ;

