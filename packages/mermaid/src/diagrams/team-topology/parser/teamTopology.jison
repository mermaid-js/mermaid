/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2023 Brian Graham <brian@buildingbetterteams.de>
 *  MIT license.
 */

%lex
%%

\n                                      return 'NEWLINE'
\s+                                     /* skip whitespace */
[#]                                     return 'HASH'
\-\-                                    return 'FROM'
\-\>                                    return 'TO'
(Stream|Platform|Complicated|Enabling)  return 'TEAM_TYPE'
(Collaboration|XaaS|Facilitation)       return 'INTERACTION_TYPE'
[A-Za-z0-9_]+                           return 'TEAM_NAME'
<<EOF>>                                 return 'EOF'

/lex

%start document

%%

document
  : line
  | document line
  ;

line
  : team eol
  | eol
  ;

team
  : TEAM_NAME HASH TEAM_TYPE   { yy.addTeam($1, $3); }
  | TEAM_NAME FROM INTERACTION_TYPE TO TEAM_NAME { yy.addInteraction($1, $3, $5); }
  ;

eol
  : NEWLINE
  | ';'
  | EOF
  ;
