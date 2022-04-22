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
%x open_directive
%x type_directive
%x arg_directive
%x close_directive
%options case-insensitive


%%
\%\%\{                                                          { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)                          { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                                             { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%                            { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)                            return 'arg_directive';
(\r?\n)+                               /*{console.log('New line');return 'NL';}*/ return 'NL';
\s+                                    /* skip all whitespace */
\#[^\n]*                               /* skip comments */
\%%[^\n]*                              /* skip comments */
"gitGraph"                              return 'GG';
"commit"                                return 'COMMIT';
"id:"                                   return 'COMMIT_ID';
"type:"                                 return 'COMMIT_TYPE';
"msg:"                                  return 'COMMIT_MSG';
"NORMAL"                                return 'NORMAL';
"REVERSE"                               return 'REVERSE';
"HIGHLIGHT"                             return 'HIGHLIGHT';
"tag:"                                  return 'COMMIT_TAG';
"branch"                                return 'BRANCH';
"merge"                                 return 'MERGE';
// "reset"                                 return 'RESET';
"checkout"                              return 'CHECKOUT';
"LR"                                    return 'DIR';
"BT"                                    return 'DIR';
":"                                     return ':';
"^"                                     return 'CARET'
"options"\r?\n                          this.begin("options");
<options>"end"\r?\n                     this.popState();
<options>[^\n]+\r?\n                    return 'OPT';
["]                                     this.begin("string");
<string>["]                             this.popState();
<string>[^"]*                           return 'STR';
[a-zA-Z][-_\./a-zA-Z0-9]*[-_a-zA-Z0-9]  return 'ID';
<<EOF>>                                 return 'EOF';

/lex

%left '^'

%start start

%% /* language grammar */

start
   : eol start
    | directive start
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
    : /*emmpty*/ {$$ = []}
    | body line {$1.push($2); $$=$1;}
    ;
line
    : statement eol {$$ =$1}
    | NL
    ;

statement
    : commitStatement
    | mergeStatement
    | BRANCH ID {yy.branch($2)}
    | CHECKOUT ID {yy.checkout($2)}
    // | RESET reset_arg {yy.reset($2)}
    ;

mergeStatement
    : MERGE ID {yy.merge($2)}
    | MERGE ID COMMIT_TAG STR {yy.merge($2, $4)}
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

directive
  : openDirective typeDirective closeDirective
  | openDirective typeDirective ':' argDirective closeDirective
  ;

openDirective
  : open_directive { yy.parseDirective('%%{', 'open_directive'); }
  ;

typeDirective
  : type_directive { yy.parseDirective($1, 'type_directive'); }
  ;

argDirective
  : arg_directive { $1 = $1.trim().replace(/'/g, '"'); yy.parseDirective($1, 'arg_directive'); }
  ;

closeDirective
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'gitGraph'); }
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
