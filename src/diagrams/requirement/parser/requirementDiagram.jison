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
%x open_directive
%x type_directive
%x arg_directive
%x close_directive

%%
\%\%\{                                                          { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)                          { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                                             { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%                            { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)                            return 'arg_directive';

(\r?\n)+                               return 'NEWLINE';
\s+                                    /* skip all whitespace */
\#[^\n]*                               /* skip comments */
\%%[^\n]*                              /* skip comments */
<<EOF>>                               return 'EOF';

"requirementDiagram"        return 'RD';

"{"                         return 'STRUCT_START';
"}"                         return 'STRUCT_STOP';
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

"<-"        return 'END_ARROW_L';
"->"        {return 'END_ARROW_R';}
"-"         {return 'LINE';}

["]                 { this.begin("string"); }
<string>["]         { this.popState(); }
<string>[^"]*       { return "qString"; }

[\w][^\r\n\{\<\>\-\=]*                { yytext = yytext.trim(); return 'unqString';}

/lex

%start start

%% /* language grammar */

start
  : directive NEWLINE start
  | directive start
  | RD NEWLINE diagram EOF;

directive
  : openDirective typeDirective closeDirective
  | openDirective typeDirective ':' argDirective closeDirective;

openDirective
  : open_directive { yy.parseDirective('%%{', 'open_directive'); };

typeDirective
  : type_directive { yy.parseDirective($1, 'type_directive'); };

argDirective
  : arg_directive { $1 = $1.trim().replace(/'/g, '"'); yy.parseDirective($1, 'arg_directive'); };

closeDirective
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'pie'); };

diagram
  : /* empty */ { $$ = [] }
  | requirementDef diagram
  | elementDef diagram
  | relationshipDef diagram
  | directive diagram
  | NEWLINE diagram;

requirementDef
  : requirementType requirementName STRUCT_START NEWLINE requirementBody
    { yy.addRequirement($2, $1) };

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
  : ELEMENT elementName STRUCT_START NEWLINE elementBody
    { yy.addElement($2) };

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

requirementName: unqString | qString;
id : unqString | qString;
text : unqString | qString;
elementName : unqString | qString;
type : unqString | qString;
ref : unqString | qString;

%%
