fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
hidden terminal WHITESPACE: /[\t ]+/;

// TODO: add YAML_COMMENT hidden rule
hidden terminal YAML: /---\s*[\n\r][\s\S]*?---\s*(?!.)/;
// hidden terminal MULTI_LINE_COMMENT: /%%\*[\s\S]*?\*%%\s*/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*\s*/;

terminal ACC_DESCR: /accDescr(?:[\t ]*:[\t ]*[^\n\r]*?(?=%%)|\s*{[^}]*})|accDescr(?:[\t ]*:[\t ]*[^\n\r]*|\s*{[^}]*})/;
terminal ACC_TITLE: /accTitle[\t ]*:[\t ]*[^\n\r]*?(?=%%)|accTitle[\t ]*:[\t ]*[^\n\r]*/;
terminal TITLE: /title(?:[\t ]+[^\n\r]*?|)(?=%%)|title(?:[\t ]+[^\n\r]*|)/;
