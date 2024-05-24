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
%x acc_title
%x acc_descr
%x acc_descr_multiline
%options case-insensitive


%%
accTitle\s*":"\s*                                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                               { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                                       { this.popState(); }
<acc_descr_multiline>[^\}]*                                     return "acc_descr_multiline_value";
(\r?\n)+                               /*{console.log('New line');return 'NL';}*/ return 'NL';
\#[^\n]*                               /* skip comments */
\%%[^\n]*                              /* skip comments */
"gitGraph"                              return 'GG';
commit(?=\s|$)                          return 'COMMIT';
"id:"                                   return 'COMMIT_ID';
"type:"                                 return 'COMMIT_TYPE';
"msg:"                                  return 'COMMIT_MSG';
"NORMAL"                                return 'NORMAL';
"REVERSE"                               return 'REVERSE';
"HIGHLIGHT"                             return 'HIGHLIGHT';
"tag:"                                  return 'COMMIT_TAG';
branch(?=\s|$)                          return 'BRANCH';
"order:"                                return 'ORDER';
merge(?=\s|$)                           return 'MERGE';
cherry\-pick(?=\s|$)                    return 'CHERRY_PICK';
"parent:"                               return 'PARENT_COMMIT'
// "reset"                                 return 'RESET';
\b(checkout|switch)(?=\s|$)             return 'CHECKOUT';
"LR"                                    return 'DIR';
"TB"                                    return 'DIR';
"BT"                                    return 'DIR';
":"                                     return ':';
"^"                                     return 'CARET'
"options"\r?\n                          this.begin("options"); //
<options>[ \r\n\t]+"end"                this.popState();       // not used anymore in the renderer, fixed for backward compatibility
<options>[\s\S]+(?=[ \r\n\t]+"end")     return 'OPT';          //
["]["]                                  return 'EMPTYSTR';
["]                                     this.begin("string");
<string>["]                             this.popState();
<string>[^"]*                           return 'STR';
[0-9]+(?=\s|$)                          return 'NUM';
\w([-\./\w]*[-\w])?                     return 'ID'; // only a subset of https://git-scm.com/docs/git-check-ref-format
<<EOF>>                                 return 'EOF';
\s+                                    /* skip all whitespace */ // lowest priority so we can use lookaheads in earlier regex

/lex

%left '^'

%start start

%% /* language grammar */

start
   : eol start
    | GG document EOF{ return $3; }
    | GG ':' document EOF{ return $3; }
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
    : /*empty*/ {$$ = []}
    | body line {$1.push($2); $$=$1;}
    ;
line
    : statement eol {$$ =$1}
    | NL
    ;

statement
    : commitStatement
    | mergeStatement
    | cherryPickStatement
    | acc_title acc_title_value  { $$=$2.trim();yy.setAccTitle($$); }
    | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
    | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
    | branchStatement
    | CHECKOUT ref {yy.checkout($2)}
    // | RESET reset_arg {yy.reset($2)}
    ;
branchStatement
    : BRANCH ref {yy.branch($2)}
    | BRANCH ref ORDER NUM {yy.branch($2, $4)}
    ;

cherryPickStatement
    : CHERRY_PICK COMMIT_ID STR {yy.cherryPick($3, '', undefined)}
    | CHERRY_PICK COMMIT_ID STR PARENT_COMMIT STR {yy.cherryPick($3, '', undefined,$5)}
    | CHERRY_PICK COMMIT_ID STR COMMIT_TAG STR {yy.cherryPick($3, '', $5)}
    | CHERRY_PICK COMMIT_ID STR PARENT_COMMIT STR COMMIT_TAG STR {yy.cherryPick($3, '', $7,$5)}
    | CHERRY_PICK COMMIT_ID STR COMMIT_TAG STR PARENT_COMMIT STR {yy.cherryPick($3, '', $5,$7)}
    | CHERRY_PICK COMMIT_TAG STR COMMIT_ID STR {yy.cherryPick($5, '', $3)}
    | CHERRY_PICK COMMIT_TAG EMPTYSTR COMMIT_ID STR {yy.cherryPick($5, '', '')}
    | CHERRY_PICK COMMIT_ID STR COMMIT_TAG EMPTYSTR {yy.cherryPick($3, '', '')}
    | CHERRY_PICK COMMIT_ID STR PARENT_COMMIT STR COMMIT_TAG EMPTYSTR {yy.cherryPick($3, '', '',$5)}
    | CHERRY_PICK COMMIT_ID STR COMMIT_TAG EMPTYSTR PARENT_COMMIT STR {yy.cherryPick($3, '', '',$7)}
    | CHERRY_PICK COMMIT_TAG STR COMMIT_ID STR PARENT_COMMIT STR {yy.cherryPick($5, '', $3,$7)}
    | CHERRY_PICK COMMIT_TAG EMPTYSTR COMMIT_ID STR PARENT_COMMIT STR{yy.cherryPick($5, '', '',$7)}
    ;

mergeStatement
    : MERGE ref {yy.merge($2,'','','')}
    | MERGE ref COMMIT_ID STR {yy.merge($2, $4,'','')}
    | MERGE ref COMMIT_TYPE commitType  {yy.merge($2,'', $4,'')}
    | MERGE ref COMMIT_TAG STR {yy.merge($2, '','',$4)}
    | MERGE ref COMMIT_TAG STR COMMIT_ID STR {yy.merge($2, $6,'', $4)}
    | MERGE ref COMMIT_TAG STR COMMIT_TYPE commitType {yy.merge($2, '',$6, $4)}
    | MERGE ref COMMIT_TYPE commitType COMMIT_TAG STR {yy.merge($2, '',$4, $6)}
    | MERGE ref COMMIT_ID STR COMMIT_TYPE commitType {yy.merge($2, $4, $6, '')}
    | MERGE ref COMMIT_ID STR COMMIT_TAG STR {yy.merge($2, $4, '', $6)}
    | MERGE ref COMMIT_TYPE commitType COMMIT_ID STR {yy.merge($2, $6,$4, '')}
    | MERGE ref COMMIT_ID STR COMMIT_TYPE commitType COMMIT_TAG STR {yy.merge($2, $4, $6, $8)}
    | MERGE ref COMMIT_TYPE commitType COMMIT_TAG STR COMMIT_ID STR {yy.merge($2, $8, $4, $6)}
    | MERGE ref COMMIT_ID STR COMMIT_TAG STR COMMIT_TYPE commitType {yy.merge($2, $4, $8, $6)}
    | MERGE ref COMMIT_TYPE commitType COMMIT_ID STR COMMIT_TAG STR {yy.merge($2, $6, $4, $8)}
    | MERGE ref COMMIT_TAG STR COMMIT_TYPE commitType COMMIT_ID STR {yy.merge($2, $8, $6, $4)}
    | MERGE ref COMMIT_TAG STR COMMIT_ID STR COMMIT_TYPE commitType {yy.merge($2, $6, $8, $4)}
    ;

commitStatement
    : COMMIT commit_arg {yy.commit($2)}
    | COMMIT COMMIT_TAG STR {yy.commit('','',yy.commitType.NORMAL,$3)}
    | COMMIT COMMIT_TYPE commitType {yy.commit('','',$3,'')}
    | COMMIT COMMIT_TAG STR COMMIT_TYPE commitType {yy.commit('','',$5,$3)}
    | COMMIT COMMIT_TYPE commitType COMMIT_TAG STR  {yy.commit('','',$3,$5)}
    | COMMIT COMMIT_ID STR {yy.commit('',$3,yy.commitType.NORMAL,'')}
    | COMMIT COMMIT_ID STR COMMIT_TAG STR {yy.commit('',$3,yy.commitType.NORMAL,$5)}
    | COMMIT COMMIT_TAG STR COMMIT_ID STR {yy.commit('',$5,yy.commitType.NORMAL,$3)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType {yy.commit('',$3,$5,'')}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR {yy.commit('',$5,$3,'')}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_TAG STR {yy.commit('',$3,$5,$7)}
    | COMMIT COMMIT_ID STR COMMIT_TAG STR COMMIT_TYPE commitType  {yy.commit('',$3,$7,$5)}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR COMMIT_TAG STR {yy.commit('',$5,$3,$7)}
    | COMMIT COMMIT_TYPE commitType COMMIT_TAG STR COMMIT_ID STR  {yy.commit('',$7,$3,$5)}
    | COMMIT COMMIT_TAG STR COMMIT_TYPE commitType COMMIT_ID STR {yy.commit('',$7,$5,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_ID STR COMMIT_TYPE commitType  {yy.commit('',$5,$7,$3)}
    | COMMIT COMMIT_MSG STR {yy.commit($3,'',yy.commitType.NORMAL,'')}
    | COMMIT COMMIT_TAG STR COMMIT_MSG STR {yy.commit($5,'',yy.commitType.NORMAL,$3)}
    | COMMIT COMMIT_MSG STR COMMIT_TAG STR {yy.commit($3,'',yy.commitType.NORMAL,$5)}
    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($3,'',$5,'')}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR  {yy.commit($5,'',$3,'')}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR {yy.commit($5,$3,yy.commitType.NORMAL,'')}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR {yy.commit($3,$5,yy.commitType.NORMAL,'')}

    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_TAG STR {yy.commit($3,'',$5,$7)}
    | COMMIT COMMIT_MSG STR COMMIT_TAG STR COMMIT_TYPE commitType {yy.commit($3,'',$7,$5)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_TAG STR {yy.commit($5,'',$3,$7)}
    | COMMIT COMMIT_TYPE commitType COMMIT_TAG STR COMMIT_MSG STR {yy.commit($7,'',$3,$5)}
    | COMMIT COMMIT_TAG STR COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($7,'',$5,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($5,'',$7,$3)}

    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_ID STR {yy.commit($3,$7,$5,'')}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR COMMIT_TYPE commitType {yy.commit($3,$5,$7,'')}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_ID STR {yy.commit($5,$7,$3,'')}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR COMMIT_MSG STR {yy.commit($7,$5,$3,'')}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($7,$3,$5,'')}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($5,$3,$7,'')}

    | COMMIT COMMIT_MSG STR COMMIT_TAG STR COMMIT_ID STR {yy.commit($3,$7,yy.commitType.NORMAL,$5)}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR COMMIT_TAG STR {yy.commit($3,$5,yy.commitType.NORMAL,$7)}
    | COMMIT COMMIT_TAG STR COMMIT_MSG STR COMMIT_ID STR {yy.commit($5,$7,yy.commitType.NORMAL,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_ID STR COMMIT_MSG STR {yy.commit($7,$5,yy.commitType.NORMAL,$3)}
    | COMMIT COMMIT_ID STR COMMIT_TAG STR COMMIT_MSG STR {yy.commit($7,$3,yy.commitType.NORMAL,$5)}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR COMMIT_TAG STR {yy.commit($5,$3,yy.commitType.NORMAL,$7)}

    | COMMIT COMMIT_MSG STR COMMIT_ID STR COMMIT_TYPE commitType COMMIT_TAG STR {yy.commit($3,$5,$7,$9)}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR COMMIT_TAG STR COMMIT_TYPE commitType {yy.commit($3,$5,$9,$7)}
    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_ID STR COMMIT_TAG STR {yy.commit($3,$7,$5,$9)}
    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_TAG STR COMMIT_ID STR {yy.commit($3,$9,$5,$7)}
    | COMMIT COMMIT_MSG STR COMMIT_TAG STR COMMIT_ID STR COMMIT_TYPE commitType {yy.commit($3,$7,$9,$5)}
    | COMMIT COMMIT_MSG STR COMMIT_TAG STR COMMIT_TYPE commitType COMMIT_ID STR {yy.commit($3,$9,$7,$5)}

    | COMMIT COMMIT_ID STR COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_TAG STR {yy.commit($5,$3,$7,$9)}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR COMMIT_TAG STR COMMIT_TYPE commitType {yy.commit($5,$3,$9,$7)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_TAG STR {yy.commit($7,$3,$5,$9)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_TAG STR COMMIT_MSG STR {yy.commit($9,$3,$5,$7)}
    | COMMIT COMMIT_ID STR COMMIT_TAG STR COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($7,$3,$9,$5)}
    | COMMIT COMMIT_ID STR COMMIT_TAG STR COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($9,$3,$7,$5)}

    | COMMIT COMMIT_TAG STR COMMIT_ID STR COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($9,$5,$7,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_ID STR COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($7,$5,$9,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_TYPE commitType COMMIT_ID STR COMMIT_MSG STR {yy.commit($9,$7,$5,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_ID STR {yy.commit($7,$9,$5,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_MSG STR COMMIT_ID STR COMMIT_TYPE commitType {yy.commit($5,$7,$9,$3)}
    | COMMIT COMMIT_TAG STR COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_ID STR {yy.commit($5,$9,$7,$3)}

    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR COMMIT_MSG STR COMMIT_TAG STR {yy.commit($7,$5,$3,$9)}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR COMMIT_TAG STR COMMIT_MSG STR {yy.commit($9,$5,$3,$7)}
    | COMMIT COMMIT_TYPE commitType COMMIT_TAG STR COMMIT_MSG STR COMMIT_ID STR {yy.commit($7,$9,$3,$5)}
    | COMMIT COMMIT_TYPE commitType COMMIT_TAG STR COMMIT_ID STR COMMIT_MSG STR {yy.commit($9,$7,$3,$5)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_ID STR COMMIT_TAG STR {yy.commit($5,$7,$3,$9)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_TAG STR COMMIT_ID STR {yy.commit($5,$9,$3,$7)}


    // | COMMIT COMMIT_ID STR {yy.commit('',$3,yy.commitType.NORMAL,'')}
    // | COMMIT COMMIT_TYPE commitType {yy.commit('','',$3,'')}
    // | COMMIT COMMIT_TAG STR {yy.commit('','',yy.commitType.NORMAL,$3)}
    // | COMMIT COMMIT_MSG STR {yy.commit($3,'',yy.commitType.NORMAL,'')}
    // | COMMIT COMMIT_TAG STR COMMIT_TYPE commitType {yy.commit('','',$5,$3)}
    // | COMMIT COMMIT_TYPE commitType COMMIT_TAG STR  {yy.commit('','',$3,$5)}
    // | COMMIT COMMIT_ID STR COMMIT_TYPE commitType {yy.commit('',$3,$5,'')}
    // | COMMIT COMMIT_ID STR COMMIT_TAG STR {yy.commit('',$3,yy.commitType.NORMAL,$5)}
    // | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_TAG STR {yy.commit('',$3,$5,$7)}
    // | COMMIT COMMIT_ID STR COMMIT_TAG STR COMMIT_TYPE commitType  {yy.commit('',$3,$7,$5)}
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

ref
    : ID
    | STR
    ;

eol
  : NL
  | ';'
  | EOF
  ;
// reset_arg
//     : 'HEAD' reset_parents{$$ = $1+ ":" + $2 }
//     | ID reset_parents{$$ = $1+ ":"  + yy.count; yy.count = 0}
//     ;
// reset_parents
//     : /* empty */ {yy.count = 0}
//     | CARET reset_parents { yy.count += 1 }
//     ;
