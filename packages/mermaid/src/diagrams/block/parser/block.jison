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


// as per section 6.1 of RFC 2234 [2]
COMMA \u002C
CR \u000D
LF \u000A
CRLF \u000D\u000A


%%

"block-beta"                                             { return 'BLOCK_DIAGRAM_KEY'; }
"block"\s+            { yy.getLogger().info('Found space-block'); return 'block';}
"block"\n+            { yy.getLogger().info('Found nl-block'); return 'block';}
"block:"            { yy.getLogger().info('Found space-block'); return 'id-block';}
// \s*\%\%.*                                                       { yy.getLogger().info('Found comment',yytext); }
[\s]+                                                           { yy.getLogger().info('.', yytext); /* skip all whitespace */  }
[\n]+ {yy.getLogger().info('_', yytext);                 /* skip all whitespace */   }
// [\n]                return 'NL';
<INITIAL>({CRLF}|{LF})                     { return 'NL' }
"columns"\s+"auto"             { yytext=-1; return 'COLUMNS'; }
"columns"\s+[\d]+            { yytext = yytext.replace(/columns\s+/,''); yy.getLogger().info('COLUMNS (LEX)', yytext); return 'COLUMNS'; }
["][`]          { this.pushState("md_string");}
<md_string>[^`"]+        { return "MD_STR";}
<md_string>[`]["]          { this.popState();}
["]                     this.pushState("string");
<string>["]             { log.debug('LEX: POPPING STR:', yytext);this.popState();}
<string>[^"]*           { log.debug('LEX: STR ebd:', yytext); return "STR";}
space[:]\d+            {  yytext = yytext.replace(/space\:/,'');yy.getLogger().info('SPACE NUM (LEX)', yytext); return 'SPACE_BLOCK'; }
space                  { yytext = '1'; yy.getLogger().info('COLUMNS (LEX)', yytext); return 'SPACE_BLOCK'; }
"style"               return 'STYLE';
"default"             return 'DEFAULT';
"linkStyle"           return 'LINKSTYLE';
"interpolate"         return 'INTERPOLATE';
"classDef"            return 'CLASSDEF';
"class"               return 'CLASS';
accTitle\s*":"\s*                                               { this.pushState("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.pushState("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.pushState("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
"subgraph"            return 'subgraph';
"end"\b\s*            return 'end';
.*direction\s+TB[^\n]*                                      return 'direction_tb';
.*direction\s+BT[^\n]*                                      return 'direction_bt';
.*direction\s+RL[^\n]*                                      return 'direction_rl';
.*direction\s+LR[^\n]*                                      return 'direction_lr';

// Start of nodes with shapes and description
"-)"                   { yy.getLogger().info('Lexa: -)'); this.pushState('NODE');return 'NODE_DSTART'; }
"(-"                   { yy.getLogger().info('Lexa: (-'); this.pushState('NODE');return 'NODE_DSTART'; }
"))"                   { yy.getLogger().info('Lexa: ))'); this.pushState('NODE');return 'NODE_DSTART';  }
")"                    { yy.getLogger().info('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART';      }
"(("                   { yy.getLogger().info('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"{{"                   { yy.getLogger().info('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"("                    { yy.getLogger().info('Lexa: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"["                    { yy.getLogger().info('Lexa: ['); this.pushState('NODE');return 'NODE_DSTART'; }
"(["                   { yy.getLogger().info('Lexa: (['); this.pushState('NODE');return 'NODE_DSTART'; }
"[["                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[|"                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[("                   { this.pushState('NODE');return 'NODE_DSTART'; }
"((("                  { this.pushState('NODE');return 'NODE_DSTART'; }
")))"                  { this.pushState('NODE');return 'NODE_DSTART'; }
"[/"                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[\\"                  { this.pushState('NODE');return 'NODE_DSTART'; }

"<["                   { this.pushState('BLOCK_ARROW');log.debug('LEX ARR START');return 'BLOCK_ARROW_START'; }

[^\(\[\n\-\)\{\}\s\<]+     { yy.getLogger().info('Lex: NODE_ID', yytext);return 'NODE_ID'; }
<<EOF>>                { yy.getLogger().info('Lex: EOF', yytext);return 'EOF'; }

// Handling of strings in node
<BLOCK_ARROW>["][`]           { this.pushState("md_string");}
<NODE>["][`]           { this.pushState("md_string");}
<md_string>[^`"]+      { return "NODE_DESCR";}
<md_string>[`]["]      { this.popState();}
<NODE>["]              { yy.getLogger().info('Lex: Starting string');this.pushState("string");}
<BLOCK_ARROW>["]              { yy.getLogger().info('LEX ARR: Starting string');this.pushState("string");}
<string>[^"]+          { log.debug('LEX: NODE_DESCR:', yytext); return "NODE_DESCR";}
<string>["]            {log.debug('LEX POPPING');this.popState();}

// Node end of shape
<NODE>\]\>             { this.popState();yy.getLogger().info('Lex: ]>'); return "NODE_DEND"; }
<NODE>[\)]\)           { this.popState();yy.getLogger().info('Lex: ))'); return "NODE_DEND"; }
<NODE>[\)]             { this.popState();yy.getLogger().info('Lex: )');  return "NODE_DEND"; }
<NODE>[\]]             { this.popState();yy.getLogger().info('Lex: ]'); return "NODE_DEND"; }
<NODE>"}}"             { this.popState();yy.getLogger().info('Lex: (('); return "NODE_DEND"; }
<NODE>"(-"             { this.popState();yy.getLogger().info('Lex: (-'); return "NODE_DEND"; }
<NODE>"-)"             { this.popState();yy.getLogger().info('Lex: -)'); return "NODE_DEND"; }
<NODE>"(("             { this.popState();yy.getLogger().info('Lex: (('); return "NODE_DEND"; }
<NODE>"("              { this.popState();yy.getLogger().info('Lex: (');  return "NODE_DEND";  }
<NODE>"])"             { this.popState();yy.getLogger().info('Lex: ])'); return "NODE_DEND"; }
<NODE>"]]"             { this.popState();yy.getLogger().info('Lex: ]]'); return "NODE_DEND"; }
<NODE>"/]"             { this.popState();yy.getLogger().info('Lex: /]'); return "NODE_DEND"; }
<NODE>")]"             { this.popState();yy.getLogger().info('Lex: )]'); return "NODE_DEND"; }

<BLOCK_ARROW>"]>"\s*"("       { log.debug('Lex: =>BAE');  this.pushState('ARROW_DIR');  }
<ARROW_DIR>","?right\s*           { log.debug('Lex (right): dir:',yytext);return "DIR"; }
<ARROW_DIR>","?left\s*            { log.debug('Lex (left):',yytext);return "DIR"; }
<ARROW_DIR>","?x\s*               { log.debug('Lex (x):',yytext); return "DIR"; }
<ARROW_DIR>","?y\s*               { log.debug('Lex (y):',yytext); return "DIR"; }
<ARROW_DIR>","?up\s*              { log.debug('Lex (up):',yytext); return "DIR"; }
<ARROW_DIR>","?\s*down\s*     { yytext = yytext.replace(/^,\s*/, ''); log.debug('Lex (down):',yytext); return "DIR"; }
<ARROW_DIR>")"\s*             { yytext=']>';log.debug('Lex (ARROW_DIR end):',yytext);this.popState();this.popState();return "BLOCK_ARROW_END"; }

// Edges
\s*[xo<]?\-\-+[-xo>]\s*                 { yy.getLogger().info('Lex: LINK', '#'+yytext+'#'); return 'LINK'; }
\s*[xo<]?\=\=+[=xo>]\s*                 { yy.getLogger().info('Lex: LINK', yytext); return 'LINK'; }
\s*[xo<]?\-?\.+\-[xo>]?\s*              { yy.getLogger().info('Lex: LINK', yytext); return 'LINK'; }
\s*\~\~[\~]+\s*                         { yy.getLogger().info('Lex: LINK', yytext); return 'LINK'; }
\s*[xo<]?\-\-\s*                        { yy.getLogger().info('Lex: START_LINK', yytext); return 'START_LINK'; }
\s*[xo<]?\=\=\s*                        { yy.getLogger().info('Lex: START_LINK', yytext); return 'START_LINK'; }
\s*[xo<]?\-\.\s*                        { yy.getLogger().info('Lex: START_LINK', yytext); return 'START_LINK'; }

/lex

%left '^'
%start start

%% // language grammar

spaceLines
  : SPACELINE
  | spaceLines SPACELINE
  | spaceLines NL
  ;

seperator
  : NL
  {yy.getLogger().info('Rule: seperator (NL) ');}
  | SPACE
  {yy.getLogger().info('Rule: seperator (Space) ');}
  | EOF
    {yy.getLogger().info('Rule: seperator (EOF) ');}
  ;

start: BLOCK_DIAGRAM_KEY document EOF
  { yy.setHierarchy($2); }
  ;


stop
  : NL {yy.getLogger().info('Stop NL ');}
  | EOF {yy.getLogger().info('Stop EOF ');}
  // | SPACELINE
  | stop NL {yy.getLogger().info('Stop NL2 ');}
  | stop EOF {yy.getLogger().info('Stop EOF2 ');}
  ;

//array of statements
document
	: statement { yy.getLogger().info("Rule: statement: ", $1); $$ = [$1]; }
	| statement document { yy.getLogger().info("Rule: document statement: ", $1, $2); $$ = [$1].concat($2); }
	;

link
  : LINK
  { yy.getLogger().info("Rule: link: ", $1); }
  | START_LINK
  { yy.getLogger().info("Rule: link: ", $1); }
  ;

statement
  : nodeStatement
  | columnsStatement
  | SPACE_BLOCK
    { const num=parseInt($1); const spaceId = yy.generateId(); $$ = { id: spaceId, type:'space', label:'', width: num, children: [] }}
  | blockStatement
	;

nodeStatement
  : nodeStatement link node { yy.getLogger().info('Rule: nodeStatement (nodeStatement link node) '); $$ = {id: $1.id}; }
  | node { yy.getLogger().info('Rule: nodeStatement (node) ', $1); $$ = {id: $1.id, label: $1.label, type: yy.typeStr2Type($1.typeStr)}; }
  ;

columnsStatement
  : COLUMNS { yy.getLogger().info("COLUMNS: ", $1); $$ = {type: 'column-setting', columns: $1 === 'auto'?-1:parseInt($1) } }
  ;

blockStatement
  : id-block nodeStatement document end { yy.getLogger().info('Rule: id-block statement : ', $2, $3); const id2 = yy.generateId(); $$ = { ...$2, children: $3 }; }
  | block document end { yy.getLogger().info('Rule: blockStatement : ', $1, $2, $3); const id = yy.generateId(); $$ = { id, type:'composite', label:'', children: $2 }; }
  ;

node
  : NODE_ID
  { yy.getLogger().info("Rule: node (NODE_ID seperator): ", $1); $$ = { id: $1 }; }
  |NODE_ID nodeShapeNLabel
    { yy.getLogger().info("Rule: node (NODE_ID nodeShapeNLabel seperator): ", $1, $2); $$ = { id: $1, label: $2.label, typeStr: $2.typeStr };}
  // |nodeShapeNLabel seperator
  // { yy.getLogger().info("Rule: node (nodeShapeNLabel seperator): ", $1, $2, $3); }
  ;

dirList: DIR { yy.getLogger().info("Rule: dirList: ", $1); $$ = [$1]; }
  | DIR dirList { yy.getLogger().info("Rule: dirList: ", $1, $2); $$ = [$1].concat($2); }
  ;

nodeShapeNLabel
  :   NODE_DSTART STR NODE_DEND
	      { yy.getLogger().info("Rule: nodeShapeNLabel: ", $1, $2, $3); $$ = { typeStr: $1 + $3, label: $2 }; }
	|    BLOCK_ARROW_START STR dirList BLOCK_ARROW_END
    	      { yy.getLogger().info("Rule: BLOCK_ARROW nodeShapeNLabel: ", $1, $2, $3, $4); $$ = { typeStr: $1 + $4, label: $2, directions: $3}; }
  ;

%%
