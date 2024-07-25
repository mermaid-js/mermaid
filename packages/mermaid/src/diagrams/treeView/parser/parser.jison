
%lex

%options case-insensitive

%%

// \%\%[^\n]*\n                             /* skip comments */
"treeView"    return "TREE_VIEW";
[0-9a-zA-Z.]+       return "TEXT";
[\s]+       return "SPACELIST";
[\n]+    return "NL";
<<EOF>>     return "EOF";

/lex

%start start

%% /* language grammar */

start
    : TREE_VIEW body
    ;

body
    : body TEXT            { yy.addNode(0, $2); }
    | body SPACELIST TEXT  { yy.addNode($2.length, $3); }
    | body eol
    | 
    ;

eol
    : SPACELIST eol
    | NL
    | EOF
    ;

%%
     
