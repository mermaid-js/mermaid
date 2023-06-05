grammar Timeline
import './common'


entry Timeline:
  NEWLINE*
  TIMELINE NEWLINE*
  TITLE_AND_ACCESSIBILITIES?
  sections+=SECTION* | periods+=PERIOD*
;

SECTION:
  title=SECTION_TITLE NEWLINE*
  (periods+=PERIOD)*
;

PERIOD:
  title=PERIOD_TITLE NEWLINE* (":" events+=(EVENT | PERIOD_TITLE) NEWLINE*)*
;

terminal TIMELINE: /timeline(?!\S)/;
terminal SECTION_TITLE: /section/;
// TODO: figue out how to prevent `PERIOD_TITLE` to consume `EVENT`
terminal PERIOD_TITLE: /period/;
terminal EVENT: /event/;
