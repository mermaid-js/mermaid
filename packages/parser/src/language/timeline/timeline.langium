grammar Timeline
import "../common/common";

entry Timeline:
  NEWLINE*
  TIMELINE_KEYWORD
  (
    NEWLINE* TitleAndAccessibilities
    (sections+=TimelineSection* | periods+=TimelinePeriod*)
    | NEWLINE+ (sections+=TimelineSection* | periods+=TimelinePeriod*)
    | NEWLINE*
  )
;

TimelineSection:
  title=TIMELINE_SECTION_TITLE NEWLINE*
  periods+=TimelinePeriod*
;

TimelinePeriod:
  title=TIMELINE_PERIOD_TITLE NEWLINE*
  (":" events+=(TIMELINE_EVENT | TIMELINE_PERIOD_TITLE) NEWLINE*)*
;

terminal TIMELINE_KEYWORD: /timeline(?!\S)/;
terminal TIMELINE_SECTION_TITLE: /timeline-section/;
// TODO: figue out how to prevent `TIMELINE_PERIOD_TITLE` from consuming `TIMELINE_EVENT`
terminal TIMELINE_PERIOD_TITLE: /timeline-period/;
terminal TIMELINE_EVENT: /timeline-event/;
