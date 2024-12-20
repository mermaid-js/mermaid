/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex

%options case-insensitive

// Special states for recognizing aliases and notes
%x ALIAS NOTE ID

%%

\s+                   /* skip whitespace */
"usecase-beta"        return 'DECLARATION';
"actor"               { this.begin('ID'); return 'ACTOR';   }
"service"             { this.begin('ID'); return 'SERVICE'; }
"systemboundary"      return 'SYSTEMBOUNDARY';
"-"\s[^#\n;]+         return 'TASK';
"title"\s[^#\n;]+     return 'TITLE';
"{"                   return '{';
"}"                   return '}';
\,\s*                 return 'COMMA';
"--"[^(->)]*"-->"     return 'DASHED_ARROW';
"-->"                 return 'DASHED_ARROW';
"--"[^(->)]*"->"      return 'SOLID_ARROW';
"->"                  return 'SOLID_ARROW';
"-"                   return '-';
"end"                 return 'END';
<ID>(.+)\s+as\s+([^\n]+)  {
    var matches = yytext.match(/\s*(.+)\s+as\s+([^\n]+)/);
    this.popState();
    yytext = [matches[1], matches[2]];
    return 'IDENTIFIER_AS';
}
<ID>([^\n]+)  {
    var matches = yytext.match(/\s*([^\n]+)/);
    this.popState();
    yytext = matches[1];
    return 'IDENTIFIER';
}
\([^)\n]*\)\s+as\s+\([^)\n]*\)  return 'USECASE_AS';
\([^)\n]*\)           return 'USECASE'
"("                   return '(';
")"                   return ')';
"note"                { this.begin('NOTE'); return 'NOTE'; }
"as"                  { this.popState(); return 'AS'; }
\"[^\"]*\"            return 'TEXT';
[a-zA-Z][a-zA-Z0-9_]* return 'IDENTIFIER';
[\n]+                 return 'NEWLINE';
<NOTE>[^\n]+          { this.popState(); return 'NOTE_TEXT'; }

/lex

%start start

%% /* language grammar */

start
    : 'DECLARATION' optional_sections relationships
    ;

optional_sections
    : title_definition participant_definitions systemboundary_definitions
    | participant_definitions systemboundary_definitions
    | title_definition participant_definitions
    | title_definition systemboundary_definitions
    | participant_definitions
    | systemboundary_definitions
    | title_definition
    | /* empty */
    ;

participant_definitions
    : participant_definitions participant_definition    { yy.addParticipant($2); }
    | participant_definition                            { yy.addParticipant($1); }
    ;

participant_definition
    : SERVICE IDENTIFIER     { $$ = {'service': $2} }
    | ACTOR   IDENTIFIER     { $$ = {'actor'  : $2} }
    | SERVICE IDENTIFIER_AS  { $$ = {'service': $2[0], 'as': $2[1]} }
    | ACTOR   IDENTIFIER_AS  { $$ = {'actor'  : $2[0], 'as': $2[1]} }
    ;

systemboundary_definitions
    : 'SYSTEMBOUNDARY' systemboundary_elements 'END' { yy.addSystemBoundary($2); }
    | 'SYSTEMBOUNDARY' systemboundary_title_definition systemboundary_elements 'END' { yy.addSystemBoundary($3, $2); }
    ;

systemboundary_title_definition
    : 'TITLE'
    ;

title_definition
    : 'TITLE' {var title = $1.substring(6).trim(); yy.setDiagramTitle(title);$$=title;}
    ;

systemboundary_elements
    : systemboundary_elements systemboundary_element { $$ = $1.concat($2); }
    | systemboundary_element { $$ = [$1] }
    ;

systemboundary_element
    : 'USECASE' '{' systemboundary_tasks '}'
    | 'USECASE'
    | 'USECASE_AS' '{' systemboundary_tasks '}'
    | 'USECASE_AS'  { $$ = yy.addAlias($1)}
    ;

systemboundary_tasks
    : systemboundary_tasks systemboundary_task { $$ = $1.concat($2) }
    | systemboundary_task { $$ = [$1] }
    ;

systemboundary_task
    : TASK
    ;

relationships
    : relationships relationship
    | relationship
    ;

relationship
    : IDENTIFIER arrow services   { yy.addRelationship($1, $3, $2); }
    | IDENTIFIER arrow USECASE    { yy.addRelationship($1, $3, $2); }
    | USECASE arrow USECASE       { yy.addRelationship($1, $3, $2); }
    | IDENTIFIER arrow USECASE arrow services { yy.addRelationship($1, $3, $2); yy.addRelationship($3, $5[0], $4);}
    ;

services
    : services COMMA IDENTIFIER  { $$ = $1.concat($2) }
    | IDENTIFIER               { $$ = [$1]          }
    ;

arrow
    : DASHED_ARROW
    | SOLID_ARROW
    ;

note_statement
    : 'NOTE' TEXT NEWLINE { $$ = { type: 'note', text: $2 }; }
    ;

alias_statement
    : IDENTIFIER 'AS' IDENTIFIER NEWLINE { $$ = { type: 'alias', original: $1, alias: $3 }; }
    ;
