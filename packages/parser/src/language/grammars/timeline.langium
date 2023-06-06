grammar Timeline
import './common'


entry Timeline:
  NEWLINE*
  TIMELINE NEWLINE*
  TitleAndAccessibilities?
  sections+=TimelineSection* | periods+=TimelinePeriod*
;

TimelineSection:
  title=TIMELINE_SECTION_TITLE NEWLINE*
  (periods+=TimelinePeriod)*
;

TimelinePeriod:
  title=TIMELINE_PERIOD_TITLE NEWLINE* (":" events+=(TIMELINE_EVENT | TIMELINE_PERIOD_TITLE) NEWLINE*)*
;

terminal TIMELINE: /timeline(?!\S)/;
terminal TIMELINE_SECTION_TITLE: /timeline-section/;
// TODO: figue out how to prevent `PERIOD_TITLE` to consume `EVENT`
terminal TIMELINE_PERIOD_TITLE: /timeline-period/;
terminal TIMELINE_EVENT: /timeline-event/;
