%lex
%%

\s+                               /* skip whitespace */
"#"[^\n]*                         /* skip line comments */
"useCase"                         return 'START';
"usecaseDiagram"                  return 'START';
"actor"                           return 'ACTOR';
"external"                        return 'EXTERNAL';
"system"                          return 'SYSTEM';
"usecase"                         return 'USECASE';
"include"                         return 'REL_INCLUDE';
"extend"                          return 'REL_EXTEND';
"generalization"                  return 'REL_GEN';
"dependency"                      return 'REL_DEP';
"realization"                     return 'REL_REAL';
"anchor"                          return 'REL_ANCHOR';
"constraint"                      return 'REL_CONST';
"containment"                     return 'REL_CONTAIN';
"as"                              return 'AS';
"-->"                             return 'ASSOC';
"..>"                             return 'DOTASSOC';
"{"                               return 'LBRACE';
"}"                               return 'RBRACE';
":"                               return 'COLON';
";"                               return 'SEMI';
"\""[^\"]*"\""                    return 'STR';
[A-Za-z_][A-Za-z0-9_]*           return 'ID';
"<<"[^>]*">>"                     return 'STEREOTYPE';
<<EOF>>                           return 'EOF';
.                                 /* skip unknown */

/lex

%start start

%%

start
  : START statements EOF { return yy.getModel(); }
  ;

statements
  : /* empty */
  | statements statement
  ;

statement
  : actorDef
  | externalDef
  | systemDef
  | relBlock
  | assocLine
  ;

/* ── actor "Label" as A; "Label2" as B; ── */
actorDef
  : ACTOR actorItems
  ;

actorItems
  : actorItem
  | actorItems SEMI actorItem
  ;

actorItem
  : STR AS ID   { yy.addActor($3, stripQuotes($1)); }
  | ID          { yy.addActor($1, $1); }
  ;

/* ── external "Label" as E; ── */
externalDef
  : EXTERNAL externalItems
  ;

externalItems
  : externalItem
  | externalItems SEMI externalItem
  ;

externalItem
  : STR AS ID   { yy.addExternal($3, stripQuotes($1)); }
  | ID          { yy.addExternal($1, $1); }
  ;

/* ── system "Label" { usecaseItems } ── */
systemDef
  : SYSTEM STR LBRACE systemBody RBRACE  { yy.setSystem(stripQuotes($2)); }
  | SYSTEM ID  LBRACE systemBody RBRACE  { yy.setSystem($2); }
  ;

systemBody
  : /* empty */
  | systemBody systemItem
  ;

systemItem
  : USECASE STR AS ID SEMI  { yy.addUseCase($4, stripQuotes($2)); }
  | USECASE ID AS ID SEMI   { yy.addUseCase($4, $2); }
  | STR AS ID SEMI          { yy.addUseCase($3, stripQuotes($1)); }
  | USECASE STR AS ID       { yy.addUseCase($4, stripQuotes($2)); }
  | USECASE ID AS ID        { yy.addUseCase($4, $2); }
  | STR AS ID               { yy.addUseCase($3, stripQuotes($1)); }
  ;

/* ── relationship blocks: include: A-->B; C-->D; ── */
relBlock
  : REL_INCLUDE COLON relPairs  { /* type set per pair */ }
  | REL_EXTEND  COLON relPairs
  | REL_GEN     COLON relPairs
  | REL_DEP     COLON relPairs
  | REL_REAL    COLON relPairs
  | REL_ANCHOR  COLON relPairs
  | REL_CONST   COLON relPairs
  | REL_CONTAIN COLON relPairs
  ;

relPairs
  : relPair
  | relPairs SEMI relPair
  ;

relPair
  : ID ASSOC ID  {
      /* grab the rel type from the text that preceded the colon */
      var t = yytext; /* won't work in jison directly – handled in action below */
      yy.addConnection($1, yy.currentRelType, $3);
    }
  ;

/* ── association: A --> B; C; D; ── */
assocLine
  : ID ASSOC assocTargets
  ;

assocTargets
  : assocTarget
  | assocTargets SEMI assocTarget
  ;

assocTarget
  : ID  { yy.addConnection(yy.lastFrom, 'association', $1); }
  ;

%%

function stripQuotes(s) {
  return s.replace(/^"|"$/g, '');
}
