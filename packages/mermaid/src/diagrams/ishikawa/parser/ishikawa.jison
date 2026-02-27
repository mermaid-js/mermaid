%lex
%options case-insensitive

%%

\s*\%\%.*          { return 'SPACELINE'; }
"ishikawa-beta"     { return 'ISHIKAWA'; }
"ishikawa"          { return 'ISHIKAWA'; }
[\s]+[\n]          { return 'SPACELINE'; }
[\n]+               { return 'NL'; }
[\s]+               { return 'SPACELIST'; }
[^\n]+              { return 'TEXT'; }
<<EOF>>             return 'EOF';

/lex

%start start

%%

start
  : ishikawa
  | spaceLines ishikawa
  ;

spaceLines
  : SPACELINE
  | spaceLines SPACELINE
  | spaceLines NL
  ;

ishikawa
  : ISHIKAWA document { return yy; }
  | ISHIKAWA NL document { return yy; }
  ;

stop
  : NL
  | EOF
  | SPACELINE
  | stop NL
  | stop EOF
  ;

document
  : document statement stop
  | statement stop
  ;

statement
  : SPACELIST TEXT    { yy.addNode($1.length, $2.trim()); }
  | TEXT              { yy.addNode(0, $1.trim()); }
  | SPACELINE
  | SPACELIST
  ;
%%
