interface Common {
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /accDescr([\t ]*:[^\n\r]*(?=%%)|\s*{[^}]*})|accDescr([\t ]*:[^\n\r]*|\s*{[^}]*})/;
terminal ACC_TITLE: /accTitle[\t ]*:[^\n\r]*(?=%%)|accTitle[\t ]*:[^\n\r]*/;
terminal TITLE: /title([\t ][^\n\r]*|)(?=%%)|title([\t ][^\n\r]*|)/;

hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n[\S\s]*?---[\t ]*(?!.)/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;