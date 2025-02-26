/** mermaid
 *  https://knsv.github.io/mermaid
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex
%options case-insensitive

%x string
%x token
%x unqString
%x style
%x acc_title
%x acc_descr
%x acc_descr_multiline
%%

"title"\s[^#\n;]+       return 'title';
accTitle\s*":"\s*                                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
.*direction\s+TB[^\n]*                       return 'direction_tb';
.*direction\s+BT[^\n]*                       return 'direction_bt';
.*direction\s+RL[^\n]*                       return 'direction_rl';
.*direction\s+LR[^\n]*                       return 'direction_lr';
(\r?\n)+                               return 'NEWLINE';
\s+                                    /* skip all whitespace */
\#[^\n]*                               /* skip comments */
\%%[^\n]*                              /* skip comments */
<<EOF>>                               return 'EOF';

"requirementDiagram"        return 'RD';

"{"                         return 'STRUCT_START';
"}"                         return 'STRUCT_STOP';
":"{3}                       return 'STYLE_SEPARATOR';
":"                         return 'COLONSEP';

"id"                        return 'ID';
"text"                      return 'TEXT';
"risk"                      return 'RISK';
"verifyMethod"              return 'VERIFYMTHD';

"requirement"               return 'REQUIREMENT';
"functionalRequirement"     return 'FUNCTIONAL_REQUIREMENT';
"interfaceRequirement"      return 'INTERFACE_REQUIREMENT';
"performanceRequirement"    return 'PERFORMANCE_REQUIREMENT';
"physicalRequirement"       return 'PHYSICAL_REQUIREMENT';
"designConstraint"          return 'DESIGN_CONSTRAINT';

"low"                       return 'LOW_RISK';
"medium"                    return 'MED_RISK';
"high"                      return 'HIGH_RISK';

"analysis"                  return 'VERIFY_ANALYSIS';
"demonstration"             return 'VERIFY_DEMONSTRATION';
"inspection"                return 'VERIFY_INSPECTION';
"test"                      return 'VERIFY_TEST';

"element"       return 'ELEMENT';

"contains"      return 'CONTAINS';
"copies"        return 'COPIES';
"derives"       return 'DERIVES';
"satisfies"     return 'SATISFIES';
"verifies"      return 'VERIFIES';
"refines"       return 'REFINES';
"traces"        return 'TRACES';

"type"          return 'TYPE';
"docref"        return 'DOCREF';

"style"                         { this.begin("style"); return 'STYLE'; }
<style>\w+                          return 'ALPHA';
<style>":" return 'COLON';
<style>";" return 'SEMICOLON';
<style>"%" return 'PERCENT';
<style>"-" return 'MINUS';
<style>"#" return 'BRKT';
<style>" "                             /* skip spaces */
<style>["] { this.begin("string"); }
<style>\n { this.popState(); }

"classDef" { this.begin("style"); return 'CLASSDEF'; }
"class" { this.begin("style"); return 'CLASS'; }

"<-"        return 'END_ARROW_L';
"->"        {return 'END_ARROW_R';}
"-"         {return 'LINE';}

["]                 { this.begin("string"); }
<string>["]         { this.popState(); }
<string>[^"]*       { return "qString"; }

[\w][^:,\r\n\{\<\>\-\=]*                { yytext = yytext.trim(); return 'unqString';}

<*>\w+                          return 'ALPHA';
<*>[0-9]+                       return 'NUM';
<*>","                             return 'COMMA';

/lex

%start start

%% /* language grammar */

start
  : directive NEWLINE start
  | directive start
  | RD NEWLINE diagram EOF;

directive
  : acc_title acc_title_value  { $$=$2.trim();yy.setAccTitle($$); }
  | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
  | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }
  ;

diagram
  : /* empty */ { $$ = [] }
  | requirementDef diagram
  | elementDef diagram
  | relationshipDef diagram
  | directive diagram
  | direction diagram
  | styleStatement diagram
  | classDefStatement diagram
  | classStatement diagram
  | NEWLINE diagram
  ;

direction
    : direction_tb
    { yy.setDirection('TB');}
    | direction_bt
    { yy.setDirection('BT');}
    | direction_rl
    { yy.setDirection('RL');}
    | direction_lr
    { yy.setDirection('LR');}
    ;

requirementDef
  : requirementType requirementName STRUCT_START NEWLINE requirementBody { yy.addRequirement($2, $1) }
  | requirementType requirementName STYLE_SEPARATOR idList STRUCT_START NEWLINE requirementBody { yy.addRequirement($2, $1); yy.setClass([$2], $4); }
  ;

requirementBody
  : ID COLONSEP id NEWLINE requirementBody
    { yy.setNewReqId($3); }
  | TEXT COLONSEP text NEWLINE requirementBody
    { yy.setNewReqText($3); }
  | RISK COLONSEP riskLevel NEWLINE requirementBody
    { yy.setNewReqRisk($3); }
  | VERIFYMTHD COLONSEP verifyType NEWLINE requirementBody
    { yy.setNewReqVerifyMethod($3); }
  | NEWLINE requirementBody
  | STRUCT_STOP;

requirementType
  : REQUIREMENT
    { $$=yy.RequirementType.REQUIREMENT;}
  | FUNCTIONAL_REQUIREMENT
    { $$=yy.RequirementType.FUNCTIONAL_REQUIREMENT;}
  | INTERFACE_REQUIREMENT
    { $$=yy.RequirementType.INTERFACE_REQUIREMENT;}
  | PERFORMANCE_REQUIREMENT
    { $$=yy.RequirementType.PERFORMANCE_REQUIREMENT;}
  | PHYSICAL_REQUIREMENT
    { $$=yy.RequirementType.PHYSICAL_REQUIREMENT;}
  | DESIGN_CONSTRAINT
    { $$=yy.RequirementType.DESIGN_CONSTRAINT;};

riskLevel
  : LOW_RISK { $$=yy.RiskLevel.LOW_RISK;}
  | MED_RISK { $$=yy.RiskLevel.MED_RISK;}
  | HIGH_RISK { $$=yy.RiskLevel.HIGH_RISK;};

verifyType
  : VERIFY_ANALYSIS
    { $$=yy.VerifyType.VERIFY_ANALYSIS;}
  | VERIFY_DEMONSTRATION
    { $$=yy.VerifyType.VERIFY_DEMONSTRATION;}
  | VERIFY_INSPECTION
    { $$=yy.VerifyType.VERIFY_INSPECTION;}
  | VERIFY_TEST
    { $$=yy.VerifyType.VERIFY_TEST;};

elementDef
  : ELEMENT elementName STRUCT_START NEWLINE elementBody { yy.addElement($2) }
  | ELEMENT elementName STYLE_SEPARATOR idList STRUCT_START NEWLINE elementBody { yy.addElement($2); yy.setClass([$2], $4); }
  ;

elementBody
  : TYPE COLONSEP type NEWLINE elementBody
    { yy.setNewElementType($3); }
  | DOCREF COLONSEP ref NEWLINE elementBody
    { yy.setNewElementDocRef($3); }
  | NEWLINE elementBody
  | STRUCT_STOP;

relationshipDef
  : id END_ARROW_L relationship LINE id
    {  yy.addRelationship($3, $5, $1) }
  | id LINE relationship END_ARROW_R id
     { yy.addRelationship($3, $1, $5) };

relationship
  : CONTAINS
      { $$=yy.Relationships.CONTAINS;}
  | COPIES
      { $$=yy.Relationships.COPIES;}
  | DERIVES
      { $$=yy.Relationships.DERIVES;}
  | SATISFIES
      { $$=yy.Relationships.SATISFIES;}
  | VERIFIES
      { $$=yy.Relationships.VERIFIES;}
  | REFINES
      { $$=yy.Relationships.REFINES;}
  | TRACES
      { $$=yy.Relationships.TRACES;};

classDefStatement
  : CLASSDEF idList stylesOpt {$$ = $CLASSDEF;yy.defineClass($idList,$stylesOpt);}
  ;

classStatement
    : CLASS idList idList                            {yy.setClass($2, $3);}
    | id STYLE_SEPARATOR idList {yy.setClass([$1], $3);}
    ;

idList
    : ALPHA { $$ = [$ALPHA]; }
    | idList COMMA ALPHA = { $$ = $idList.concat([$ALPHA]); }
    | id { $$ = [$id]; }
    | idList COMMA id = { $$ = $idList.concat([$id]); }
    ;

styleStatement
  : STYLE idList stylesOpt                              {$$ = $STYLE;yy.setCssStyle($2,$stylesOpt);}
  ;

stylesOpt
    : style {$$ = [$style]}
    | stylesOpt COMMA style {$stylesOpt.push($style);$$ = $stylesOpt;}
    ;

style
    : styleComponent
    | style styleComponent  {$$ = $style + $styleComponent;}
    ;

styleComponent: ALPHA | NUM | COLON | UNIT | SPACE | BRKT | PCT | MINUS | LABEL | SEMICOLON;


requirementName: unqString | qString;
id : unqString | qString;
text : unqString | qString;
elementName : unqString | qString;
type : unqString | qString;
ref : unqString | qString;

%%
