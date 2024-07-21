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
    | CHERRY_PICK COMMIT_ID STR commitTags {yy.cherryPick($3, '', $4)}
    | CHERRY_PICK COMMIT_ID STR PARENT_COMMIT STR commitTags {yy.cherryPick($3, '', $6,$5)}
    | CHERRY_PICK COMMIT_ID STR commitTags PARENT_COMMIT STR {yy.cherryPick($3, '', $4,$6)}
    | CHERRY_PICK commitTags COMMIT_ID STR {yy.cherryPick($4, '', $2)}
    | CHERRY_PICK commitTags COMMIT_ID STR PARENT_COMMIT STR {yy.cherryPick($4, '', $2,$6)}
    ;

mergeStatement
    : MERGE ref {yy.merge($2,'','', undefined)}
    | MERGE ref COMMIT_ID STR {yy.merge($2, $4,'', undefined)}
    | MERGE ref COMMIT_TYPE commitType  {yy.merge($2,'', $4, undefined)}
    | MERGE ref commitTags {yy.merge($2, '','',$3)}
    | MERGE ref commitTags COMMIT_ID STR {yy.merge($2, $5,'', $3)}
    | MERGE ref commitTags COMMIT_TYPE commitType {yy.merge($2, '',$5, $3)}
    | MERGE ref COMMIT_TYPE commitType commitTags {yy.merge($2, '',$4, $5)}
    | MERGE ref COMMIT_ID STR COMMIT_TYPE commitType {yy.merge($2, $4, $6, undefined)}
    | MERGE ref COMMIT_ID STR commitTags {yy.merge($2, $4, '', $5)}
    | MERGE ref COMMIT_TYPE commitType COMMIT_ID STR {yy.merge($2, $6,$4, undefined)}
    | MERGE ref COMMIT_ID STR COMMIT_TYPE commitType commitTags {yy.merge($2, $4, $6, $7)}
    | MERGE ref COMMIT_TYPE commitType commitTags COMMIT_ID STR {yy.merge($2, $7, $4, $5)}
    | MERGE ref COMMIT_ID STR commitTags COMMIT_TYPE commitType {yy.merge($2, $4, $7, $5)}
    | MERGE ref COMMIT_TYPE commitType COMMIT_ID STR commitTags {yy.merge($2, $6, $4, $7)}
    | MERGE ref commitTags COMMIT_TYPE commitType COMMIT_ID STR {yy.merge($2, $7, $5, $3)}
    | MERGE ref commitTags COMMIT_ID STR COMMIT_TYPE commitType {yy.merge($2, $5, $7, $3)}
    ;


commitStatement
    : COMMIT commit_arg {yy.commit($2)}
    | COMMIT commitTags {yy.commit('','',yy.commitType.NORMAL,$2)}
    | COMMIT COMMIT_TYPE commitType {yy.commit('','',$3, undefined)}
    | COMMIT commitTags COMMIT_TYPE commitType {yy.commit('','',$4,$2)}
    | COMMIT COMMIT_TYPE commitType commitTags  {yy.commit('','',$3,$4)}
    | COMMIT COMMIT_ID STR {yy.commit('',$3,yy.commitType.NORMAL, undefined)}
    | COMMIT COMMIT_ID STR commitTags {yy.commit('',$3,yy.commitType.NORMAL,$4)}
    | COMMIT commitTags COMMIT_ID STR {yy.commit('',$4,yy.commitType.NORMAL,$2)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType {yy.commit('',$3,$5, undefined)}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR {yy.commit('',$5,$3, undefined)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType commitTags {yy.commit('',$3,$5,$6)}
    | COMMIT COMMIT_ID STR commitTags COMMIT_TYPE commitType  {yy.commit('',$3,$6,$4)}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR commitTags {yy.commit('',$5,$3,$6)}
    | COMMIT COMMIT_TYPE commitType commitTags COMMIT_ID STR  {yy.commit('',$6,$3,$4)}
    | COMMIT commitTags COMMIT_TYPE commitType COMMIT_ID STR {yy.commit('',$6,$4,$2)}
    | COMMIT commitTags COMMIT_ID STR COMMIT_TYPE commitType  {yy.commit('',$4,$6,$2)}
    | COMMIT COMMIT_MSG STR {yy.commit($3,'',yy.commitType.NORMAL, undefined)}
    | COMMIT commitTags COMMIT_MSG STR {yy.commit($4,'',yy.commitType.NORMAL,$2)}
    | COMMIT COMMIT_MSG STR commitTags {yy.commit($3,'',yy.commitType.NORMAL,$4)}
    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($3,'',$5, undefined)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR  {yy.commit($5,'',$3, undefined)}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR {yy.commit($5,$3,yy.commitType.NORMAL, undefined)}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR {yy.commit($3,$5,yy.commitType.NORMAL, undefined)}

    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType commitTags {yy.commit($3,'',$5,$6)}
    | COMMIT COMMIT_MSG STR commitTags COMMIT_TYPE commitType {yy.commit($3,'',$6,$4)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR commitTags {yy.commit($5,'',$3,$6)}
    | COMMIT COMMIT_TYPE commitType commitTags COMMIT_MSG STR {yy.commit($6,'',$3,$4)}
    | COMMIT commitTags COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($6,'',$4,$2)}
    | COMMIT commitTags COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($4,'',$6,$2)}

    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_ID STR {yy.commit($3,$7,$5, undefined)}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR COMMIT_TYPE commitType {yy.commit($3,$5,$7, undefined)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_ID STR {yy.commit($5,$7,$3, undefined)}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR COMMIT_MSG STR {yy.commit($7,$5,$3, undefined)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($7,$3,$5, undefined)}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($5,$3,$7, undefined)}

    | COMMIT COMMIT_MSG STR commitTags COMMIT_ID STR {yy.commit($3,$6,yy.commitType.NORMAL,$4)}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR commitTags {yy.commit($3,$5,yy.commitType.NORMAL,$6)}
    | COMMIT commitTags COMMIT_MSG STR COMMIT_ID STR {yy.commit($4,$6,yy.commitType.NORMAL,$2)}
    | COMMIT commitTags COMMIT_ID STR COMMIT_MSG STR {yy.commit($6,$4,yy.commitType.NORMAL,$2)}
    | COMMIT COMMIT_ID STR commitTags COMMIT_MSG STR {yy.commit($6,$3,yy.commitType.NORMAL,$4)}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR commitTags {yy.commit($5,$3,yy.commitType.NORMAL,$6)}

    | COMMIT COMMIT_MSG STR COMMIT_ID STR COMMIT_TYPE commitType commitTags {yy.commit($3,$5,$7,$8)}
    | COMMIT COMMIT_MSG STR COMMIT_ID STR commitTags COMMIT_TYPE commitType {yy.commit($3,$5,$8,$6)}
    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_ID STR commitTags {yy.commit($3,$7,$5,$8)}
    | COMMIT COMMIT_MSG STR COMMIT_TYPE commitType commitTags COMMIT_ID STR {yy.commit($3,$8,$5,$6)}
    | COMMIT COMMIT_MSG STR commitTags COMMIT_ID STR COMMIT_TYPE commitType {yy.commit($3,$6,$8,$4)}
    | COMMIT COMMIT_MSG STR commitTags COMMIT_TYPE commitType COMMIT_ID STR {yy.commit($3,$8,$6,$4)}

    | COMMIT COMMIT_ID STR COMMIT_MSG STR COMMIT_TYPE commitType commitTags {yy.commit($5,$3,$7,$8)}
    | COMMIT COMMIT_ID STR COMMIT_MSG STR commitTags COMMIT_TYPE commitType {yy.commit($5,$3,$8,$6)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType COMMIT_MSG STR commitTags {yy.commit($7,$3,$5,$8)}
    | COMMIT COMMIT_ID STR COMMIT_TYPE commitType commitTags COMMIT_MSG STR {yy.commit($8,$3,$5,$6)}
    | COMMIT COMMIT_ID STR commitTags COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($6,$3,$8,$4)}
    | COMMIT COMMIT_ID STR commitTags COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($8,$3,$6,$4)}

    | COMMIT commitTags COMMIT_ID STR COMMIT_TYPE commitType COMMIT_MSG STR {yy.commit($8,$4,$6,$2)}
    | COMMIT commitTags COMMIT_ID STR COMMIT_MSG STR COMMIT_TYPE commitType {yy.commit($6,$4,$8,$2)}
    | COMMIT commitTags COMMIT_TYPE commitType COMMIT_ID STR COMMIT_MSG STR {yy.commit($8,$6,$4,$2)}
    | COMMIT commitTags COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_ID STR {yy.commit($6,$8,$4,$2)}
    | COMMIT commitTags COMMIT_MSG STR COMMIT_ID STR COMMIT_TYPE commitType {yy.commit($4,$6,$8,$2)}
    | COMMIT commitTags COMMIT_MSG STR COMMIT_TYPE commitType COMMIT_ID STR {yy.commit($4,$8,$6,$2)}

    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR COMMIT_MSG STR commitTags {yy.commit($7,$5,$3,$8)}
    | COMMIT COMMIT_TYPE commitType COMMIT_ID STR commitTags COMMIT_MSG STR {yy.commit($8,$5,$3,$6)}
    | COMMIT COMMIT_TYPE commitType commitTags COMMIT_MSG STR COMMIT_ID STR {yy.commit($6,$8,$3,$4)}
    | COMMIT COMMIT_TYPE commitType commitTags COMMIT_ID STR COMMIT_MSG STR {yy.commit($8,$6,$3,$4)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR COMMIT_ID STR commitTags {yy.commit($5,$7,$3,$8)}
    | COMMIT COMMIT_TYPE commitType COMMIT_MSG STR commitTags COMMIT_ID STR {yy.commit($5,$8,$3,$6)}
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
commitTags
    : COMMIT_TAG STR {$$=[$2]}
    | COMMIT_TAG EMPTYSTR {$$=['']}
    | commitTags COMMIT_TAG STR {$commitTags.push($3); $$=$commitTags;}
    | commitTags COMMIT_TAG EMPTYSTR {$commitTags.push(''); $$=$commitTags;}
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
