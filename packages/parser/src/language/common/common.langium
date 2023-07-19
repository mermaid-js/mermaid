/* fragments */
fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

/* terminals */
terminal NEWLINE: /[\n\r]/;
hidden terminal WHITESPACE: /[\t\r ]+/;

// TODO: add YAML_COMMENT hidden rule
hidden terminal YAML: /---\s*[\n\r][\s\S]*?---\s*(?!.)/;
hidden terminal MULTI_LINE_COMMENT: /%%\*[\s\S]*?\*%%\s*/;
hidden terminal DIRECTIVE: /%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /%%[^\n\r]*\s*/;

terminal ACC_DESCR: /accessibility-description/;
terminal ACC_TITLE: /accessibility-title/;
terminal TITLE: /diagram-title/;
