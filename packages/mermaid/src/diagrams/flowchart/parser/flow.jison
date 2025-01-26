/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */

/* lexical grammar */
%lex
%x string
%x md_string
%x acc_title
%x acc_descr
%x acc_descr_multiline
%x dir
%x vertex
%x text
%x ellipseText
%x trapText
%x edgeText
%x thickEdgeText
%x dottedEdgeText
%x click
%x href
%x callbackname
%x callbackargs
%x shapeData
%x shapeDataStr
%x shapeDataEndBracket

%%
accTitle\s*":"\s*                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                               { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
// <acc_descr_multiline>.*[^\n]*                {  return "acc_descr_line"}


\@\{                                            {
                                                    // console.log('=> shapeData', yytext);
                                                    this.pushState("shapeData"); yytext=""; return 'SHAPE_DATA' }
<shapeData>["]                                  {
                                                    // console.log('=> shapeDataStr', yytext);
                                                    this.pushState("shapeDataStr");
                                                    return 'SHAPE_DATA';
                                                }
<shapeDataStr>["]                               {
                                                    // console.log('shapeData <==', yytext);
                                                    this.popState(); return 'SHAPE_DATA'}
<shapeDataStr>[^\"]+                            {
                                                    // console.log('shapeData', yytext);
                                                    const re = /\n\s*/g;
                                                    yytext = yytext.replace(re,"<br/>");
                                                    return 'SHAPE_DATA'}
<shapeData>[^}^"]+                                {
                                                    // console.log('shapeData', yytext);
                                                    return 'SHAPE_DATA';
                                                }
<shapeData>"}"                                    {
                                                    // console.log('<== root', yytext)
                                                    this.popState();
                                                }

/*
---interactivity command---
'call' adds a callback to the specified node. 'call' can only be specified when
the line was introduced with 'click'.
'call <callbackname>(<args>)' attaches the function 'callbackname' with the specified
arguments to the node that was specified by 'click'.
Function arguments are optional: 'call <callbackname>()' simply executes 'callbackname' without any arguments.
*/
"call"[\s]+             this.begin("callbackname");
<callbackname>\([\s]*\) this.popState();
<callbackname>\(        this.popState(); this.begin("callbackargs");
<callbackname>[^(]*     return 'CALLBACKNAME';
<callbackargs>\)        this.popState();
<callbackargs>[^)]*     return 'CALLBACKARGS';


<md_string>[^`"]+       { return "MD_STR";}
<md_string>[`]["]       { this.popState();}
<*>["][`]               { this.begin("md_string");}
<string>[^"]+           { return "STR"; }
<string>["]             this.popState();
<*>["]                  this.pushState("string");
"style"                 return 'STYLE';
"default"               return 'DEFAULT';
"linkStyle"             return 'LINKSTYLE';
"interpolate"           return 'INTERPOLATE';
"classDef"              return 'CLASSDEF';
"class"                 return 'CLASS';



/*
---interactivity command---
'href' adds a link to the specified node. 'href' can only be specified when the
line was introduced with 'click'.
'href "<link>"' attaches the specified link to the node that was specified by 'click'.
*/
"href"[\s]                  return 'HREF';


/*
'click' is the keyword to introduce a line that contains interactivity commands.
'click' must be followed by an existing node-id. All commands are attached to
that id.
'click <id>' can be followed by href or call commands in any desired order
*/
"click"[\s]+             this.begin("click");
<click>[\s\n]            this.popState();
<click>[^\s\n]*          return 'CLICK';

"flowchart-elk"          {if(yy.lex.firstGraph()){this.begin("dir");}  return 'GRAPH';}
"graph"                  {if(yy.lex.firstGraph()){this.begin("dir");}  return 'GRAPH';}
"flowchart"              {if(yy.lex.firstGraph()){this.begin("dir");}  return 'GRAPH';}
"subgraph"               return 'subgraph';
"end"\b\s*               return 'end';

"_self"                  return 'LINK_TARGET';
"_blank"                 return 'LINK_TARGET';
"_parent"                return 'LINK_TARGET';
"_top"                   return 'LINK_TARGET';

<dir>(\r?\n)*\s*\n       { this.popState();  return 'NODIR'; }
<dir>\s*"LR"             { this.popState();  return 'DIR'; }
<dir>\s*"RL"             { this.popState();  return 'DIR'; }
<dir>\s*"TB"             { this.popState();  return 'DIR'; }
<dir>\s*"BT"             { this.popState();  return 'DIR'; }
<dir>\s*"TD"             { this.popState();  return 'DIR'; }
<dir>\s*"BR"             { this.popState();  return 'DIR'; }
<dir>\s*"<"              { this.popState();  return 'DIR'; }
<dir>\s*">"              { this.popState();  return 'DIR'; }
<dir>\s*"^"              { this.popState();  return 'DIR'; }
<dir>\s*"v"              { this.popState();  return 'DIR'; }

.*direction\s+TB[^\n]*       return 'direction_tb';
.*direction\s+BT[^\n]*       return 'direction_bt';
.*direction\s+RL[^\n]*       return 'direction_rl';
.*direction\s+LR[^\n]*       return 'direction_lr';

[^\s\"]+\@(?=[^\{\"])               { return 'LINK_ID'; }
[0-9]+                       return 'NUM';
\#                           return 'BRKT';
":::"                        return 'STYLE_SEPARATOR';
":"                          return 'COLON';
"&"                          return 'AMP';
";"                          return 'SEMI';
","                          return 'COMMA';
"*"                          return 'MULT';

<INITIAL,edgeText>\s*[xo<]?\-\-+[-xo>]\s*          { this.popState(); return 'LINK'; }
<INITIAL>\s*[xo<]?\-\-\s*                          { this.pushState("edgeText"); return 'START_LINK'; }
<edgeText>[^-]|\-(?!\-)+                           return 'EDGE_TEXT';

<INITIAL,thickEdgeText>\s*[xo<]?\=\=+[=xo>]\s*      { this.popState(); return 'LINK'; }
<INITIAL>\s*[xo<]?\=\=\s*                           { this.pushState("thickEdgeText"); return 'START_LINK'; }
<thickEdgeText>[^=]|\=(?!=)                         return 'EDGE_TEXT';

<INITIAL,dottedEdgeText>\s*[xo<]?\-?\.+\-[xo>]?\s*   { this.popState(); return 'LINK'; }
<INITIAL>\s*[xo<]?\-\.\s*                            { this.pushState("dottedEdgeText"); return 'START_LINK'; }
<dottedEdgeText>[^\.]|\.(?!-)                        return 'EDGE_TEXT';


<*>\s*\~\~[\~]+\s*              return 'LINK';

<ellipseText>[-/\)][\)]         { this.popState(); return '-)'; }
<ellipseText>[^\(\)\[\]\{\}]|-\!\)+       return "TEXT"
<*>"(-"                         { this.pushState("ellipseText"); return '(-'; }

<text>"])"                { this.popState(); return 'STADIUMEND'; }
<*>"(["                   { this.pushState("text"); return 'STADIUMSTART'; }

<text>"]]"                { this.popState(); return 'SUBROUTINEEND'; }
<*>"[["                   { this.pushState("text"); return 'SUBROUTINESTART'; }

"[|"                      { return 'VERTEX_WITH_PROPS_START'; }

\>                    { this.pushState("text"); return 'TAGEND'; }

<text>")]"                { this.popState(); return 'CYLINDEREND'; }
<*>"[("                   { this.pushState("text") ;return 'CYLINDERSTART'; }

<text>")))"               { this.popState(); return 'DOUBLECIRCLEEND'; }
<*>"((("                  { this.pushState("text"); return 'DOUBLECIRCLESTART'; }

<trapText>[\\(?=\])][\]]  { this.popState(); return 'TRAPEND'; }
<trapText>\/(?=\])\]     { this.popState(); return 'INVTRAPEND'; }
<trapText>\/(?!\])|\\(?!\])|[^\\\[\]\(\)\{\}\/]+        return 'TEXT';
<*>"[/"                   { this.pushState("trapText"); return 'TRAPSTART'; }

<*>"[\\"                 { this.pushState("trapText"); return 'INVTRAPSTART'; }


"<"                   return 'TAGSTART';
">"                   return 'TAGEND';
"^"                   return 'UP';
"\|"                  return 'SEP';
"v"                   return 'DOWN';
"*"                   return 'MULT';
"#"                   return 'BRKT';
"&"                   return 'AMP';
([A-Za-z0-9!"\#$%&'*+\.`?\\_\/]|\-(?=[^\>\-\.])|=(?!=))+  {
    return 'NODE_STRING';
}
"-"                   return 'MINUS'
[\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6]|
[\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377]|
[\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5]|
[\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA]|
[\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE]|
[\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA]|
[\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0]|
[\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977]|
[\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2]|
[\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A]|
[\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39]|
[\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8]|
[\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C]|
[\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C]|
[\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99]|
[\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0]|
[\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D]|
[\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3]|
[\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10]|
[\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1]|
[\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81]|
[\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3]|
[\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6]|
[\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A]|
[\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081]|
[\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D]|
[\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0]|
[\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310]|
[\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C]|
[\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711]|
[\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7]|
[\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C]|
[\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16]|
[\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF]|
[\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC]|
[\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D]|
[\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D]|
[\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3]|
[\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F]|
[\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128]|
[\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184]|
[\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3]|
[\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6]|
[\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE]|
[\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C]|
[\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D]|
[\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC]|
[\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B]|
[\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788]|
[\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805]|
[\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB]|
[\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28]|
[\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5]|
[\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4]|
[\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E]|
[\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D]|
[\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36]|
[\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D]|
[\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC]|
[\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF]|
[\uFFD2-\uFFD7\uFFDA-\uFFDC]
                      return 'UNICODE_TEXT';

<text>"|"             { this.popState(); return 'PIPE'; }
<*>"|"                { this.pushState("text"); return 'PIPE'; }

<text>")"             { this.popState(); return 'PE'; }
<*>"("                { this.pushState("text"); return 'PS'; }

<text>"]"            { this.popState(); return 'SQE'; }
<*>"["                { this.pushState("text"); return 'SQS'; }

<text>(\})            { this.popState(); return 'DIAMOND_STOP' }
<*>"{"                { this.pushState("text"); return 'DIAMOND_START' }
<text>[^\[\]\(\)\{\}\|\"]+    return "TEXT";

"\""                  return 'QUOTE';
(\r?\n)+              return 'NEWLINE';
\s                    return 'SPACE';
<<EOF>>               return 'EOF';

/lex

/* operator associations and precedence */

%left '^'

%start start

%% /* language grammar */

start
  : graphConfig document
  ;


document
	: /* empty */
	{ $$ = [];}
	| document line
	{
	    if(!Array.isArray($line) || $line.length > 0){
	        $document.push($line);
	    }
	    $$=$document;}
	;

line
	: statement
	{$$=$statement;}
	| SEMI
	| NEWLINE
	| SPACE
	| EOF
	;

graphConfig
    : SPACE graphConfig
    | NEWLINE graphConfig
    | GRAPH NODIR
        { yy.setDirection('TB');$$ = 'TB';}
    | GRAPH DIR FirstStmtSeparator
        { yy.setDirection($DIR);$$ = $DIR;}
    // | GRAPH SPACE TAGEND FirstStmtSeparator
    //     { yy.setDirection("LR");$$ = $TAGEND;}
    // | GRAPH SPACE TAGSTART FirstStmtSeparator
    //     { yy.setDirection("RL");$$ = $TAGSTART;}
    // | GRAPH SPACE UP FirstStmtSeparator
    //     { yy.setDirection("BT");$$ = $UP;}
    // | GRAPH SPACE DOWN FirstStmtSeparator
    //     { yy.setDirection("TB");$$ = $DOWN;}
    ;

ending: endToken ending
      | endToken
      ;

endToken: NEWLINE | SPACE | EOF;

FirstStmtSeparator
    : SEMI | NEWLINE | spaceList NEWLINE ;


spaceListNewline
    : SPACE spaceListNewline
    | NEWLINE spaceListNewline
    | NEWLINE
    | SPACE
    ;


spaceList
    : SPACE spaceList
    | SPACE
    ;

statement
    : vertexStatement separator
    { $$=$vertexStatement.nodes}
    | styleStatement separator
    {$$=[];}
    | linkStyleStatement separator
    {$$=[];}
    | classDefStatement separator
    {$$=[];}
    | classStatement separator
    {$$=[];}
    | clickStatement separator
    {$$=[];}
    | subgraph SPACE textNoTags SQS text SQE separator document end
    {$$=yy.addSubGraph($textNoTags,$document,$text);}
    | subgraph SPACE textNoTags separator document end
    {$$=yy.addSubGraph($textNoTags,$document,$textNoTags);}
    // | subgraph SPACE textNoTags separator document end
    // {$$=yy.addSubGraph($textNoTags,$document,$textNoTags);}
    | subgraph separator document end
    {$$=yy.addSubGraph(undefined,$document,undefined);}
    | direction
    | acc_title acc_title_value  { $$=$acc_title_value.trim();yy.setAccTitle($$); }
    | acc_descr acc_descr_value  { $$=$acc_descr_value.trim();yy.setAccDescription($$); }
    | acc_descr_multiline_value { $$=$acc_descr_multiline_value.trim();yy.setAccDescription($$); }
    ;

separator: NEWLINE | SEMI | EOF ;

shapeData:
    shapeData SHAPE_DATA
    { $$ = $1 + $2; }
    | SHAPE_DATA
    { $$ = $1; }
    ;

vertexStatement: vertexStatement link node shapeData
        { /* console.warn('vs shapeData',$vertexStatement.stmt,$node, $shapeData);*/ yy.addVertex($node[$node.length-1],undefined,undefined,undefined, undefined,undefined, undefined,$shapeData); yy.addLink($vertexStatement.stmt,$node,$link); $$ = { stmt: $node, nodes: $node.concat($vertexStatement.nodes) } }
    | vertexStatement link node
        { /*console.warn('vs',$vertexStatement.stmt,$node);*/ yy.addLink($vertexStatement.stmt,$node,$link); $$ = { stmt: $node, nodes: $node.concat($vertexStatement.nodes) } }
    |  vertexStatement link node spaceList
        { /* console.warn('vs',$vertexStatement.stmt,$node); */ yy.addLink($vertexStatement.stmt,$node,$link); $$ = { stmt: $node, nodes: $node.concat($vertexStatement.nodes) } }
    |node spaceList { /*console.warn('vertexStatement: node spaceList', $node);*/ $$ = {stmt: $node, nodes:$node }}
    |node shapeData {
        /*console.warn('vertexStatement: node shapeData', $node[0], $shapeData);*/
        yy.addVertex($node[$node.length-1],undefined,undefined,undefined, undefined,undefined, undefined,$shapeData);
        $$ = {stmt: $node, nodes:$node, shapeData: $shapeData}
    }
    |node { /* console.warn('vertexStatement: single node', $node); */ $$ = {stmt: $node, nodes:$node }}
    ;

node: styledVertex
        { /*console.warn('nod', $styledVertex);*/ $$ = [$styledVertex];}
    | node shapeData spaceList AMP spaceList styledVertex
        {  yy.addVertex($node[$node.length-1],undefined,undefined,undefined, undefined,undefined, undefined,$shapeData); $$ = $node.concat($styledVertex); /*console.warn('pip2', $node[0], $styledVertex, $$);*/  }
    | node spaceList AMP spaceList styledVertex
        { $$ = $node.concat($styledVertex); /*console.warn('pip', $node[0], $styledVertex, $$);*/  }
    ;

styledVertex: vertex
        { /* console.warn('nodc', $vertex);*/ $$ = $vertex;}
    | vertex STYLE_SEPARATOR idString
        {$$ = $vertex;yy.setClass($vertex,$idString)}
    ;

vertex:  idString SQS text SQE
        {$$ = $idString;yy.addVertex($idString,$text,'square');}
    | idString DOUBLECIRCLESTART text DOUBLECIRCLEEND
        {$$ = $idString;yy.addVertex($idString,$text,'doublecircle');}
    | idString PS PS text PE PE
        {$$ = $idString;yy.addVertex($idString,$text,'circle');}
    | idString '(-' text '-)'
        {$$ = $idString;yy.addVertex($idString,$text,'ellipse');}
    | idString STADIUMSTART text STADIUMEND
        {$$ = $idString;yy.addVertex($idString,$text,'stadium');}
    | idString SUBROUTINESTART text SUBROUTINEEND
        {$$ = $idString;yy.addVertex($idString,$text,'subroutine');}
    | idString VERTEX_WITH_PROPS_START NODE_STRING\[field] COLON NODE_STRING\[value] PIPE text SQE
        {$$ = $idString;yy.addVertex($idString,$text,'rect',undefined,undefined,undefined, Object.fromEntries([[$field, $value]]));}
    | idString CYLINDERSTART text CYLINDEREND
        {$$ = $idString;yy.addVertex($idString,$text,'cylinder');}
    | idString PS text PE
        {$$ = $idString;yy.addVertex($idString,$text,'round');}
    | idString DIAMOND_START text DIAMOND_STOP
        {$$ = $idString;yy.addVertex($idString,$text,'diamond');}
    | idString DIAMOND_START DIAMOND_START text DIAMOND_STOP DIAMOND_STOP
        {$$ = $idString;yy.addVertex($idString,$text,'hexagon');}
    | idString TAGEND text SQE
        {$$ = $idString;yy.addVertex($idString,$text,'odd');}
    | idString TRAPSTART text TRAPEND
        {$$ = $idString;yy.addVertex($idString,$text,'trapezoid');}
    | idString INVTRAPSTART text INVTRAPEND
        {$$ = $idString;yy.addVertex($idString,$text,'inv_trapezoid');}
    | idString TRAPSTART text INVTRAPEND
        {$$ = $idString;yy.addVertex($idString,$text,'lean_right');}
    | idString INVTRAPSTART text TRAPEND
        {$$ = $idString;yy.addVertex($idString,$text,'lean_left');}
    | idString
        { /*console.warn('h: ', $idString);*/$$ = $idString;yy.addVertex($idString);}
    ;



link: linkStatement arrowText
    {$linkStatement.text = $arrowText;$$ = $linkStatement;}
    | linkStatement TESTSTR SPACE
    {$linkStatement.text = $TESTSTR;$$ = $linkStatement;}
    | linkStatement arrowText SPACE
    {$linkStatement.text = $arrowText;$$ = $linkStatement;}
    | linkStatement
    {$$ = $linkStatement;}
    | START_LINK edgeText LINK
        {var inf = yy.destructLink($LINK, $START_LINK); $$ = {"type":inf.type,"stroke":inf.stroke,"length":inf.length,"text":$edgeText};}
    | LINK_ID START_LINK edgeText LINK
        {var inf = yy.destructLink($LINK, $START_LINK); $$ = {"type":inf.type,"stroke":inf.stroke,"length":inf.length,"text":$edgeText, "id": $LINK_ID};}
    ;

edgeText: edgeTextToken
    {$$={text:$edgeTextToken, type:'text'};}
    | edgeText edgeTextToken
    {$$={text:$edgeText.text+''+$edgeTextToken, type:$edgeText.type};}
    |STR
    {$$={text: $STR, type: 'string'};}
    | MD_STR
    {$$={text:$MD_STR, type:'markdown'};}
    ;


linkStatement: LINK
        {var inf = yy.destructLink($LINK);$$ = {"type":inf.type,"stroke":inf.stroke,"length":inf.length};}
    | LINK_ID LINK
        {var inf = yy.destructLink($LINK);$$ = {"type":inf.type,"stroke":inf.stroke,"length":inf.length, "id": $LINK_ID};}
        ;

arrowText:
    PIPE text PIPE
    {$$ = $text;}
    ;

text: textToken
    { $$={text:$textToken, type: 'text'};}
    | text textToken
    { $$={text:$text.text+''+$textToken, type: $text.type};}
    | STR
    { $$ = {text: $STR, type: 'string'};}
    | MD_STR
    { $$={text: $MD_STR, type: 'markdown'};}
    ;



keywords
    : STYLE | LINKSTYLE | CLASSDEF | CLASS | CLICK | GRAPH | DIR | subgraph | end | DOWN | UP;


textNoTags: textNoTagsToken
    {$$={text:$textNoTagsToken, type: 'text'};}
    | textNoTags textNoTagsToken
    {$$={text:$textNoTags.text+''+$textNoTagsToken, type: $textNoTags.type};}
    | STR
    { $$={text: $STR, type: 'text'};}
    | MD_STR
    { $$={text: $MD_STR, type: 'markdown'};}
    ;


classDefStatement:CLASSDEF SPACE idString SPACE stylesOpt
    {$$ = $CLASSDEF;yy.addClass($idString,$stylesOpt);}
    ;

classStatement:CLASS SPACE idString\[vertex] SPACE idString\[class]
    {$$ = $CLASS;yy.setClass($vertex, $class);}
    ;

clickStatement
    : CLICK CALLBACKNAME                                    {$$ = $CLICK;yy.setClickEvent($CLICK, $CALLBACKNAME);}
    | CLICK CALLBACKNAME SPACE STR                          {$$ = $CLICK;yy.setClickEvent($CLICK, $CALLBACKNAME);yy.setTooltip($CLICK, $STR);}
    | CLICK CALLBACKNAME CALLBACKARGS                       {$$ = $CLICK;yy.setClickEvent($CLICK, $CALLBACKNAME, $CALLBACKARGS);}
    | CLICK CALLBACKNAME CALLBACKARGS SPACE STR             {$$ = $CLICK;yy.setClickEvent($CLICK, $CALLBACKNAME, $CALLBACKARGS);yy.setTooltip($CLICK, $STR);}
    | CLICK HREF STR                                        {$$ = $CLICK;yy.setLink($CLICK, $STR);}
    | CLICK HREF STR SPACE STR                              {$$ = $CLICK;yy.setLink($CLICK, $STR1);yy.setTooltip($CLICK, $STR2);}
    | CLICK HREF STR SPACE LINK_TARGET                      {$$ = $CLICK;yy.setLink($CLICK, $STR, $LINK_TARGET);}
    | CLICK HREF STR\[link] SPACE STR\[tooltip] SPACE LINK_TARGET      {$$ = $CLICK;yy.setLink($CLICK, $link, $LINK_TARGET);yy.setTooltip($CLICK, $tooltip);}
    | CLICK alphaNum                                        {$$ = $CLICK;yy.setClickEvent($CLICK, $alphaNum);}
    | CLICK alphaNum SPACE STR                              {$$ = $CLICK;yy.setClickEvent($CLICK, $alphaNum);yy.setTooltip($CLICK, $STR);}
    | CLICK STR                                             {$$ = $CLICK;yy.setLink($CLICK, $STR);}
    | CLICK STR\[link] SPACE STR\[tooltip]                  {$$ = $CLICK;yy.setLink($CLICK, $link);yy.setTooltip($CLICK, $tooltip);}
    | CLICK STR SPACE LINK_TARGET                           {$$ = $CLICK;yy.setLink($CLICK, $STR, $LINK_TARGET);}
    | CLICK STR\[link] SPACE STR\[tooltip] SPACE LINK_TARGET    {$$ = $CLICK;yy.setLink($CLICK, $link, $LINK_TARGET);yy.setTooltip($CLICK, $tooltip);}
    ;

styleStatement:STYLE SPACE idString SPACE stylesOpt
    {$$ = $STYLE;yy.addVertex($idString,undefined,undefined,$stylesOpt);}
    ;

linkStyleStatement
    : LINKSTYLE SPACE DEFAULT SPACE stylesOpt
          {$$ = $LINKSTYLE;yy.updateLink([$DEFAULT],$stylesOpt);}
    | LINKSTYLE SPACE numList SPACE stylesOpt
          {$$ = $LINKSTYLE;yy.updateLink($numList,$stylesOpt);}
    | LINKSTYLE SPACE DEFAULT SPACE INTERPOLATE SPACE alphaNum SPACE stylesOpt
          {$$ = $LINKSTYLE;yy.updateLinkInterpolate([$DEFAULT],$alphaNum);yy.updateLink([$DEFAULT],$stylesOpt);}
    | LINKSTYLE SPACE numList SPACE INTERPOLATE SPACE alphaNum SPACE stylesOpt
          {$$ = $LINKSTYLE;yy.updateLinkInterpolate($numList,$alphaNum);yy.updateLink($numList,$stylesOpt);}
    | LINKSTYLE SPACE DEFAULT SPACE INTERPOLATE SPACE alphaNum
          {$$ = $LINKSTYLE;yy.updateLinkInterpolate([$DEFAULT],$alphaNum);}
    | LINKSTYLE SPACE numList SPACE INTERPOLATE SPACE alphaNum
          {$$ = $LINKSTYLE;yy.updateLinkInterpolate($numList,$alphaNum);}
    ;

numList: NUM
        {$$ = [$NUM]}
    | numList COMMA NUM
        {$numList.push($NUM);$$ = $numList;}
    ;

stylesOpt: style
        {$$ = [$style]}
    | stylesOpt COMMA style
        {$stylesOpt.push($style);$$ = $stylesOpt;}
    ;

style: styleComponent
    |style styleComponent
    {$$ = $style + $styleComponent;}
    ;

styleComponent: NUM | NODE_STRING| COLON | UNIT | SPACE | BRKT | STYLE | PCT ;

/* Token lists */
idStringToken  :  NUM | NODE_STRING | DOWN | MINUS | DEFAULT | COMMA | COLON | AMP | BRKT | MULT | UNICODE_TEXT;

textToken      :   TEXT | TAGSTART | TAGEND | UNICODE_TEXT;

textNoTagsToken: NUM | NODE_STRING | SPACE | MINUS | AMP | UNICODE_TEXT | COLON | MULT | BRKT | keywords | START_LINK ;

edgeTextToken  :  EDGE_TEXT | UNICODE_TEXT ;

alphaNumToken  :  NUM | UNICODE_TEXT | NODE_STRING | DIR | DOWN | MINUS | COMMA | COLON | AMP | BRKT | MULT;

idString
    :idStringToken
    {$$=$idStringToken}
    | idString idStringToken
    {$$=$idString+''+$idStringToken}
    ;

alphaNum
    : alphaNumToken
    {$$=$alphaNumToken;}
    | alphaNum alphaNumToken
    {$$=$alphaNum+''+$alphaNumToken;}
    ;


direction
    : direction_tb
    { $$={stmt:'dir', value:'TB'};}
    | direction_bt
    { $$={stmt:'dir', value:'BT'};}
    | direction_rl
    { $$={stmt:'dir', value:'RL'};}
    | direction_lr
    { $$={stmt:'dir', value:'LR'};}
    ;

%%
