%lex
%options case-insensitive

%x string
%x md_string
%x title
%x acc_title
%x acc_descr
%x acc_descr_multiline
%s axis_data
%s axis_band_data
%s data
%s data_inner
%%
\%\%(?!\{)[^\n]*                          /* skip comments */
[^\}]\%\%[^\n]*                           /* skip comments */
<axis_data>(\r?\n)                        { this.popState(); return 'NEWLINE'; }
<data>(\r?\n)                             { this.popState(); return 'NEWLINE'; }
[\n\r]+                                   return 'NEWLINE';
\%\%[^\n]*                                /* do nothing */

"title"                                   { return 'title'; }

"accTitle"\s*":"\s*                         { this.pushState("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*              { this.popState(); return "acc_title_value"; }
"accDescr"\s*":"\s*                         { this.pushState("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*              { this.popState(); return "acc_descr_value"; }
"accDescr"\s*"{"\s*                         { this.pushState("acc_descr_multiline");}
<acc_descr_multiline>"{"                 { this.popState(); }
<acc_descr_multiline>[^\}]*               { return "acc_descr_multiline_value"; }

"xychart-beta"                            {return 'XYCHART';}
(?:"vertical"|"horizontal")               {return 'CHART_ORIENTATION'}

"x-axis"                                  { this.pushState("axis_data"); return "X_AXIS"; }
"y-axis"                                  { this.pushState("axis_data"); return "Y_AXIS"; }
<axis_data>"["                            { this.pushState("axis_band_data"); return 'SQUARE_BRACES_START'; }
<axis_data>"-->"                          { return 'ARROW_DELIMITER'; }


"line"                                    { this.pushState("data"); return 'LINE'; }
"bar"                                     { this.pushState("data"); return 'BAR'; }
<data>"["                                 { this.pushState("data_inner"); return 'SQUARE_BRACES_START'; }
<axis_data,data_inner>[+-]?(?:\d+(?:\.\d+)?|\.\d+)   { return 'NUMBER_WITH_DECIMAL'; }
<data_inner,axis_band_data>"]"            { this.popState(); return 'SQUARE_BRACES_END'; }




(?:"`)                                    { this.pushState("md_string"); }
<md_string>(?:(?!`\").)+                  { return "MD_STR"; }
<md_string>(?:`")                         { this.popState(); }
["]                                       this.pushState("string");
<string>["]                               this.popState();
<string>[^"]*                             return "STR";


"["                                       return 'SQUARE_BRACES_START'
"]"                                       return 'SQUARE_BRACES_END'
[A-Za-z]+                                 return 'ALPHA';
":"                                       return 'COLON';
\+                                        return 'PLUS';
","                                       return 'COMMA';
\=                                        return 'EQUALS';
"*"                                       return 'MULT';
\#                                        return 'BRKT';
[\_]                                      return 'UNDERSCORE';
"."                                       return 'DOT';
"&"                                       return 'AMP';
\-                                        return 'MINUS';
[0-9]+                                    return 'NUM';
\s+                                       /* skip */
";"                                       return 'SEMI';
<<EOF>>                                   return 'EOF';

/lex

%start start

%% /* language grammar */

start
  : eol start
  | XYCHART chartConfig start
  | XYCHART start
  | document
  ;

chartConfig
  : CHART_ORIENTATION                                           { yy.setOrientation($1); }
  ;

document
  : /* empty */
  | document statement
  ;

statement
  : statement eol
  | title text                                                  { yy.setDiagramTitle($text.text.trim()); }
  | X_AXIS parseXAxis
  | Y_AXIS parseYAxis
  | LINE plotData                                               { yy.setLineData({text: '', type: 'text'}, $plotData); }
  | LINE text plotData                                          { yy.setLineData($text, $plotData); }
  | BAR plotData                                                { yy.setBarData({text: '', type: 'text'}, $plotData); }
  | BAR text plotData                                           { yy.setBarData($text, $plotData); }
  | acc_title acc_title_value                                   { $$=$acc_title_value.trim();yy.setAccTitle($$); }
  | acc_descr acc_descr_value                                   { $$=$acc_descr_value.trim();yy.setAccDescription($$); }
  | acc_descr_multiline_value                                   { $$=$acc_descr_multiline_value.trim();yy.setAccDescription($$); }
  ;

plotData
  : SQUARE_BRACES_START commaSeparatedNumbers SQUARE_BRACES_END   { $$ = $commaSeparatedNumbers }
  ;

commaSeparatedNumbers
  : NUMBER_WITH_DECIMAL COMMA commaSeparatedNumbers                { $$ = [Number($NUMBER_WITH_DECIMAL), ...$commaSeparatedNumbers] }
  | NUMBER_WITH_DECIMAL                                           { $$ = [Number($NUMBER_WITH_DECIMAL)] }
  ;

parseXAxis
  : text                                                          {yy.setXAxisTitle($text);}
  | text xAxisData                                                {yy.setXAxisTitle($text);}
  | xAxisData                                                     {yy.setXAxisTitle({type: 'text', text: ''});}
  ;

xAxisData
  : bandData                                                 {yy.setXAxisBand($bandData);}
  | NUMBER_WITH_DECIMAL ARROW_DELIMITER NUMBER_WITH_DECIMAL  {yy.setXAxisRangeData(Number($NUMBER_WITH_DECIMAL1), Number($NUMBER_WITH_DECIMAL2));}
  ;

bandData
  : SQUARE_BRACES_START commaSeparatedTexts SQUARE_BRACES_END       {$$ = $commaSeparatedTexts}
  ;

commaSeparatedTexts
  : text COMMA commaSeparatedTexts                                 { $$ = [$text, ...$commaSeparatedTexts] }
  | text                                                          { $$ = [$text] }
  ;

parseYAxis
  : text                                                      {yy.setYAxisTitle($text);}
  | text yAxisData                                            {yy.setYAxisTitle($text);}
  | yAxisData                                                 {yy.setYAxisTitle({type: "text", text: ""});}
  ;

yAxisData
  : NUMBER_WITH_DECIMAL ARROW_DELIMITER NUMBER_WITH_DECIMAL  {yy.setYAxisRangeData(Number($NUMBER_WITH_DECIMAL1), Number($NUMBER_WITH_DECIMAL2));}
  ;

eol
  : NEWLINE
  | SEMI
  | EOF
  ;


text: alphaNum { $$={text:$alphaNum, type: 'text'};}
  | STR { $$={text: $STR, type: 'text'};}
  | MD_STR { $$={text: $MD_STR, type: 'markdown'};}
  ;

alphaNum
  : alphaNumToken {$$=$alphaNumToken;}
  | alphaNum alphaNumToken {$$=$alphaNum+''+$alphaNumToken;}
  ;


alphaNumToken  : AMP | NUM | ALPHA | PLUS | EQUALS | MULT | DOT | BRKT| MINUS | UNDERSCORE ;

%%
