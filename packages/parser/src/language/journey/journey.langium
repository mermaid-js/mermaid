grammar Journey

// common stuff in ../common/common.langium
// can't import directly because of JOURNEY_TASK_TITLE parse rule
fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /[\t ]*(?:accDescr(?:[\t ]*:[\t ]*[^\n\r]*?(?=%%)|\s*{[^}]*})|accDescr(?:[\t ]*:[\t ]*[^\n\r]*|\s*{[^}]*}))/;
terminal ACC_TITLE: /[\t ]*(?:accTitle[\t ]*:[\t ]*[^\n\r]*?(?=%%)|accTitle[\t ]*:[\t ]*[^\n\r]*)/;
terminal TITLE: /[\t ]*(?:title(?:[\t ]+[^\n\r]*?|)(?=%%)|title(?:[\t ]+[^\n\r]*|))/;

hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n[\s\S]*?---[\t ]*(?!.)/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*\n*/;

// actual grammar
entry Journey:
  NEWLINE*
  "journey"
  (
    NEWLINE* TitleAndAccessibilities JourneySectionAndTask
    | NEWLINE* TitleAndAccessibilities
    | NEWLINE+ JourneySectionAndTask
    | NEWLINE*
  )
;

fragment JourneySectionAndTask:
  sections+=JourneySection+ | tasks+=JourneyTask+
;

JourneySection:
  title=JOURNEY_SECTION_TITLE NEWLINE+
  tasks+=JourneyTask*
;

JourneyTask:
  title=JOURNEY_TASK_TITLE score=JOURNEY_TASK_SCORE
  (actors+=JOURNEY_TASK_FIRST_ACTOR (actors+=JOURNEY_TASK_ANOTHER_ACTOR)*)?
  NEWLINE+
;

terminal JOURNEY_SECTION_TITLE: /section[\t ]+[^\n\r]+/;
terminal JOURNEY_TASK_SCORE returns number: /(?!%%.*):[\t ]+[0-9]/;
terminal JOURNEY_TASK_FIRST_ACTOR: /(?!%%.*):[\t ]+[^\n\r,]+/;
terminal JOURNEY_TASK_ANOTHER_ACTOR: /(?!%%.*),[\t ]+[^\n\r,]+/;
terminal JOURNEY_TASK_TITLE: /journey-task-title/;
