/* fragments */
fragment TITLE_AND_ACCESSIBILITIES:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE*)+
;

/* terminals */
terminal NEWLINE: /[\n\r]/;
hidden terminal WHITESPACE: /[\t\r ]+/;

// TODO: add YAML_COMMENT hidden rule
hidden terminal YAML: /---\s*[\n\r][\s\S]*?---\s*(?!.)/;
hidden terminal MULTI_LINE_COMMENT: /%%\*[\s\S]*?\*%%\s*/;
hidden terminal DIRECTIVE: /%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /%%[^\n\r]*\s*/;

terminal ACC_DESCR: /accDescr/;
terminal ACC_TITLE: /accTitle/;
terminal TITLE: /title/;

terminal STRING: /"[^"]*"/;
terminal NUMBER returns number: /(0|[1-9][0-9]*)(\.[0-9]+)?/;
