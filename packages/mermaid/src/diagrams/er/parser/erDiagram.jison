%lex

%options case-insensitive
%x block
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
[\n]+                           return 'NEWLINE';
\s+                             /* skip whitespace */
[\s]+                           return 'SPACE';
\"[^"%\r\n\v\b\\]+\"            return 'ENTITY_NAME';
\"[^"]*\"                       return 'WORD';
"erDiagram"                     return 'ER_DIAGRAM';
"{"                             { this.begin("block"); return 'BLOCK_START'; }
<block>","                      return 'COMMA';
<block>\s+                      /* skip whitespace in block */
<block>\b((?:PK)|(?:FK)|(?:UK))\b      return 'ATTRIBUTE_KEY'
<block>(.*?)[~](.*?)*[~]        return 'ATTRIBUTE_WORD';
<block>[\*A-Za-z_][A-Za-z0-9\-_\[\]\(\)]*  return 'ATTRIBUTE_WORD'
<block>\"[^"]*\"                return 'COMMENT';
<block>[\n]+                    /* nothing */
<block>"}"                      { this.popState(); return 'BLOCK_STOP'; }
<block>.                        return yytext[0];
"["                             return 'SQS';
"]"                             return 'SQE';

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
\s*u                            return 'MD_PARENT';
\.\.                            return 'NON_IDENTIFYING';
\-\-                            return 'IDENTIFYING';
"to"                            return 'IDENTIFYING';
"optionally to"                 return 'NON_IDENTIFYING';
\.\-                            return 'NON_IDENTIFYING';
\-\.                            return 'NON_IDENTIFYING';
[A-Za-z_][A-Za-z0-9\-_]*        return 'ALPHANUM';
.                               return yytext[0];
<<EOF>>                         return 'EOF';

/lex

%start start
%% /* language grammar */

start
    : 'ER_DIAGRAM' document 'EOF' { /*console.log('finished parsing');*/ }
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


statement
    : entityName relSpec entityName ':' role
      {
          yy.addEntity($1);
          yy.addEntity($3);
          yy.addRelationship($1, $5, $3, $2);
      }
    | entityName BLOCK_START attributes BLOCK_STOP
      {
          yy.addEntity($1);
          yy.addAttributes($1, $3);
      }
    | entityName BLOCK_START BLOCK_STOP { yy.addEntity($1); }
    | entityName { yy.addEntity($1); }
    | entityName SQS entityName SQE BLOCK_START attributes BLOCK_STOP
      {
          yy.addEntity($1, $3);
          yy.addAttributes($1, $6);
      }
    | entityName SQS entityName SQE BLOCK_START BLOCK_STOP { yy.addEntity($1, $3); }
    | entityName SQS entityName SQE { yy.addEntity($1, $3); }
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
    | attributeType attributeName attributeKeyTypeList { $$ = { attributeType: $1, attributeName: $2, attributeKeyTypeList: $3 }; }
    | attributeType attributeName attributeComment { $$ = { attributeType: $1, attributeName: $2, attributeComment: $3 }; }
    | attributeType attributeName attributeKeyTypeList attributeComment { $$ = { attributeType: $1, attributeName: $2, attributeKeyTypeList: $3, attributeComment: $4 }; }
    ;


attributeType
    : ATTRIBUTE_WORD { $$=$1; }
    ;

attributeName
    : ATTRIBUTE_WORD { $$=$1; }
    ;

attributeKeyTypeList
    : attributeKeyType { $$ = [$1]; }
    | attributeKeyTypeList COMMA attributeKeyType { $1.push($3); $$ = $1; }
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
    | 'MD_PARENT'                     { $$ = yy.Cardinality.MD_PARENT; }
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

%%
