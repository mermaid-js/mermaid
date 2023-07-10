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
%x md_string
%x NODE
%options easy_keword_rules


// as per section 6.1 of RFC 2234 [2]
COMMA \u002C
CR \u000D
LF \u000A
CRLF \u000D\u000A


%%

"block-beta"                                             { return 'BLOCK_DIAGRAM_KEY'; }
// \s*\%\%.*                                                       { yy.getLogger().info('Found comment',yytext); }
[\s]+                                                           { yy.getLogger().info('.', yytext); /* skip all whitespace */  }
[\n]+ {yy.getLogger().info('_', yytext);                 /* skip all whitespace */   }
// [\n]                return 'NL';
<INITIAL>({CRLF}|{LF})                     { return 'NL' }
["][`]          { this.pushState("md_string");}
<md_string>[^`"]+        { return "MD_STR";}
<md_string>[`]["]          { this.popState();}
["]                     this.pushState("string");
<string>["]             this.popState();
<string>[^"]*           return "STR";
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
"-)"                   { yy.getLogger().info('Lex: -)'); this.pushState('NODE');return 'NODE_D START'; }
"(-"                   { yy.getLogger().info('Lex: (-'); this.pushState('NODE');return 'NODE_DSTART';           }
"))"                   { yy.getLogger().info('Lex: ))'); this.pushState('NODE');return 'NODE_DSTART';  }
")"                    { yy.getLogger().info('Lex: )'); this.pushState('NODE');return 'NODE_DSTART';      }
"(("                   { yy.getLogger().info('Lex: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"{{"                   { yy.getLogger().info('Lex: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"("                    { yy.getLogger().info('Lex: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"["                    { yy.getLogger().info('Lex: ['); this.pushState('NODE');return 'NODE_DSTART'; }
"(["                   { yy.getLogger().info('Lex: )'); this.pushState('NODE');return 'NODE_DSTART'; }
"[["                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[|"                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[("                   { this.pushState('NODE');return 'NODE_DSTART'; }
"((("                  { this.pushState('NODE');return 'NODE_DSTART'; }
")))"                  { this.pushState('NODE');return 'NODE_DSTART'; }
"[/"                   { this.pushState('NODE');return 'NODE_DSTART'; }
"[\\"                  { this.pushState('NODE');return 'NODE_DSTART'; }


[^\(\[\n\-\)\{\}]+     { yy.getLogger().info('Lex: NODE_ID', yytext);return 'NODE_ID'; }
<<EOF>>                { yy.getLogger().info('Lex: EOF', yytext);return 'EOF'; }

// Handling of strings in node
<NODE>["][`]           { this.pushState("md_string");}
<md_string>[^`"]+      { return "NODE_DESCR";}
<md_string>[`]["]      { this.popState();}
<NODE>["]              { yy.getLogger().info('Lex: Starting string');this.pushState("string");}
<string>[^"]+          { yy.getLogger().info('Lex: NODE_DESCR:', yytext); return "NODE_DESCR";}
<string>["]            {this.popState();}

// Node end of shape
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

// Edges
\s*[xo<]?\-\-+[-xo>]\s*                 { yy.getLogger().info('Lex: LINK', '#'+yytext+'#'); return 'LINK'; }
\s*[xo<]?\=\=+[=xo>]\s*                 { yy.getLogger().info('Lex: LINK', yytext); return 'LINK'; }
\s*[xo<]?\-?\.+\-[xo>]?\s*              { yy.getLogger().info('Lex: LINK', yytext); return 'LINK'; }
\s*\~\~[\~]+\s*                         { yy.getLogger().info('Lex: LINK', yytext); return 'LINK'; }
\s*[xo<]?\-\-\s*                        { yy.getLogger().info('Lex: START_LINK', yytext); return 'START_LINK'; }
\s*[xo<]?\=\=\s*                        { yy.getLogger().info('Lex: START_LINK', yytext); return 'START_LINK'; }
\s*[xo<]?\-\.\s*                        { yy.getLogger().info('Lex: START_LINK', yytext); return 'START_LINK'; }

/lex

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

start: BLOCK_DIAGRAM_KEY document;

blockDiagram
  : blockDiagram document  { return yy; }
  | blockDiagram NL document  { return yy; }
  ;

stop
  : NL {yy.getLogger().info('Stop NL ');}
  | EOF {yy.getLogger().info('Stop EOF ');}
  // | SPACELINE
  | stop NL {yy.getLogger().info('Stop NL2 ');}
  | stop EOF {yy.getLogger().info('Stop EOF2 ');}
  ;

document
	: document statement
	| statement
	;

link
  : LINK
  { yy.getLogger().info("Rule: link: ", $1); }
  | START_LINK
  { yy.getLogger().info("Rule: link: ", $1); }
  ;

statement
  : nodeStatement
//   SPACELIST node       { yy.getLogger().info('Node: ',$2.id);yy.addNode($1.length, $2.id, $2.descr, $2.type);  }
// 	| SPACELIST ICON       { yy.getLogger().info('Icon: ',$2);yy.decorateNode({icon: $2}); }
// 	| SPACELIST CLASS      { yy.decorateNode({class: $2}); }
//   | SPACELINE { yy.getLogger().info('SPACELIST');}
// 	|
//    node					       { yy.getLogger().info('Node: ',$1.id);yy.addNode(0, $1.id, $1.descr, $1.type);  }
// 	| ICON                 { yy.decorateNode({icon: $1}); }
// 	| CLASS                { yy.decorateNode({class: $1}); }
//   // | SPACELIST
  | EOF
	;

nodeStatement: nodeStatement link node { yy.getLogger().info('Rule: nodeStatement (nodeStatement link node) ');}
    |node { yy.getLogger().info('Rule: nodeStatement (node) ');}
    ;

node
  : NODE_ID
  { yy.getLogger().info("Rule: node (NODE_ID seperator): ", $1); }
  |NODE_ID nodeShapeNLabel
    { yy.getLogger().info("Rule: node (NODE_ID nodeShapeNLabel seperator): ", $1, $2); }
  // |nodeShapeNLabel seperator
  // { yy.getLogger().info("Rule: node (nodeShapeNLabel seperator): ", $1, $2, $3); }
  ;

nodeShapeNLabel
  :   NODE_DSTART STR NODE_DEND
	      { yy.getLogger().info("Rule: nodeShapeNLabel: ", $1, $2, $3); $$ = { type: $1 + $3, descr: $2 }; }
  ;

%%
