fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /accDescr(?:[\t ]*:[\t ]*[^\n\r]*?(?=%%)|\s*{[^}]*})|accDescr(?:[\t ]*:[\t ]*[^\n\r]*|\s*{[^}]*})/;
terminal ACC_TITLE: /accTitle[\t ]*:[\t ]*[^\n\r]*?(?=%%)|accTitle[\t ]*:[\t ]*[^\n\r]*/;
terminal TITLE: /title(?:[\t ]+[^\n\r]*?|)(?=%%)|title(?:[\t ]+[^\n\r]*|)/;

hidden terminal WHITESPACE: /[\t ]+/;
// TODO: add YAML_COMMENT hidden rule without interfere actual grammar
hidden terminal YAML: /---[\t ]*\r?\n[\S\s]*?---[\t ]*(?!.)/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
