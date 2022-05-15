/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2022 mzhx.meng@gmail.com
 *  MIT license.
 */

/* lexical grammar */
%lex

/* context */
%x person
%x person_ext
%x system
%x system_db
%x system_queue
%x system_ext
%x system_ext_db
%x system_ext_queue
%x boundary
%x enterprise_boundary
%x system_boundary
%x rel
%x birel
%x rel_u
%x rel_d
%x rel_l
%x rel_r

/* container */
%x container
%x container_db
%x container_queue
%x container_ext
%x container_ext_db
%x container_ext_queue
%x container_boundary

/* component */
%x component
%x component_db
%x component_queue
%x component_ext
%x component_ext_db
%x component_ext_queue

/* Dynamic diagram */
%x rel_index
%x index

/* Deployment diagram */
%x deployment_node
%x node
%x node_l
%x node_r

/* Relationship Types */
%x rel
%x rel_bi
%x rel_up
%x rel_down
%x rel_left
%x rel_right

%x attribute
%x string

%x open_directive
%x type_directive
%x arg_directive

%%
\%\%\{                                    { this.begin('open_directive'); return 'open_directive'; }
.*direction\s+TB[^\n]*                    return 'direction_tb';
.*direction\s+BT[^\n]*                    return 'direction_bt';
.*direction\s+RL[^\n]*                    return 'direction_rl';
.*direction\s+LR[^\n]*                    return 'direction_lr';
<open_directive>((?:(?!\}\%\%)[^:.])*)    { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                       { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%      { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)      return 'arg_directive';
\%\%(?!\{)*[^\n]*(\r?\n?)+                /* skip comments */
\%\%[^\n]*(\r?\n)*            c            /* skip comments */

"title"\s[^#\n;]+                         return 'title';
"accDescription"\s[^#\n;]+                return 'accDescription';

\s*(\r?\n)+                               return 'NEWLINE';
\s+                                       /* skip whitespace */
"C4Context"                               return 'C4_CONTEXT';
"C4Container"                             return 'C4_CONTAINER';
"C4Component"                             return 'C4_COMPONENT';
"C4Dynamic"                               return 'C4_DYNAMIC';
"C4Deployment"                            return 'C4_DEPLOYMENT';

"Person_Ext"                              { this.begin("person_ext"); console.log('begin person_ext'); return 'PERSON_EXT';}
"Person"                                  { this.begin("person"); console.log('begin person'); return 'PERSON';}
"SystemQueue_Ext"                         { this.begin("system_ext_queue"); console.log('begin system_ext_queue'); return 'SYSTEM_EXT_QUEUE';}
"SystemDb_Ext"                            { this.begin("system_ext_db"); console.log('begin system_ext_db'); return 'SYSTEM_EXT_DB';}
"System_Ext"                              { this.begin("system_ext"); console.log('begin system_ext'); return 'SYSTEM_EXT';}
"SystemQueue"                             { this.begin("system_queue"); console.log('begin system_queue'); return 'SYSTEM_QUEUE';}
"SystemDb"                                { this.begin("system_db"); console.log('begin system_db'); return 'SYSTEM_DB';}
"System"                                  { this.begin("system"); console.log('begin system'); return 'SYSTEM';}

"Boundary"                                { this.begin("boundary"); console.log('begin boundary'); return 'BOUNDARY';}
"Enterprise_Boundary"                     { this.begin("enterprise_boundary"); console.log('begin enterprise_boundary'); return 'ENTERPRISE_BOUNDARY';}
"System_Boundary"                         { this.begin("system_boundary"); console.log('begin system_boundary'); return 'SYSTEM_BOUNDARY';}

"Rel"                                     { this.begin("rel"); console.log('begin rel'); return 'REL';} 
"BiRel"                                   { this.begin("birel"); console.log('begin birel'); return 'BIREL';} 
"Rel_U|Rel_Up"                            { this.begin("rel_u"); console.log('begin rel_u'); return 'REL_U';}  
"Rel_D|Rel_Down"                          { this.begin("rel_d"); console.log('begin rel_d'); return 'REL_D';}  
"Rel_L|Rel_Left"                          { this.begin("rel_l"); console.log('begin rel_l'); return 'REL_L';}  
"Rel_R|Rel_Right"                         { this.begin("rel_r"); console.log('begin rel_r'); return 'REL_R';}  


<person,person_ext,system_ext_queue,system_ext_db,system_ext,system_queue,system_db,system,boundary,enterprise_boundary,system_boundary,rel,birel,rel_u,rel_d,rel_l,rel_r><<EOF>>                return "EOF_IN_STRUCT";
<person,person_ext,system_ext_queue,system_ext_db,system_ext,system_queue,system_db,system,boundary,enterprise_boundary,system_boundary,rel,birel,rel_u,rel_d,rel_l,rel_r>[(][ ]*[,]             { console.log('begin attribute with ATTRIBUTE_EMPTY'); this.begin("attribute"); return "ATTRIBUTE_EMPTY";}
<person,person_ext,system_ext_queue,system_ext_db,system_ext,system_queue,system_db,system,boundary,enterprise_boundary,system_boundary,rel,birel,rel_u,rel_d,rel_l,rel_r>[(]                    { console.log('begin attribute'); this.begin("attribute"); }
<person,person_ext,system_ext_queue,system_ext_db,system_ext,system_queue,system_db,system,boundary,enterprise_boundary,system_boundary,rel,birel,rel_u,rel_d,rel_l,rel_r,attribute>[)]          { console.log('STOP attribute'); this.popState();console.log('STOP diagram'); this.popState();}

<attribute>",,"                           { console.log(',,'); return 'ATTRIBUTE_EMPTY';}
<attribute>","                            { console.log(','); }
<attribute>[ ]*["]["]                     { console.log('ATTRIBUTE_EMPTY'); return 'ATTRIBUTE_EMPTY';}
<attribute>[ ]*["]                        { console.log('begin string'); this.begin("string");}
<string>["]                               { console.log('STOP string');  this.popState(); }
<string>[^"]*                             { console.log('STR'); return "STR";}
<attribute>[^,]+                          { console.log('not STR'); return "STR";}

'{'                                       { /* this.begin("lbrace"); */ console.log('begin boundary block'); return "LBRACE";}
'}'                                       { /* this.popState(); */ console.log('STOP boundary block'); return "RBRACE";}
   
[\s]+                                     return 'SPACE';
[\n\r]+                                   return 'EOL';
<<EOF>>                                   return 'EOF';

/lex

/* operator associations and precedence */

%left '^'

%start start

%% /* language grammar */

start
    : mermaidDoc
    | direction
    | directive start
    ;

direction
    : direction_tb
    { yy.setDirection('TB');}
    | direction_bt
    { yy.setDirection('BT');}
    | direction_rl
    { yy.setDirection('RL');}
    | direction_lr
    { yy.setDirection('LR');}
    ;

mermaidDoc
    : graphConfig
    ;

directive
  : openDirective typeDirective closeDirective NEWLINE
  | openDirective typeDirective ':' argDirective closeDirective NEWLINE
  ;

openDirective
  : open_directive { console.log("open_directive: ", $1); yy.parseDirective('%%{', 'open_directive'); }
  ;

typeDirective
  : type_directive {  }
  ;

argDirective
  : arg_directive { $1 = $1.trim().replace(/'/g, '"'); console.log("arg_directive: ", $1); yy.parseDirective($1, 'arg_directive'); }
  ;

closeDirective
  : close_directive { console.log("close_directive: ", $1); yy.parseDirective('}%%', 'close_directive', 'c4Context');  }
  ;

graphConfig
    : C4_CONTEXT NEWLINE statements EOF {yy.setC4Type($1)}
    | C4_CONTAINER NEWLINE statements EOF {yy.setC4Type($1)}
    | C4_COMPONENT NEWLINE statements EOF {yy.setC4Type($1)}
    | C4_DYNAMIC NEWLINE statements EOF {yy.setC4Type($1)}
    | C4_DEPLOYMENT NEWLINE statements EOF {yy.setC4Type($1)}
    ;

statements
    : otherStatements
    | diagramStatements
    | otherStatements diagramStatements 
    ;

otherStatements
    : otherStatement
    | otherStatement NEWLINE
    | otherStatement NEWLINE otherStatements
    ;

otherStatement
    : title {yy.setTitle($1.substring(6));$$=$1.substring(6);}
    | accDescription {yy.setAccDescription($1.substring(15));$$=$1.substring(15);}   
    ;

boundaryStatement
    : boundaryStartStatement diagramStatements boundaryStopStatement
    ;

boundaryStartStatement
    : boundaryStart LBRACE NEWLINE
    | boundaryStart NEWLINE LBRACE
    | boundaryStart NEWLINE LBRACE NEWLINE
    ;

boundaryStart
    : ENTERPRISE_BOUNDARY attributes {console.log($1,JSON.stringify($2)); $2.splice(2, 0, 'ENTERPRISE'); yy.addBoundary(...$2); $$=$2;}
    | SYSTEM_BOUNDARY attributes {console.log($1,JSON.stringify($2)); $2.splice(2, 0, 'ENTERPRISE'); yy.addBoundary(...$2); $$=$2;}
    | BOUNDARY attributes {console.log($1,JSON.stringify($2)); yy.addBoundary(...$2); $$=$2;}
    ;

boundaryStopStatement
    : RBRACE { yy.popBoundaryParseStack() }
    ;

diagramStatements
    : diagramStatement
    | diagramStatement NEWLINE
    | diagramStatement NEWLINE statements  
    ;

diagramStatement
    : PERSON attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('person', ...$2); $$=$2;}
    | PERSON_EXT attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('external_person', ...$2); $$=$2;}
    | SYSTEM attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('system', ...$2); $$=$2;}
    | SYSTEM_DB attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('system_db', ...$2); $$=$2;}
    | SYSTEM_QUEUE attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('system_queue', ...$2); $$=$2;}
    | SYSTEM_EXT attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('external_system', ...$2); $$=$2;}
    | SYSTEM_EXT_DB attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('external_system_db', ...$2); $$=$2;}
    | SYSTEM_EXT_QUEUE attributes {console.log($1,JSON.stringify($2)); yy.addPersonOrSystem('external_system_queue', ...$2); $$=$2;}      
    | boundaryStatement
    | REL attributes {console.log($1,JSON.stringify($2)); yy.addRel('rel', ...$2); $$=$2;}
    | BIREL attributes {console.log($1,JSON.stringify($2)); yy.addRel('birel', ...$2); $$=$2;}
    | REL_U attributes {console.log($1,JSON.stringify($2)); yy.addRel('rel_u', ...$2); $$=$2;}
    | REL_D attributes {console.log($1,JSON.stringify($2)); yy.addRel('rel_d', ...$2); $$=$2;}
    | REL_L attributes {console.log($1,JSON.stringify($2)); yy.addRel('rel_l', ...$2); $$=$2;}
    | REL_R attributes {console.log($1,JSON.stringify($2)); yy.addRel('rel_r', ...$2); $$=$2;}
    ;

attributes
    : attribute { console.log('PUSH ATTRIBUTE: ', $1); $$ = [$1]; }
    | attribute attributes { console.log('PUSH ATTRIBUTE: ', $1); $2.unshift($1); $$=$2;}
    ;

attribute
    : STR {  $$ = $1.trim(); }
    | ATTRIBUTE {  $$ = $1.trim(); }
    | ATTRIBUTE_EMPTY {  $$ = ""; }
    ;

