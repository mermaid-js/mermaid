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
    : 'DECLARATION' optional_sections
    | 'DECLARATION' title_definition optional_sections
    ;

optional_sections
    : participant_definitions
    | systemboundary_definitions
    | relationships
    | participant_definitions systemboundary_definitions relationships
    | participant_definitions relationships
    | systemboundary_definitions relationships
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
    : 'SYSTEMBOUNDARY' use_cases 'END' { yy.addSystemBoundary($2); }
    | 'SYSTEMBOUNDARY' systemboundary_title_definition use_cases 'END' { yy.addSystemBoundary($3, $2); }
    ;

systemboundary_title_definition
    : 'TITLE'
    ;

title_definition
    : 'TITLE' {var title = $1.substring(6).trim(); yy.setDiagramTitle(title);$$=title;}
    ;

use_cases
    : use_cases use_case               { $$ = $1.concat($2); }
    | use_case                         { $$ = [$1]           }
    ;

use_casexx
    : 'USECASE';

use_case
    : 'USECASE'    '{' extension_points '}'          { $$ = { type: 'USECASE', id: $1.trim(), extensionPoints: $3 }; }
    | 'USECASE'                                      { $$ = { type: 'USECASE', id: $1.trim(), extensionPoints: [] }; }
    | 'USECASE_AS' '{' extension_points '}'          { $$ = { type: 'USECASE', id: yy.parseAlias($1), extensionPoints: $3 }; }
    | 'USECASE_AS'                                   { $$ = { type: 'USECASE', id: yy.parseAlias($1), extensionPoints: [] }; }
    ;

extension_points
    : extension_points extension_point { $$ = $1.concat($2.replace(/^- +/, ''));  }
    | extension_point                  { $$ = [$1.replace(/^- +/, '')];           }
    ;

extension_point
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

