%lex
%options case-insensitive

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
%s axis_data
%s data
%s data_inner
%%
\%\%\{                                    { this.pushState('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)    { this.pushState('type_directive'); return 'type_directive'; }
<type_directive>":"                       { this.popState(); this.pushState('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%      { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)      return 'arg_directive';
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
<acc_descr_multiline>[\}]                 { this.popState(); }
<acc_descr_multiline>[^\}]*               { return "acc_descr_multiline_value"; }

"xychart-beta"                            {return 'XYCHART';}
("vertical"|"horizontal")                 {return 'CHART_ORIENTATION'}

"x-axis"                                  { this.pushState("axis_data"); return "X_AXIS"; }
"y-axis"                                  { this.pushState("axis_data"); return "Y_AXIS"; }
<axis_data>[\[]                           { this.popState(); return 'SQUARE_BRACES_START'; }
<axis_data>[+-]?(?:\d+(?:\.\d+)?|\.\d+)   { return 'NUMBER_WITH_DECIMAL'; }
<axis_data>"-->"                          { return 'ARROW_DELIMITER'; }


"line"                                    { this.pushState("data"); return 'LINE'; }
"bar"                                     { this.pushState("data"); return 'BAR'; }
<data>[\[]                                { this.pushState("data_inner"); return 'SQUARE_BRACES_START'; }
<data_inner>[+-]?(?:\d+(?:\.\d+)?|\.\d+)  { return 'NUMBER_WITH_DECIMAL';}
<data_inner>[\]]                          { this.popState(); return 'SQUARE_BRACES_END'; }




["][`]                                    { this.pushState("md_string");}
<md_string>[^`"]+                         { return "MD_STR";}
<md_string>[`]["]                         { this.popState();}
["]                                       this.pushState("string");
<string>["]                               this.popState();
<string>[^"]*                             return "STR";


[\[]                                      return 'SQUARE_BRACES_START'
[\]]                                      return 'SQUARE_BRACES_END'
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
  | directive start
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
  ;

plotData
  : SQUARE_BRACES_START commaSeperateNumber SQUARE_BRACES_END   { $$ = $commaSeperateNumber }
  ;

commaSeperateNumber
  : NUMBER_WITH_DECIMAL commaSeperateNumberValues                 {
                                                                    $commaSeperateNumberValues = $commaSeperateNumberValues || [];
                                                                    $commaSeperateNumberValues.unshift(Number($NUMBER_WITH_DECIMAL));
                                                                    $$ = $commaSeperateNumberValues
                                                                  }
  ;

commaSeperateNumberValues
  : COMMA NUMBER_WITH_DECIMAL commaSeperateNumberValues           {
                                                                    $commaSeperateNumberValues = $commaSeperateNumberValues || [];
                                                                    $commaSeperateNumberValues.unshift(Number($NUMBER_WITH_DECIMAL));
                                                                    $$ = $commaSeperateNumberValues
                                                                  }
  |;

parseXAxis
  : text                                                          {yy.setXAxisTitle($text);}
  | text bandData                                                 {yy.setXAxisTitle($text); yy.setXAxisBand($bandData);}
  | text NUMBER_WITH_DECIMAL ARROW_DELIMITER NUMBER_WITH_DECIMAL  {yy.setXAxisTitle($text); yy.setXAxisRangeData(Number($NUMBER_WITH_DECIMAL1), Number($NUMBER_WITH_DECIMAL2));}
  ;

bandData
  : SQUARE_BRACES_START commaSeperateText SQUARE_BRACES_END       {$$ = $commaSeperateText}
  ;

commaSeperateText
  : text commaSeperateTextValues                                  {
                                                                    $commaSeperateTextValues = $commaSeperateTextValues || [];
                                                                    $commaSeperateTextValues.unshift($text);
                                                                    $$ = $commaSeperateTextValues
                                                                  }
  ;

commaSeperateTextValues
  : COMMA text commaSeperateTextValues                            {
                                                                    $commaSeperateTextValues = $commaSeperateTextValues || [];
                                                                    $commaSeperateTextValues.unshift($text);
                                                                    $$ = $commaSeperateTextValues
                                                                  }
  |;

parseYAxis
  : text  {yy.setYAxisTitle($text);}
  | text NUMBER_WITH_DECIMAL ARROW_DELIMITER NUMBER_WITH_DECIMAL  {yy.setYAxisTitle($text); yy.setYAxisRangeData(Number($NUMBER_WITH_DECIMAL1), Number($NUMBER_WITH_DECIMAL2));}
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
