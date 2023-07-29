interface Common {
  accDescr?: string
  accTitle?: string
  title?: string
}

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
hidden terminal WHITESPACE: /[\t ]+/;

// TODO: add YAML_COMMENT hidden rule
hidden terminal YAML: /---[\t ]*\r?\n[\s\S]*?---[\t ]*(?!.)/;
// hidden terminal MULTI_LINE_COMMENT: /%%\*[\s\S]*?\*%%\s*/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*\n*/;

terminal ACC_DESCR: /[\t ]*(?:accDescr(?:[\t ]*:[\t ]*[^\n\r]*?(?=%%)|\s*{[^}]*})|accDescr(?:[\t ]*:[\t ]*[^\n\r]*|\s*{[^}]*}))/;
terminal ACC_TITLE: /[\t ]*(?:accTitle[\t ]*:[\t ]*[^\n\r]*?(?=%%)|accTitle[\t ]*:[\t ]*[^\n\r]*)/;
terminal TITLE: /[\t ]*(?:title(?:[\t ]+[^\n\r]*?|)(?=%%)|title(?:[\t ]+[^\n\r]*|))/;
