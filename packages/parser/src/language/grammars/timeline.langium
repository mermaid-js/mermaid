grammar Timeline
import './common'


entry Timeline:
  NEWLINE*
  TIMELINE NEWLINE*
  TITLE_AND_ACCESSIBILITIES?
  sections+=TIMELINE_SECTION* | periods+=TIMELINE_PERIOD*
;

TIMELINE_SECTION:
  title=TIMELINE_SECTION_TITLE NEWLINE*
  (periods+=TIMELINE_PERIOD)*
;

TIMELINE_PERIOD:
  title=TIMELINE_PERIOD_TITLE NEWLINE* (":" events+=(TIMELINE_EVENT | TIMELINE_PERIOD_TITLE) NEWLINE*)*
;

terminal TIMELINE: /timeline(?!\S)/;
terminal TIMELINE_SECTION_TITLE: /timeline-section/;
// TODO: figue out how to prevent `PERIOD_TITLE` to consume `EVENT`
terminal TIMELINE_PERIOD_TITLE: /timeline-period/;
terminal TIMELINE_EVENT: /timeline-event/;
