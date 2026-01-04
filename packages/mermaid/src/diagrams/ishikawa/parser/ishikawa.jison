/** mermaid
 *  https://knsv.github.io/mermaid
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}
%x NODE
%x NSTR
%x NSTR2
%x ICON
%x CLASS
%x QUOTED

%%

\s*\%\%.*          {yy.getLogger().trace('Found comment',yytext); return 'SPACELINE';}
// \%\%[^\n]*\n                             /* skip comments */
"ishikawa"		       return 'ISHIKAWA';
"problem"		       return 'PROBLEM';
"category"		       return 'CATEGORY';
":::"              { this.begin('CLASS'); }
<CLASS>.+			     { this.popState();return 'CLASS'; }
<CLASS>\n				   { this.popState();}
// [\s]*"::icon("   { this.begin('ICON'); }
"::icon("   { yy.getLogger().trace('Begin icon');this.begin('ICON'); }
[\s]+[\n]     {yy.getLogger().trace('SPACELINE');return 'SPACELINE'                 /* skip all whitespace */    ;}
[\n]+               return 'NL';
<ICON>[^\)]+			 { return 'ICON'; }
<ICON>\)				   {yy.getLogger().trace('end icon');this.popState();}
"-)"               { yy.getLogger().trace('Exploding node'); this.begin('NODE');return 'NODE_DSTART'; }
"(-"               { yy.getLogger().trace('Cloud'); this.begin('NODE');return 'NODE_DSTART'; }
"))"               { yy.getLogger().trace('Explosion Bang'); this.begin('NODE');return 'NODE_DSTART'; }
")"               { yy.getLogger().trace('Cloud Bang'); this.begin('NODE');return 'NODE_DSTART'; }
"(("               { this.begin('NODE');return 'NODE_DSTART'; }
"{{"               { this.begin('NODE');return 'NODE_DSTART'; }
"("                { this.begin('NODE');return 'NODE_DSTART'; }
"["                { this.begin('NODE');return 'NODE_DSTART'; }
\"([^\\"]|\\\")*\"         { yytext = yytext.slice(1, -1).replace(/\\\"/g, '"'); return 'NODE_ID'; }
[\s]+              return 'SPACELIST'                 /* skip all whitespace */    ;
// !(-\()            return 'NODE_ID';
[^\(\[\n\)\{\}\s]+         return 'NODE_ID';
<<EOF>>            return 'EOF';
<NODE>["][`]          { this.begin("NSTR2");}
<NSTR2>[^`"]+        { return "NODE_DESCR";}
<NSTR2>[`]["]          { this.popState();}
<NODE>["]          { yy.getLogger().trace('Starting NSTR');this.begin("NSTR");}
<NSTR>[^"]+        { yy.getLogger().trace('description:', yytext); return "NODE_DESCR";}
<NSTR>["]          {this.popState();}
<NODE>[\)]\)         {this.popState();yy.getLogger().trace('node end ))');return "NODE_DEND";}
<NODE>[\)]         {this.popState();yy.getLogger().trace('node end )');return "NODE_DEND";}
<NODE>[\]]         {this.popState();yy.getLogger().trace('node end ...',yytext);return "NODE_DEND";}
<NODE>"}}"         {this.popState();yy.getLogger().trace('node end ((');return "NODE_DEND";}
<NODE>"(-"         {this.popState();yy.getLogger().trace('node end (-');return "NODE_DEND";}
<NODE>"-)"         {this.popState();yy.getLogger().trace('node end (-');return "NODE_DEND";}
<NODE>"(("         {this.popState();yy.getLogger().trace('node end ((');return "NODE_DEND";}
<NODE>"("          {this.popState();yy.getLogger().trace('node end ((');return "NODE_DEND";}
<NODE>[^\)\]\(\}]+     { yy.getLogger().trace('Long description:', yytext);   return 'NODE_DESCR';}
<NODE>.+(?!\(\()     { yy.getLogger().trace('Long description:', yytext);   return 'NODE_DESCR';}
// [\[]               return 'NODE_START';
// .+                 return 'TXT' ;

/lex

%start start

%% /* language grammar */

start
// %{	: info document 'EOF' { return yy; } }
	: ishikawaDiagram
  |	spaceLines ishikawaDiagram
  ;

spaceLines
  : SPACELINE
  | NL
  | SPACELIST
  | spaceLines SPACELINE
  | spaceLines NL
  | spaceLines SPACELIST
  ;

ishikawaDiagram
  : ISHIKAWA document  { return yy; }
  | ISHIKAWA NL document  { return yy; }
  | ISHIKAWA EOF  { return yy; }
  | ISHIKAWA NL EOF  { return yy; }
  ;

stop
  : NL {yy.getLogger().trace('Stop NL ');}
  | EOF {yy.getLogger().trace('Stop EOF ');}
  | SPACELINE
  | stop NL {yy.getLogger().trace('Stop NL2 ');}
  | stop EOF {yy.getLogger().trace('Stop EOF2 ');}
  ;
document
	: document statement stop
	| statement stop
	;

statement
	: SPACELIST problemStatement       { yy.getLogger().info('Problem: ',$2);yy.setProblemStatement($2);  }
	| SPACELIST categoryStatement      { yy.getLogger().info('Category: ',$2);yy.addCategory($2);  }
	| SPACELIST node       { yy.getLogger().info('Node: ',$2.id);yy.addNode($1.length, $2.id, $2.description, $2.type, $2.category);  }
	| SPACELIST ICON       { yy.getLogger().trace('Icon: ',$2);yy.decorateNode({icon: $2}); }
	| SPACELIST CLASS      { yy.decorateNode({class: $2}); }
  | SPACELINE { yy.getLogger().trace('SPACELIST');}
	| problemStatement				       { yy.getLogger().trace('Problem: ',$1);yy.setProblemStatement($1);  }
	| categoryStatement				       { yy.getLogger().trace('Category: ',$1);yy.addCategory($1);  }
	| node					       { yy.getLogger().trace('Node: ',$1.id);yy.addNode(0, $1.id, $1.description, $1.type, $1.category);  }
	| ICON                 { yy.decorateNode({icon: $1}); }
	| CLASS                { yy.decorateNode({class: $1}); }
  | SPACELIST
	;

problemStatement
  : PROBLEM NODE_ID             { $$ = $2; }
  | PROBLEM NODE_DSTART NODE_DESCR NODE_DEND
                               { $$ = $3; }
  | PROBLEM SPACELIST NODE_ID   { $$ = $3; }
  ;

categoryStatement
  : CATEGORY NODE_ID             { $$ = $2; }
  | CATEGORY NODE_DSTART NODE_DESCR NODE_DEND
                               { $$ = $3; }
  | CATEGORY SPACELIST NODE_ID   { $$ = $3; }
  ;

node
  :nodeWithId
  |nodeWithoutId
  ;

nodeWithoutId
  :   NODE_DSTART NODE_DESCR NODE_DEND
	      { yy.getLogger().trace("node found ..", $1); $$ = { id: $2, description: $2, type: yy.getType($1, $3), category: undefined }; }
  ;

nodeWithId
	:  NODE_ID             { $$ = { id: $1, description: $1, type: yy.nodeType.DEFAULT, category: undefined }; }
	|  NODE_ID NODE_ID     { $$ = { id: $1, description: $2, type: yy.nodeType.DEFAULT, category: undefined }; }
	|  NODE_ID SPACELIST NODE_ID { $$ = { id: $1, description: $3, type: yy.nodeType.DEFAULT, category: undefined }; }
	|  NODE_ID NODE_DSTART NODE_DESCR NODE_DEND
	                       { yy.getLogger().trace("node found ..", $1); $$ = { id: $1, description: $3, type: yy.getType($2, $4), category: undefined }; }
	;
%%
