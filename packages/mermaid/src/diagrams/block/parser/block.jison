/** mermaid */

//---------------------------------------------------------
// We support csv format as defined here:
// https://www.ietf.org/rfc/rfc4180.txt
// There are some minor changes for compliance with jison
// We also parse only 3 columns: source,target,value
// And allow blank lines for visual purposes
//---------------------------------------------------------

%lex
%x acc_title
%x acc_descr
%x acc_descr_multiline
%x string
%x space
%x md_string
%x NODE
%x BLOCK_ARROW
%x ARROW_DIR
%x LLABEL
%x CLASS
%x CLASS_STYLE
%x CLASSDEF
%x CLASSDEFID
%x STYLE_STMNT
%x STYLE_DEFINITION


// as per section 6.1 of RFC 2234 [2]
COMMA \u002C
CR \u000D
LF \u000A
CRLF \u000D\u000A


%%

"block-beta"                                             { return 'BLOCK_DIAGRAM_KEY'; }
"block"\s+            { yy.getLogger().debug('Found space-block'); return 'block';}
"block"\n+            { yy.getLogger().debug('Found nl-block'); return 'block';}
"block:"            { yy.getLogger().debug('Found space-block'); return 'id-block';}
// \s*\%\%.*                                                       { yy.getLogger().debug('Found comment',yytext); }
[\s]+                                                           { yy.getLogger().debug('.', yytext); /* skip all whitespace */  }
[\n]+ {yy.getLogger().debug('_', yytext);                 /* skip all whitespace */   }
// [\n]                return 'NL';
<INITIAL>({CRLF}|{LF})                     { return 'NL' }
"columns"\s+"auto"             { yytext=-1; return 'COLUMNS'; }
"columns"\s+[\d]+            { yytext = yytext.replace(/columns\s+/,''); yy.getLogger().debug('COLUMNS (LEX)', yytext); return 'COLUMNS'; }
["][`]          { this.pushState("md_string");}
<md_string>[^`"]+        { return "MD_STR";}
<md_string>[`]["]          { this.popState();}
["]                     this.pushState("string");
<string>["]             { yy.getLogger().debug('LEX: POPPING STR:', yytext);this.popState();}
<string>[^"]*           { yy.getLogger().debug('LEX: STR end:', yytext); return "STR";}
space[:]\d+            {  yytext = yytext.replace(/space\:/,'');yy.getLogger().debug('SPACE NUM (LEX)', yytext); return 'SPACE_BLOCK'; }
space                  { yytext = '1'; yy.getLogger().debug('COLUMNS (LEX)', yytext); return 'SPACE_BLOCK'; }
"default"             return 'DEFAULT';
"linkStyle"           return 'LINKSTYLE';
"interpolate"         return 'INTERPOLATE';

"classDef"\s+   { this.pushState('CLASSDEF'); return 'classDef'; }
<CLASSDEF>DEFAULT\s+            { this.popState(); this.pushState('CLASSDEFID'); return 'DEFAULT_CLASSDEF_ID' }
<CLASSDEF>\w+\s+                { this.popState(); this.pushState('CLASSDEFID'); return 'CLASSDEF_ID' }
<CLASSDEFID>[^\n]*              { this.popState(); return 'CLASSDEF_STYLEOPTS' }

"class"\s+      { this.pushState('CLASS'); return 'class'; }
<CLASS>(\w+)+((","\s*\w+)*)     { this.popState(); this.pushState('CLASS_STYLE'); return 'CLASSENTITY_IDS' }
<CLASS_STYLE>[^\n]*             { this.popState(); return 'STYLECLASS' }

"style"\s+      { this.pushState('STYLE_STMNT'); return 'style'; }
<STYLE_STMNT>(\w+)+((","\s*\w+)*)     { this.popState(); this.pushState('STYLE_DEFINITION'); return 'STYLE_ENTITY_IDS' }
<STYLE_DEFINITION>[^\n]*             { this.popState(); return 'STYLE_DEFINITION_DATA' }

accTitle\s*":"\s*                                               { this.pushState("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.pushState("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.pushState("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
"end"\b\s*            return 'end';

// Node end of shape
<NODE>"((("             { this.popState();yy.getLogger().debug('Lex: (('); return "NODE_DEND"; }
<NODE>")))"             { this.popState();yy.getLogger().debug('Lex: (('); return "NODE_DEND"; }
<NODE>[\)]\)           { this.popState();yy.getLogger().debug('Lex: ))'); return "NODE_DEND"; }
<NODE>"}}"             { this.popState();yy.getLogger().debug('Lex: (('); return "NODE_DEND"; }
<NODE>"}"             { this.popState();yy.getLogger().debug('Lex: (('); return "NODE_DEND"; }
<NODE>"(-"             { this.popState();yy.getLogger().debug('Lex: (-'); return "NODE_DEND"; }
<NODE>"-)"             { this.popState();yy.getLogger().debug('Lex: -)'); return "NODE_DEND"; }
<NODE>"(("             { this.popState();yy.getLogger().debug('Lex: (('); return "NODE_DEND"; }
<NODE>"]]"             { this.popState();yy.getLogger().debug('Lex: ]]'); return "NODE_DEND"; }
<NODE>"("              { this.popState();yy.getLogger().debug('Lex: (');  return "NODE_DEND";  }
<NODE>"])"             { this.popState();yy.getLogger().debug('Lex: ])'); return "NODE_DEND"; }
<NODE>"\\]"             { this.popState();yy.getLogger().debug('Lex: /]'); return "NODE_DEND"; }
<NODE>"/]"             { this.popState();yy.getLogger().debug('Lex: /]'); return "NODE_DEND"; }
<NODE>")]"             { this.popState();yy.getLogger().debug('Lex: )]'); return "NODE_DEND"; }
<NODE>[\)]             { this.popState();yy.getLogger().debug('Lex: )');  return "NODE_DEND"; }
<NODE>\]\>             { this.popState();yy.getLogger().debug('Lex: ]>'); return "NODE_DEND"; }
<NODE>[\]]             { this.popState();yy.getLogger().debug('Lex: ]'); return "NODE_DEND"; }

// Start of nodes with shapes and description
"-)"                   { yy.getLogger().debug('Lexa: -)'); this.pushState('NODE');return 'NODE_DSTART'; }
"(-"                   { yy.getLogger().debug('Lexa: (-'); this.pushState('NODE');return 'NODE_DSTART'; }
"))"                   { yy.getLogger().debug('Lexa: ))'); this.pushState('NODE');return 'NODE_DSTART';  }
")"                    { yy.getLogger().debug('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART';      }
"((("                  { yy.getLogger().debug('Lex: (((');  this.pushState('NODE');return 'NODE_DSTART'; }
"(("                   { yy.getLogger().debug('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"{{"                   { yy.getLogger().debug('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"{"                   { yy.getLogger().debug('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART'; }
">"                   { yy.getLogger().debug('Lexc: >'); this.pushState('NODE');return 'NODE_DSTART'; }
"(["                   { yy.getLogger().debug('Lexa: (['); this.pushState('NODE');return 'NODE_DSTART'; }
"("                    { yy.getLogger().debug('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"[["                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[|"                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[("                   { this.pushState('NODE');return 'NODE_DSTART'; }
")))"                  { this.pushState('NODE');return 'NODE_DSTART'; }
"[\\"                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[/"                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[\\"                  { this.pushState('NODE');return 'NODE_DSTART'; }
"["                    { yy.getLogger().debug('Lexa: ['); this.pushState('NODE');return 'NODE_DSTART'; }

"<["                   { this.pushState('BLOCK_ARROW');yy.getLogger().debug('LEX ARR START');return 'BLOCK_ARROW_START'; }

[^\(\[\n\-\)\{\}\s\<\>:]+     { yy.getLogger().debug('Lex: NODE_ID', yytext);return 'NODE_ID'; }
<<EOF>>                { yy.getLogger().debug('Lex: EOF', yytext);return 'EOF'; }

// Handling of strings in node
<BLOCK_ARROW>["][`]           { this.pushState("md_string");}
<NODE>["][`]           { this.pushState("md_string");}
<md_string>[^`"]+      { return "NODE_DESCR";}
<md_string>[`]["]      { this.popState();}
<NODE>["]              { yy.getLogger().debug('Lex: Starting string');this.pushState("string");}
<BLOCK_ARROW>["]              { yy.getLogger().debug('LEX ARR: Starting string');this.pushState("string");}
<string>[^"]+          { yy.getLogger().debug('LEX: NODE_DESCR:', yytext); return "NODE_DESCR";}
<string>["]            {yy.getLogger().debug('LEX POPPING');this.popState();}

<BLOCK_ARROW>"]>"\s*"("       { yy.getLogger().debug('Lex: =>BAE');  this.pushState('ARROW_DIR');  }
<ARROW_DIR>","?\s*right\s*           { yytext = yytext.replace(/^,\s*/, ''); yy.getLogger().debug('Lex (right): dir:',yytext);return "DIR"; }
<ARROW_DIR>","?\s*left\s*            { yytext = yytext.replace(/^,\s*/, ''); yy.getLogger().debug('Lex (left):',yytext);return "DIR"; }
<ARROW_DIR>","?\s*x\s*               { yytext = yytext.replace(/^,\s*/, ''); yy.getLogger().debug('Lex (x):',yytext); return "DIR"; }
<ARROW_DIR>","?\s*y\s*               { yytext = yytext.replace(/^,\s*/, ''); yy.getLogger().debug('Lex (y):',yytext); return "DIR"; }
<ARROW_DIR>","?\s*up\s*              { yytext = yytext.replace(/^,\s*/, ''); yy.getLogger().debug('Lex (up):',yytext); return "DIR"; }
<ARROW_DIR>","?\s*down\s*     { yytext = yytext.replace(/^,\s*/, ''); yy.getLogger().debug('Lex (down):',yytext); return "DIR"; }
<ARROW_DIR>")"\s*             { yytext=']>';yy.getLogger().debug('Lex (ARROW_DIR end):',yytext);this.popState();this.popState();return "BLOCK_ARROW_END"; }

// Edges
\s*[xo<]?\-\-+[-xo>]\s*                 { yy.getLogger().debug('Lex: LINK', '#'+yytext+'#'); return 'LINK'; }
\s*[xo<]?\=\=+[=xo>]\s*                 { yy.getLogger().debug('Lex: LINK', yytext); return 'LINK'; }
\s*[xo<]?\-?\.+\-[xo>]?\s*              { yy.getLogger().debug('Lex: LINK', yytext); return 'LINK'; }
\s*\~\~[\~]+\s*                         { yy.getLogger().debug('Lex: LINK', yytext); return 'LINK'; }
\s*[xo<]?\-\-\s*                        { yy.getLogger().debug('Lex: START_LINK', yytext);this.pushState("LLABEL");return 'START_LINK'; }
\s*[xo<]?\=\=\s*                        { yy.getLogger().debug('Lex: START_LINK', yytext);this.pushState("LLABEL");return 'START_LINK'; }
\s*[xo<]?\-\.\s*                        { yy.getLogger().debug('Lex: START_LINK', yytext);this.pushState("LLABEL");return 'START_LINK'; }
<LLABEL>["][`]           { this.pushState("md_string");}
<LLABEL>["]              { yy.getLogger().debug('Lex: Starting string');this.pushState("string"); return "LINK_LABEL";}
<LLABEL>\s*[xo<]?\-\-+[-xo>]\s*                 { this.popState(); yy.getLogger().debug('Lex: LINK', '#'+yytext+'#'); return 'LINK'; }
<LLABEL>\s*[xo<]?\=\=+[=xo>]\s*                 { this.popState(); yy.getLogger().debug('Lex: LINK', yytext); return 'LINK'; }
<LLABEL>\s*[xo<]?\-?\.+\-[xo>]?\s*              { this.popState(); yy.getLogger().debug('Lex: LINK', yytext); return 'LINK'; }
':'\d+                   { yy.getLogger().debug('Lex: COLON', yytext); yytext=yytext.slice(1);return 'SIZE'; }

/lex

%left '^'
%start start

%% // language grammar

spaceLines
  : SPACELINE
  | spaceLines SPACELINE
  | spaceLines NL
  ;

separator
  : NL
  {yy.getLogger().debug('Rule: separator (NL) ');}
  | SPACE
  {yy.getLogger().debug('Rule: separator (Space) ');}
  | EOF
    {yy.getLogger().debug('Rule: separator (EOF) ');}
  ;

start: BLOCK_DIAGRAM_KEY document EOF
  { yy.getLogger().debug("Rule: hierarchy: ", $2); yy.setHierarchy($2); }
  ;


stop
  : NL {yy.getLogger().debug('Stop NL ');}
  | EOF {yy.getLogger().debug('Stop EOF ');}
  // | SPACELINE
  | stop NL {yy.getLogger().debug('Stop NL2 ');}
  | stop EOF {yy.getLogger().debug('Stop EOF2 ');}
  ;

//array of statements
document
	: statement { yy.getLogger().debug("Rule: statement: ", $1); typeof $1.length === 'number'?$$ = $1:$$ = [$1]; }
	| statement document { yy.getLogger().debug("Rule: statement #2: ", $1); $$ = [$1].concat($2); }
	;

link
  : LINK
  { yy.getLogger().debug("Rule: link: ", $1, yytext); $$={edgeTypeStr: $1, label:''}; }
  | START_LINK LINK_LABEL STR LINK
  { yy.getLogger().debug("Rule: LABEL link: ", $1, $3, $4); $$={edgeTypeStr: $4, label:$3}; }
  ;

statement
  : nodeStatement
  | columnsStatement
  | SPACE_BLOCK
    { const num=parseInt($1); const spaceId = yy.generateId(); $$ = { id: spaceId, type:'space', label:'', width: num, children: [] }}
  | blockStatement
  | classDefStatement
  | cssClassStatement
  | styleStatement
	;

nodeStatement
  : nodeStatement link node {
    yy.getLogger().debug('Rule: (nodeStatement link node) ', $1, $2, $3, ' typestr: ',$2.edgeTypeStr);
    const edgeData = yy.edgeStrToEdgeData($2.edgeTypeStr)
    $$ = [
      {id: $1.id, label: $1.label, type:$1.type, directions: $1.directions},
      {id: $1.id + '-' + $3.id, start: $1.id, end: $3.id, label: $2.label, type: 'edge', directions: $3.directions, arrowTypeEnd: edgeData, arrowTypeStart: 'arrow_open' },
      {id: $3.id, label: $3.label, type: yy.typeStr2Type($3.typeStr), directions: $3.directions}
      ];
    }
  | node SIZE { yy.getLogger().debug('Rule: nodeStatement (abc88 node size) ', $1, $2); $$ = {id: $1.id, label: $1.label, type: yy.typeStr2Type($1.typeStr), directions: $1.directions, widthInColumns: parseInt($2,10)}; }
  | node { yy.getLogger().debug('Rule: nodeStatement (node) ', $1); $$ = {id: $1.id, label: $1.label, type: yy.typeStr2Type($1.typeStr), directions: $1.directions, widthInColumns:1}; }
  ;


columnsStatement
  : COLUMNS { yy.getLogger().debug('APA123', this? this:'na'); yy.getLogger().debug("COLUMNS: ", $1); $$ = {type: 'column-setting', columns: $1 === 'auto'?-1:parseInt($1) } }
  ;

blockStatement
  : id-block nodeStatement document end { yy.getLogger().debug('Rule: id-block statement : ', $2, $3); const id2 = yy.generateId(); $$ = { ...$2, type:'composite', children: $3 }; }
  | block document end { yy.getLogger().debug('Rule: blockStatement : ', $1, $2, $3); const id = yy.generateId(); $$ = { id, type:'composite', label:'', children: $2 }; }
  ;

node
  : NODE_ID
  { yy.getLogger().debug("Rule: node (NODE_ID separator): ", $1); $$ = { id: $1 }; }
  | NODE_ID nodeShapeNLabel
  {
    yy.getLogger().debug("Rule: node (NODE_ID nodeShapeNLabel separator): ", $1, $2);
    $$ = { id: $1, label: $2.label, typeStr: $2.typeStr, directions: $2.directions };
  }
  ;

dirList: DIR { yy.getLogger().debug("Rule: dirList: ", $1); $$ = [$1]; }
  | DIR dirList { yy.getLogger().debug("Rule: dirList: ", $1, $2); $$ = [$1].concat($2); }
  ;

nodeShapeNLabel
  :   NODE_DSTART STR NODE_DEND
	      { yy.getLogger().debug("Rule: nodeShapeNLabel: ", $1, $2, $3); $$ = { typeStr: $1 + $3, label: $2 }; }
	|    BLOCK_ARROW_START STR dirList BLOCK_ARROW_END
    	      { yy.getLogger().debug("Rule: BLOCK_ARROW nodeShapeNLabel: ", $1, $2, " #3:",$3, $4); $$ = { typeStr: $1 + $4, label: $2, directions: $3}; }
  ;


classDefStatement
  : classDef CLASSDEF_ID CLASSDEF_STYLEOPTS {
      $$ = { type: 'classDef', id: $2.trim(), css: $3.trim() };
      }
  | classDef DEFAULT CLASSDEF_STYLEOPTS {
      $$ = { type: 'classDef', id: $2.trim(), css: $3.trim() };
      }
  ;

cssClassStatement
    : class CLASSENTITY_IDS STYLECLASS {
        //log.debug('apply class: id(s): ',$2, '  style class: ', $3);
        $$={ type: 'applyClass', id: $2.trim(), styleClass: $3.trim() };
        }
    ;

styleStatement
    : style STYLE_ENTITY_IDS STYLE_DEFINITION_DATA {
        $$={ type: 'applyStyles', id: $2.trim(), stylesStr: $3.trim() };
        }
    ;

%%
