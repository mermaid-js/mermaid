%lex
%options case-insensitive

%x string
%x string
%x md_string
%x title
%x open_directive
%x type_directive
%x arg_directive
%x close_directive
%x acc_title
%x acc_descr
%x acc_descr_multiline
%x chart_config
%x chart_orientation
%x x_axis
%x y_axis
%x axis_title
%x axis_data
%x axis_data_band
%x axis_data_band_capture
%x line
%x line_title
%x line_data
%x line_data_entries
%x line_data_without_label
%x bar_data_without_label
%x bar
%x bar_title
%x bar_data
%x bar_data_entries
%%
\%\%\{                                    { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)    { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                       { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%      { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)      return 'arg_directive';
\%\%(?!\{)[^\n]*                          /* skip comments */
[^\}]\%\%[^\n]*                           /* skip comments */
[\n\r]+                                   return 'NEWLINE';
\%\%[^\n]*                                /* do nothing */

title                                     { this.begin("title");return 'title'; }
<title>(?!\n|;|#)*[^\n]*                  { this.popState(); return "title_value"; }

accTitle\s*":"\s*                         { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*              { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                         { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*              { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                         { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                 { this.popState(); }
<acc_descr_multiline>[^\}]*               return "acc_descr_multiline_value";

" "*"xychart-beta"		                    {this.begin("chart_config"); return 'XYCHART';}
<chart_config>" "+("vertical"|"horizontal")   {this.begin("chart_orientation"); return 'chart_orientation';}
<chart_orientation>[\s]*                  {this.popState(); this.popState(); return 'CHART_CONFIG_END';}
<chart_config>[\s]*                       {this.popState(); return 'CHART_CONFIG_END';}

"x-axis"" "*                              { this.begin("x_axis"); return "X_AXIS";}
"y-axis"" "*                              { this.begin("y_axis"); return "Y_AXIS";}
<x_axis,y_axis>["]                        {this.begin("axis_title");}
<axis_title>[^"]+                         {return 'AXIS_TITLE';}
<axis_title>["]" "*(\r?\n)                {this.popState(); this.popState();}
<axis_title>["]" "*                       {this.popState(); this.begin("axis_data");}
<x_axis,y_axis>[^\s]+" "*(\r?\n)          {this.popState(); return 'AXIS_TITLE';}
<x_axis,y_axis>[^\s]+" "*                 {this.begin("axis_data"); return 'AXIS_TITLE'; }

<axis_data>[+-]?\d+(?:\.\d+)?" "*"-->"" "*[+-]?\d+(?:\.\d+)?" "*      { return 'AXIS_RANGE_DATA';}

<axis_data>[\[]" "*                       {this.begin("axis_data_band"), this.begin("axis_data_band_capture")}
<axis_data_band_capture>(["][^",]+["]|[^\s\"\,]]+)" "*([,]" "*(["][^",]+["]|[^\s\]",]+)" "*)* { this.popState(); return "AXIS_BAND_DATA"; }
<axis_data_band>[\]]" "*                  {this.popState(); return "AXIS_BAND_DATA_END"}
<axis_data>[\s]+                        {this.popState(); this.popState();}


"line"" "*                                {this.begin("line"); return 'LINE';}
<line>["]                                 {this.begin("line_title");}
<line_title>[^"]+                         {return 'LINE_TITLE';}
<line_title>["]" "*                       {this.popState(); this.begin("line_data");}
<line_data>"["" "*                        {this.begin('line_data_entries');}
<line_data_without_label,line_data_entries>(?:[+-]?\d+(?:\.\d+)?)+(?:" "*[,]" "*(?:[+-]?\d+(?:\.\d+)?)+)*" "*   {return 'LINE_DATA'}
<line_data_entries>"]"" "*                {this.popState(); this.popState(); this.popState()}
<line_data_without_label>"]"" "*          {this.popState(); this.popState()}
<line>[^\s\[]+" "*                          {this.begin("line_data"); return 'LINE_TITLE';}
<line>"["" "*                             {this.begin('line_data_without_label');}

"bar"" "*                                 {this.begin("bar"); return 'BAR';}
<bar>["]                                  {this.begin("bar_title");}
<bar_title>[^"]+                          {return 'BAR_TITLE';}
<bar_title>["]" "*                        {this.popState(); this.begin("bar_data");}
<bar_data>"["" "*                         {this.begin('bar_data_entries');}
<bar_data_without_label,bar_data_entries>(?:[+-]?\d+(?:\.\d+)?)+(?:" "*[,]" "*(?:[+-]?\d+(?:\.\d+)?)+)*" "*    {return 'BAR_DATA'}
<bar_data_entries>"]"" "*                 {this.popState(); this.popState(); this.popState()}
<bar_data_without_label>"]"" "*           {this.popState(); this.popState()}
<bar>[^\s\[]+" "*                           {this.begin("bar_data"); return 'BAR_TITLE';}
<bar>"["" "*                              {this.begin('bar_data_without_label');}




["][`]                                    { this.begin("md_string");}
<md_string>[^`"]+                         { return "MD_STR";}
<md_string>[`]["]                         { this.popState();}
["]                                       this.begin("string");
<string>["]                               this.popState();
<string>[^"]*                             return "STR";

[A-Za-z]+                                 return 'ALPHA';
":"                                       return 'COLON';
\+                                        return 'PLUS';
","                                       return 'COMMA';
"="                                       return 'EQUALS';
\=                                        return 'EQUALS';
"*"                                       return 'MULT';
\#                                        return 'BRKT';
[\_]                                      return 'UNDERSCORE';
"."                                       return 'DOT';
"&"                                       return 'AMP';
\-                                        return 'MINUS';
[0-9]+                                    return 'NUM';
\s                                        return 'SPACE';
";"                                       return 'SEMI';
[!"#$%&'*+,-.`?\\_/]                      return 'PUNCTUATION';
<<EOF>>                                   return 'EOF';

/lex

%start start

%% /* language grammar */

start
  : eol start
  | SPACE start
  | directive start
  | XYCHART chartConfig CHART_CONFIG_END document
	| XYCHART CHART_CONFIG_END document
	;

chartConfig
  : chart_orientation {yy.setOrientation($1.trim());}
  ;

document
	: /* empty */
	| document line
	;

line
	: statement eol
	;

statement
  :
  | SPACE statement
	| directive
	| title title_value  { $$=$2.trim();yy.setDiagramTitle($$); }
  | X_AXIS parseXAxis
  | Y_AXIS parseYAxis
  | parseLine
  | parseBar
	;

parseLine
  : LINE LINE_DATA {yy.setLineData('', $2.split(',').map(d => Number(d.trim())));}
  | LINE LINE_TITLE LINE_DATA {yy.setLineData($2.trim(), $3.split(',').map(d => Number(d.trim())));}
  ;

parseBar
  : BAR BAR_DATA {yy.setBarData('', $2.split(',').map(d => Number(d.trim())));}
  | BAR BAR_TITLE BAR_DATA {yy.setBarData($2.trim(), $3.split(',').map(d => Number(d.trim())));}
  ;

parseXAxis
  : AXIS_TITLE statement {yy.setXAxisTitle($1.trim());}
  | AXIS_TITLE xAxisBandData statement {yy.setXAxisTitle($1.trim());}
  | AXIS_TITLE AXIS_RANGE_DATA statement {yy.setXAxisTitle($1.trim()); $$ = $2.split("-->"); yy.setXAxisRangeData(Number($$[0]), Number($$[1]));}
  ;

xAxisBandData
  : AXIS_BAND_DATA xAxisBandData {yy.setXAxisBand($1.split(',').map(d => { let m = d.trim().match(/^(?:["]([^"]+)["]|([^\s"]+))$/); return m ? m[1] || m[2] : "";}));}
  | AXIS_BAND_DATA_END
  ;

parseYAxis
  : AXIS_TITLE statement {yy.setYAxisTitle($1.trim());}
  | AXIS_TITLE AXIS_RANGE_DATA statement {yy.setYAxisTitle($1.trim()); $$ = $2.split("-->"); yy.setYAxisRangeData(Number($$[0]), Number($$[1]));}
  ;

directive
  : openDirective typeDirective closeDirective
  | openDirective typeDirective ':' argDirective closeDirective
  ;

eol
  : NEWLINE
  | SEMI
  | EOF
  ;

openDirective
  : open_directive { yy.parseDirective('%%{', 'open_directive'); }
  ;

typeDirective
  : type_directive { yy.parseDirective($1, 'type_directive'); }
  ;

argDirective
  : arg_directive { $1 = $1.trim().replace(/'/g, '"'); yy.parseDirective($1, 'arg_directive'); }
  ;

closeDirective
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'xychart'); }
  ;

text: alphaNumToken
    { $$={text:$1, type: 'text'};}
    | text textNoTagsToken
    { $$={text:$1.text+''+$2, type: $1.type};}
    | STR
    { $$={text: $1, type: 'text'};}
    | MD_STR
    { $$={text: $1, type: 'markdown'};}
    ;

alphaNum
    : alphaNumToken
    {$$=$1;}
    | alphaNum alphaNumToken
    {$$=$1+''+$2;}
    ;


alphaNumToken  : PUNCTUATION | AMP | NUM| ALPHA | COMMA | PLUS | EQUALS | MULT | DOT | BRKT| UNDERSCORE ;

textNoTagsToken: alphaNumToken | SPACE | MINUS;

%%
