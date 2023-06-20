/** mermaid */

//----------------------------------------------------
// We support csv format as defined there
// CSV format // https://www.ietf.org/rfc/rfc4180.txt
//----------------------------------------------------

%lex

%options case-insensitive
%options easy_keword_rules

// as per section 6.1 of RFC 2234 [2]
COMMA \u002C
CR \u000D 
LF \u000A
CRLF \u000D\u000A
DQUOTE \u0022
TEXTDATA [\u0020-\u0021\u0023-\u002B\u002D-\u007E]

%%

<<EOF>> { return 'EOF' }

"sankey" { return 'SANKEY' }
{COMMA} { return 'COMMA' }
{DQUOTE} { return 'DQUOTE' }
({CRLF}|{LF}) { return 'NEWLINE' }
{TEXTDATA}* { return 'NON_ESCAPED_TEXT' }
({TEXTDATA}|{COMMA}|{CR}|{LF}|{DQUOTE}{DQUOTE})* { return 'ESCAPED_TEXT' }

/lex

%start start

%% // language grammar

start
  : SANKEY file opt_eof
  ;

file: csv opt_newline;

csv
  : record csv_tail 
  ;

csv_tail
  : NEWLINE csv
  | // empty
  ;

opt_newline
  : NEWLINE
  | // empty
  ;

opt_eof
  : EOF
  | // empty
  ;

record
  : field\[source] COMMA field\[target] COMMA field\[value] {
      const source = yy.findOrCreateNode($source);
      const target = yy.findOrCreateNode($target);
      const value = parseFloat($value);
      $$ = yy.addLink(source,target,value);
    } // parse only 3 fields, this is not part of standard
  | // allow empty record to handle empty lines, this is not part of csv standard either
  ;

field
  : escaped { $$=$escaped; }
  | non_escaped { $$=$non_escaped; }
  ;

escaped: DQUOTE ESCAPED_TEXT DQUOTE { $$=$ESCAPED_TEXT; };

non_escaped: NON_ESCAPED_TEXT { $$=$NON_ESCAPED_TEXT; };


