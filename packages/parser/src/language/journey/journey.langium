grammar Journey
import "../common/common";

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
terminal JOURNEY_TASK_SCORE returns number: /:[\t ]+[0-9]/;
terminal JOURNEY_TASK_FIRST_ACTOR: /:[\t ]+[^\n\r,]+/;
terminal JOURNEY_TASK_ANOTHER_ACTOR: /,[\t ]+[^\n\r,]+/;
terminal JOURNEY_TASK_TITLE: /journey-task-title/;
