%lex

%options case-insensitive
%x open_directive type_directive arg_directive block
%x acc_title
%x acc_descr
%x acc_descr_multiline

%%
accTitle\s*":"\s*                                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
\%\%\{                                                          { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)                          { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                                             { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%                            { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)                            return 'arg_directive';
\%%(?!\{)[^\n]*                                                 /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */
[\n]+                           return 'NEWLINE';
\s+                             /* skip whitespace */
[\s]+                           return 'SPACE';
\"[^"%\r\n\v\b\\]+\"            return 'ENTITY_NAME';
\"[^"]*\"                       return 'WORD';
"erDiagram"                     return 'ER_DIAGRAM';
"{"                             { this.begin("block"); return 'BLOCK_START'; }
<block>\s+                      /* skip whitespace in block */
<block>\b((?:PK)|(?:FK)|(?:UK))\b      return 'ATTRIBUTE_KEY'
<block>(.*?)[~](.*?)*[~]        return 'ATTRIBUTE_WORD';
<block>[A-Za-z][A-Za-z0-9\-_\[\]\(\)]*  return 'ATTRIBUTE_WORD'
<block>\"[^"]*\"                return 'COMMENT';
<block>[\n]+                    /* nothing */
<block>"}"                      { this.popState(); return 'BLOCK_STOP'; }
<block>.                        return yytext[0];

"one or zero"                   return 'ZERO_OR_ONE';
"one or more"                   return 'ONE_OR_MORE';
"one or many"                   return 'ONE_OR_MORE';
"1+"                            return 'ONE_OR_MORE';
\|o                             return 'ZERO_OR_ONE';
"zero or one"                   return 'ZERO_OR_ONE';
"zero or more"                  return 'ZERO_OR_MORE';
"zero or many"                  return 'ZERO_OR_MORE';
"0+"                            return 'ZERO_OR_MORE';
\}o                             return 'ZERO_OR_MORE';
"many(0)"                       return 'ZERO_OR_MORE';
"many(1)"                       return 'ONE_OR_MORE';
"many"                          return 'ZERO_OR_MORE';
\}\|                            return 'ONE_OR_MORE';
"one"                           return 'ONLY_ONE';
"only one"                      return 'ONLY_ONE';
"1"                             return 'ONLY_ONE';
\|\|                            return 'ONLY_ONE';
o\|                             return 'ZERO_OR_ONE';
o\{                             return 'ZERO_OR_MORE';
\|\{                            return 'ONE_OR_MORE';
\.\.                            return 'NON_IDENTIFYING';
\-\-                            return 'IDENTIFYING';
"to"                            return 'IDENTIFYING';
"optionally to"                 return 'NON_IDENTIFYING';
\.\-                            return 'NON_IDENTIFYING';
\-\.                            return 'NON_IDENTIFYING';
[A-Za-z][A-Za-z0-9\-_]*         return 'ALPHANUM';
.                               return yytext[0];
<<EOF>>                         return 'EOF';

/lex

%start start
%% /* language grammar */

start
    : 'ER_DIAGRAM' document 'EOF' { /*console.log('finished parsing');*/ }
  	| directive start
    ;

document
	: /* empty */ { $$ = [] }
	| document line {$1.push($2);$$ = $1}
	;

line
	: SPACE statement { $$ = $2 }
	| statement { $$ = $1 }
	| NEWLINE { $$=[];}
	| EOF { $$=[];}
	;

directive
  : openDirective typeDirective closeDirective 'NEWLINE'
  | openDirective typeDirective ':' argDirective closeDirective 'NEWLINE'
  ;

statement
    : directive
    | entityName relSpec entityName ':' role
      {
          yy.addEntity($1);
          yy.addEntity($3);
          yy.addRelationship($1, $5, $3, $2);
          /*console.log($1 + $2 + $3 + ':' + $5);*/
      }
    | entityName BLOCK_START attributes BLOCK_STOP
      {
          /* console.log('detected block'); */
          yy.addEntity($1);
          yy.addAttributes($1, $3);
          /* console.log('handled block'); */
      }
    | entityName BLOCK_START BLOCK_STOP { yy.addEntity($1); }
    | entityName { yy.addEntity($1); }
    | title title_value  { $$=$2.trim();yy.setAccTitle($$); }
    | acc_title acc_title_value  { $$=$2.trim();yy.setAccTitle($$); }
    | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
    | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }
    ;

entityName
    : 'ALPHANUM'      { $$ = $1; }
    | 'ENTITY_NAME'      { $$ = $1.replace(/"/g, ''); }
    ;

attributes
    : attribute { $$ = [$1]; }
    | attribute attributes { $2.push($1); $$=$2; }
    ;

attribute
    : attributeType attributeName { $$ = { attributeType: $1, attributeName: $2 }; }
    | attributeType attributeName attributeKeyType { $$ = { attributeType: $1, attributeName: $2, attributeKeyType: $3 }; }
    | attributeType attributeName attributeComment { $$ = { attributeType: $1, attributeName: $2, attributeComment: $3 }; }
    | attributeType attributeName attributeKeyType attributeComment { $$ = { attributeType: $1, attributeName: $2, attributeKeyType: $3, attributeComment: $4 }; }
    ;

attributeType
    : ATTRIBUTE_WORD { $$=$1; }
    ;

attributeName
    : ATTRIBUTE_WORD { $$=$1; }
    ;

attributeKeyType
    : ATTRIBUTE_KEY { $$=$1; }
    ;

attributeComment
    : COMMENT { $$=$1.replace(/"/g, ''); }
    ;

relSpec
    : cardinality relType cardinality
      {
        $$ = { cardA: $3, relType: $2, cardB: $1 };
        /*console.log('relSpec: ' + $3 + $2 + $1);*/
      }
    ;

cardinality
    : 'ZERO_OR_ONE'                  { $$ = yy.Cardinality.ZERO_OR_ONE; }
    | 'ZERO_OR_MORE'                 { $$ = yy.Cardinality.ZERO_OR_MORE; }
    | 'ONE_OR_MORE'                  { $$ = yy.Cardinality.ONE_OR_MORE; }
    | 'ONLY_ONE'                     { $$ = yy.Cardinality.ONLY_ONE; }
    ;

relType
    : 'NON_IDENTIFYING'              { $$ = yy.Identification.NON_IDENTIFYING;  }
    | 'IDENTIFYING'                  { $$ = yy.Identification.IDENTIFYING; }
    ;

role
    : 'WORD'      { $$ = $1.replace(/"/g, ''); }
    | 'ENTITY_NAME' { $$ = $1.replace(/"/g, ''); }
    | 'ALPHANUM'  { $$ = $1; }
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
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'er'); }
  ;

%%
