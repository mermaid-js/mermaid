
/*
 * Parse following
 * gitGraph:
 *  commit
 *  commit
 *  branch 
 */
%lex

%options case-insensitive

%%

[\n]+                           return 'NL';
\s+                             /* skip all whitespace */
\#[^\n]*                        /* skip comments */
\%%[^\n]*                       /* skip comments */
"gitGraph"                      return 'GG';
"commit"                        return 'COMMIT';
"branch"                        return 'BRANCH';
"merge"                         return 'MERGE';
"reset"                         return 'RESET';
":" return ':';
[a-zA-Z][a-zA-Z0-9_]+           return 'ID';
<<EOF>>                         return 'EOF';

/lex

%left '^'

%start start

%% /* language grammar */

start
    : GG ':' document EOF{ return $3; }
    ;

document
    : /* empty */ {$$ =[]}
    | document line {$1.push($2); $$ = $1}
    ;

line
    : statement {$$ =$1}
    | NL
    ;

statement
    : COMMIT {yy.pushCommit()}
    | BRANCH ID {yy.createBranch($2)}
    | MERGE ID {yy.mergeBranch($2)}
;

