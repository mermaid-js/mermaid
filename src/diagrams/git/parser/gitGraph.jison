
/*
 * Parse following
 * gitGraph:
 *  commit
 *  commit
 *  branch 
 */
%lex

%x string
%x options
%options case-insensitive

%%

(\r?\n)+                           return 'NL';
\s+                             /* skip all whitespace */
\#[^\n]*                        /* skip comments */
\%%[^\n]*                       /* skip comments */
"gitGraph"                      return 'GG';
"commit"                        return 'COMMIT';
"branch"                        return 'BRANCH';
"merge"                         return 'MERGE';
"reset"                         return 'RESET';
"checkout"                         return 'CHECKOUT';
"LR"                            return 'DIR';
"BT"                            return 'DIR';
":"                             return ':';
"^"                             return 'CARET'
"options"\r?\n                       this.begin("options");
<options>"end"\r?\n                   this.popState();
<options>[^\n]+\r?\n                 return 'OPT';
["]                             this.begin("string");
<string>["]                     this.popState();
<string>[^"]*                     return 'STR';
[a-zA-Z][a-zA-Z0-9_]+           return 'ID';
<<EOF>>                         return 'EOF';

/lex

%left '^'

%start start

%% /* language grammar */

start
    : GG ':' document EOF{ return $3; }
    | GG DIR ':' document EOF {yy.setDirection($2); return $4;}
    ;


document
    : /*empty*/
    | options body { yy.setOptions($1); $$ = $2}
    ;

options
    : options OPT {$1 +=$2; $$=$1}
    | NL
    ;
body
    : /*emmpty*/ {$$ = []}
    | body line {$1.push($2); $$=$1;}
    ;
line
    : statement NL{$$ =$1}
    | NL
    ;

statement
    : COMMIT commit_arg {yy.commit($2)}
    | BRANCH ID {yy.branch($2)}
    | CHECKOUT ID {yy.checkout($2)}
    | MERGE ID {yy.merge($2)}
    | RESET reset_arg {yy.reset($2)}
    ;

commit_arg
    : /* empty */ {$$ = ""}
    | STR {$$=$1}
    ;

reset_arg
    : 'HEAD' reset_parents{$$ = $1+ ":" + $2 }
    | ID reset_parents{$$ = $1+ ":"  + yy.count; yy.count = 0}
    ;
reset_parents
    : /* empty */ {yy.count = 0}
    | CARET reset_parents { yy.count += 1 }
    ;
