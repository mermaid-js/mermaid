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

(\r?\n)+                               /*{console.log('New line');return 'NL';}*/ return 'NL';
\s+                                    /* skip all whitespace */
\#[^\n]*                               /* skip comments */
\%%[^\n]*                              /* skip comments */
"gitGraph"                             return 'GG';
"commit"                               return 'COMMIT';
"id:"                                  return 'COMMIT_ID';
"type:"                                return 'COMMIT_TYPE';
"NORMAL"                               return 'NORMAL';
"REVERSE"                              return 'REVERSE';
"HIGHLIGHT"                            return 'HIGHLIGHT';                       
"tag:"                                 return 'COMMIT_TAG';
"branch"                               return 'BRANCH';
"merge"                                return 'MERGE';
// "reset"                                return 'RESET';
"checkout"                             return 'CHECKOUT';
"LR"                                   return 'DIR';
"BT"                                   return 'DIR';
":"                                    return ':';
"^"                                    return 'CARET'
"options"\r?\n                         this.begin("options");
<options>"end"\r?\n                    this.popState();
<options>[^\n]+\r?\n                   return 'OPT';
["]                                    this.begin("string");
<string>["]                            this.popState();
<string>[^"]*                          return 'STR';
[a-zA-Z][-_\.a-zA-Z0-9]*[-_a-zA-Z0-9]  return 'ID';
<<EOF>>                                return 'EOF';

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
    : commitStatement
    | BRANCH ID {yy.branch($2)}
    | CHECKOUT ID {yy.checkout($2)}
    | MERGE ID {yy.merge($2)}
    // | RESET reset_arg {yy.reset($2)}
    ;
commitStatement
    : COMMIT commit_arg {yy.commit($2)}
    | COMMIT COMMIT_ID STR {yy.commit('',$3,yy.commitType.NORMAL,'')}
    | COMMIT COMMIT_TYPE commitType {yy.commit('','',$3,'')}
    | COMMIT COMMIT_TAG STR {yy.commit('','',yy.commitType.NORMAL,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_TYPE commitType {yy.commit('','',$5,$3)}
    | COMMIT COMMIT_TYPE commitType COMMIT_TAG STR  {yy.commit('','',$3,$5)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType {yy.commit('',$3,$5,'')}
    | COMMIT COMMIT_ID STR COMMIT_TAG STR {yy.commit('',$3,yy.commitType.NORMAL,$5)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_TAG STR {yy.commit('',$3,$5,$7)}
    | COMMIT COMMIT_ID STR COMMIT_TAG STR COMMIT_TYPE commitType  {yy.commit('',$3,$7,$5)}
    ;
commit_arg
    : /* empty */ {$$ = ""}
    | STR {$$=$1}
    ;
commitType
    : NORMAL { $$=yy.commitType.NORMAL;}
    | REVERSE   { $$=yy.commitType.REVERSE;}
    | HIGHLIGHT { $$=yy.commitType.HIGHLIGHT;}
    ;    
// reset_arg
//     : 'HEAD' reset_parents{$$ = $1+ ":" + $2 }
//     | ID reset_parents{$$ = $1+ ":"  + yy.count; yy.count = 0}
//     ;
// reset_parents
//     : /* empty */ {yy.count = 0}
//     | CARET reset_parents { yy.count += 1 }
//     ;
