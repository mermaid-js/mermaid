/** mermaid */

//---------------------------------------------------------
// We support csv format as defined here:
// https://www.ietf.org/rfc/rfc4180.txt
// There are some minor changes for compliance with jison
// We also parse only 3 columns: source,target,value
// And allow blank lines for visual purposes
//---------------------------------------------------------

%lex

%options case-insensitive
%options easy_keword_rules

%x escaped_text
%x csv

// as per section 6.1 of RFC 2234 [2]
COMMA \u002C
CR \u000D 
LF \u000A
CRLF \u000D\u000A
ESCAPED_QUOTE \u0022
DQUOTE \u0022
TEXTDATA [\u0020-\u0021\u0023-\u002B\u002D-\u007E]

%%

<INITIAL>"sankey-beta"                         { this.pushState('csv'); return 'SANKEY'; }
<INITIAL,csv><<EOF>>                           { return 'EOF' } // match end of file
<INITIAL,csv>({CRLF}|{LF})                     { return 'NEWLINE' }
<INITIAL,csv>{COMMA}                           { return 'COMMA' }
<INITIAL,csv>{DQUOTE}                          { this.pushState('escaped_text'); return 'DQUOTE'; }
<INITIAL,csv>{TEXTDATA}*                       { return 'NON_ESCAPED_TEXT' } 
<INITIAL,csv,escaped_text>{DQUOTE}(?!{DQUOTE}) {this.popState('escaped_text'); return 'DQUOTE'; } // unescaped DQUOTE closes string
<INITIAL,csv,escaped_text>({TEXTDATA}|{COMMA}|{CR}|{LF}|{DQUOTE}{DQUOTE})* { return 'ESCAPED_TEXT'; }

/lex

%start start

%% // language grammar

start: SANKEY NEWLINE csv opt_eof;

csv: record csv_tail;
csv_tail: NEWLINE csv | ;
opt_eof: EOF | ;

record
  : field\[source] COMMA field\[target] COMMA field\[value] {
      const source = yy.findOrCreateNode($source.trim().replaceAll('""', '"'));
      const target = yy.findOrCreateNode($target.trim().replaceAll('""', '"'));
      const value = parseFloat($value.trim());
      yy.addLink(source,target,value);
    } // parse only 3 fields, this is not part of CSV standard
  ;

field
  : escaped { $$=$escaped; }
  | non_escaped { $$=$non_escaped; }
  ;

escaped: DQUOTE ESCAPED_TEXT DQUOTE { $$=$ESCAPED_TEXT; };

non_escaped: NON_ESCAPED_TEXT { $$=$NON_ESCAPED_TEXT; };


