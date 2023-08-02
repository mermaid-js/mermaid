grammar Quadrant

// common stuff in ../common/common.langium
// can't import directly because of QUADRANT_POINT_TITLE parse rule
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
entry Quadrant:
  NEWLINE*
  ('quadrant' | QUADRANT_KEYWORD)
  (
    NEWLINE* TitleAndAccessibilities QuadrantAttributes points+=QuadrantPoint*
    | NEWLINE* TitleAndAccessibilities points+=QuadrantPoint*
    | NEWLINE+ QuadrantAttributes points+=QuadrantPoint+
    | NEWLINE+ QuadrantAttributes
    | NEWLINE+ points+=QuadrantPoint+
    | NEWLINE*
  )
;

fragment QuadrantAttributes:
  (
    (
      quadrant_1=QUADRANT_QUADRANT_1
      | quadrant_2=QUADRANT_QUADRANT_2
      | quadrant_3=QUADRANT_QUADRANT_3
      | quadrant_4=QUADRANT_QUADRANT_4
      | xAxis=QuadrantXAxis
      | yAxis=QuadrantYAxis
    ) NEWLINE+
  )+
;

QuadrantPoint:
  title=QUADRANT_POINT_TITLE x=QUADRANT_START_POINT_COORDINATE y=QUADRANT_END_POINT_COORDINATE
  NEWLINE+
;

QuadrantXAxis:
  left=QUADRANT_X_AXIS_LEFT right=QUADRANT_AXIS_RIGHT?
;

QuadrantYAxis:
  up=QUADRANT_Y_AXIS_LEFT down=QUADRANT_AXIS_RIGHT?
;

// the `Chart` part is for backward compatibility
terminal QUADRANT_KEYWORD: /quadrantChart(?!\S)/;

terminal QUADRANT_X_AXIS_LEFT: /x-axis[\t ]+[^\n\r]+(?=-->)|x-axis[\t ]+[^\n\r]+/;
terminal QUADRANT_Y_AXIS_LEFT: /y-axis[\t ]+[^\n\r]+(?=-->)|y-axis[\t ]+[^\n\r]+/;
terminal QUADRANT_AXIS_RIGHT: /-->[^\n\r]+/;

terminal QUADRANT_QUADRANT_1: /quadrant-1[\t ]+[^\n\r]+(?=%%)|quadrant-1[\t ]+[^\n\r]+/;
terminal QUADRANT_QUADRANT_2: /quadrant-2[\t ]+[^\n\r]+(?=%%)|quadrant-2[\t ]+[^\n\r]+/;
terminal QUADRANT_QUADRANT_3: /quadrant-3[\t ]+[^\n\r]+(?=%%)|quadrant-3[\t ]+[^\n\r]+/;
terminal QUADRANT_QUADRANT_4: /quadrant-4[\t ]+[^\n\r]+(?=%%)|quadrant-4[\t ]+[^\n\r]+/;

terminal QUADRANT_START_POINT_COORDINATE returns number: /:[\t ]+\[0(\.[0-9]+)?|1(\.0+)?[\t ]*/;
terminal QUADRANT_END_POINT_COORDINATE returns number: /,[\t ]+(0(\.\d+)?|1(\.0+)?)[\t ]*]/;
terminal QUADRANT_POINT_TITLE: /quadrant-point-title/;
