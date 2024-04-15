// TODO: delete file
%lex
%options case-insensitive

%x GROUP SERVICE LINE
%%

\%\%(?!\{)[^\n]*                                                /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */
<INITIAL,GROUP,SERVICE,LINE>[\n\r]+                             { this.popState(); return 'NEWLINE'; }
\%\%[^\n]*                                                      /* do nothing */
[\s]+                                                           /* skip all whitespace */
"architecture"		                                            return 'ARCHITECTURE';
"service"                                                       { this.begin('SERVICE'); return 'SERVICE'; }
"group"                                                         { this.begin('GROUP'); return 'GROUP'; }
<GROUP,SERVICE,LINE>((?!\n)\s)+                                 /* skip same-line whitespace */             
<GROUP,SERVICE>"in"                                             return 'IN';
<GROUP,SERVICE>[\w]+                                            return 'id';
<GROUP,SERVICE>\([\w]*\)                                        return 'icon';
<GROUP,SERVICE>\[[\w ]*\]                                       return 'title';
[\w]+                                                           { this.begin('LINE'); return 'id'; }
<LINE>\([L|R|T|B]"-"                                            return 'ARROW_LEFT_INTO';
<LINE>[L|R|T|B]"-"                                              return 'ARROW_LEFT';
<LINE>"-"[L|R|T|B]\)                                            return 'ARROW_RIGHT_INTO';
<LINE>"-"[L|R|T|B]                                              return 'ARROW_RIGHT';
<LINE>[\w]+                                                     return 'id';
<LINE>\[[\w ]*\]                                                return 'title';
<INITIAL,GROUP,SERVICE,LINE><<EOF>>                             return 'EOF';

/lex

%start start

%%

start
    : eol start
    | ARCHITECTURE document { return $2; }
    ;

document
    : /* empty */
    | document line 
    ;

line
    : statement eol { $$ = $1 }
    ;

statement
    : /* empty */
    | group_statement  
    | service_statement
    | line_statement   
    ;

line_statement
    : id ARROW_LEFT_INTO ARROW_RIGHT_INTO id
        { yy.addEdge($1, $2[1], $4, $3[1], {lhsInto: true, rhsInto: true}) }
    | id ARROW_LEFT_INTO ARROW_RIGHT id
        { yy.addEdge($1, $2[1], $4, $3[1], {lhsInto: true}) }
    | id ARROW_LEFT ARROW_RIGHT_INTO id
        { yy.addEdge($1, $2[0], $4, $3[1], {rhsInto: true}) }
    | id ARROW_LEFT ARROW_RIGHT id
        { yy.addEdge($1, $2[0], $4, $3[1]) }
    | id ARROW_LEFT_INTO title ARROW_RIGHT_INTO id
        { yy.addEdge($1, $2[1], $5, $4[1], { title: $3.slice(1,-1), lhsInto: true, rhsInto: true }) }
    | id ARROW_LEFT_INTO title ARROW_RIGHT id
        { yy.addEdge($1, $2[1], $5, $4[1], { title: $3.slice(1,-1), lhsInto: true }) }
    | id ARROW_LEFT title ARROW_RIGHT_INTO id
        { yy.addEdge($1, $2[0], $5, $4[1], { title: $3.slice(1,-1), rhsInto: true }) }
    | id ARROW_LEFT title ARROW_RIGHT id
        { yy.addEdge($1, $2[0], $5, $4[1], { title: $3.slice(1,-1) }) }
    ;

group_statement
    : 'GROUP' id 
        { yy.addGroup($2) }
    | 'GROUP' id icon
        { yy.addGroup($2, {icon: $3.slice(1,-1)}) }
    | 'GROUP' id title
        { yy.addGroup($2, {title: $3.slice(1,-1)}) }
    | 'GROUP' id icon title
        { yy.addGroup($2, {icon: $3.slice(1,-1), title: $4.slice(1,-1)}) }
    | 'GROUP' id 'IN' id
        { yy.addGroup($2, {in: $4.trim()}) }
    | 'GROUP' id icon 'IN' id
        { yy.addGroup($2, {icon: $3.slice(1,-1), in: $5.trim()}) }
    | 'GROUP' id title 'IN' id
        { yy.addGroup($2, {title: $3.slice(1,-1), in: $5.trim()}) }
    | 'GROUP' id icon title 'IN' id
        { yy.addGroup($2, {icon: $3.slice(1,-1), title: $4.slice(1,-1), in: $6.trim()}) }
    ;

service_statement
    : 'SERVICE' id 
        { yy.addService($2) }
    | 'SERVICE' id icon
        { yy.addService($2, { icon: $3.slice(1,-1) }) }
    | 'SERVICE' id title
        { yy.addService($2, { title: $3.slice(1,-1) }) }
    | 'SERVICE' id icon title
        { yy.addService($2, { icon: $3.slice(1,-1), title: $4.slice(1,-1) }) }
    | 'SERVICE' id 'IN' id
        { yy.addService($2, { in: $4.trim() }) }
    | 'SERVICE' id icon 'IN' id
        { yy.addService($2, { icon: $3.slice(1,-1), in: $5.trim() }) }
    | 'SERVICE' id title 'IN' id
        { yy.addService($2, { title: $3.slice(1,-1), in: $5.trim() }) }
    | 'SERVICE' id icon title 'IN' id
        { yy.addService($2, { icon: $3.slice(1,-1), title: $4.slice(1,-1), in: $6.trim() }) }
    ;

eol
  : NEWLINE
  | ';'
  | EOF
  ;

%%