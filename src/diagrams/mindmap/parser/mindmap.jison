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
%x ICON
%x CLASS

%%

\s*\%\%.*\n {console.log('Found comment',yytext);}
// \%\%[^\n]*\n                             /* skip comments */
"mindmap"		       return 'MINDMAP';
":::"              { this.begin('CLASS'); }
<CLASS>.+			     { this.popState();return 'CLASS'; }
<CLASS>\n				   { this.popState();}
[\n\s]*"::icon("   { this.begin('ICON'); }
[\n]+             /* return 'NL'; */
<ICON>[^\)]+			 { return 'ICON'; }
<ICON>\)				   {this.popState();}
"-)"               { console.log('Exploding node'); this.begin('NODE');return 'NODE_DSTART'; }
"(-"               { console.log('Cloud'); this.begin('NODE');return 'NODE_DSTART'; }
"))"               { console.log('Explosion Bang'); this.begin('NODE');return 'NODE_DSTART'; }
")"               { console.log('Cloud Bang'); this.begin('NODE');return 'NODE_DSTART'; }
"(("               { this.begin('NODE');return 'NODE_DSTART'; }
"("                { this.begin('NODE');return 'NODE_DSTART'; }
"["                { this.begin('NODE');return 'NODE_DSTART'; }
[\s]+              return 'SPACELIST'                 /* skip all whitespace */    ;
// !(-\()            return 'NODE_ID';
[^\(\[\n\-\)]+         return 'NODE_ID';
<<EOF>>            return 'EOF';
<NODE>["]          { console.log('Starting NSTR');this.begin("NSTR");}
<NSTR>[^"]+        { console.log('description:', yytext); return "NODE_DESCR";}
<NSTR>["]          {this.popState();}
<NODE>[\)]\)         {this.popState();console.log('node end ))');return "NODE_DEND";}
<NODE>[\)]         {this.popState();console.log('node end )');return "NODE_DEND";}
<NODE>[\]]         {this.popState();console.log('node end ...');return "NODE_DEND";}
<NODE>"(-"         {this.popState();console.log('node end (-');return "NODE_DEND";}
<NODE>"-)"         {this.popState();console.log('node end (-');return "NODE_DEND";}
<NODE>"(("         {this.popState();console.log('node end ((');return "NODE_DEND";}
<NODE>"("         {this.popState();console.log('node end ((');return "NODE_DEND";}
<NODE>[^\)\]\(]+     { console.log('Long description:', yytext);   return 'NODE_DESCR';}
<NODE>.+(?!\(\()     { console.log('Long description:', yytext);   return 'NODE_DESCR';}
// [\[]               return 'NODE_START';
// .+                 return 'TXT' ;

/lex

%start start

%% /* language grammar */

start
// %{	: info document 'EOF' { return yy; } }
	: MINDMAP document  { return yy; }
  |	SPACELIST MINDMAP document  { return yy; }
	;

document
	: document line
	| line
	;

line
	: statement { }
	;

statement
	: SPACELIST node      { yy.addNode($1.length, $2.id, $2.descr, $2.type);  }
	| SPACELIST ICON       { yy.decorateNode({icon: $2}); }
	| SPACELIST EOF
	| SPACELIST NL
	| node					{ console.log($1.id);yy.addNode(0, $1.id, $1.descr, $1.type);  }
	| ICON                 { yy.decorateNode({icon: $1}); }
	| SPACELIST CLASS       { yy.decorateNode({class: $2}); }
	| CLASS                 { yy.decorateNode({class: $1}); }
	| EOF
	;
node
  :nodeWithId
  |nodeWithoutId
  ;

nodeWithoutId
  :   NODE_DSTART NODE_DESCR NODE_DEND
	      { console.log("node found ..", $1); $$ = { id: $2, descr: $2, type: yy.getType($1, $3) }; }
  ;

nodeWithId
	:  NODE_ID             { $$ = { id: $1, descr: $1, type: yy.nodeType.DEFAULT }; }
	|  NODE_ID NODE_DSTART NODE_DESCR NODE_DEND
	                       { console.log("node found ..", $1); $$ = { id: $1, descr: $3, type: yy.getType($2, $4) }; }
	;
%%
