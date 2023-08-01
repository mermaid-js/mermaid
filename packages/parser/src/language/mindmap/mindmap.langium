grammar Mindmap

// common stuff in ../common/common.langium
// can't import directly because of MINDMAP_NODE_ID and MINDMAP_NODE_DEFAULT parse rules
fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /[\t ]*(?:accDescr(?:[\t ]*:[\t ]*[^\n\r]*?(?=%%)|\s*{[^}]*})|accDescr(?:[\t ]*:[\t ]*[^\n\r]*|\s*{[^}]*}))/;
terminal ACC_TITLE: /[\t ]*(?:accTitle[\t ]*:[\t ]*[^\n\r]*?(?=%%)|accTitle[\t ]*:[\t ]*[^\n\r]*)/;
terminal TITLE: /[\t ]*(?:title(?:[\t ]+[^\n\r]*?|)(?=%%)|title(?:[\t ]+[^\n\r]*|))/;

hidden terminal YAML: /---[\t ]*\r?\n[\s\S]*?---[\t ]*(?!.)/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*\n*/;

// actual grammar

interface Mindmap {
  accDescr?: string;
  accTitle?: string;
  title?: string;
  root: Node;
}

interface Node {
  id?: string;
  title: string;
  type?: 'default' | 'square' | 'rounded-square' | 'circle' | 'bang' | 'cloud' | 'hexagon';
  children: Node[]
  class?: string;
  icon?: string;
}

entry Mindmap returns Mindmap:
  NEWLINE*
  "mindmap"
  (
    NEWLINE* TitleAndAccessibilities root=MindmapRootNode
    | NEWLINE+ root=MindmapRootNode
  )
  NEWLINE*
;

MindmapRootNode returns Node:
  (
    MINDMAP_INDENT
    id=MINDMAP_NODE_ID?
    title=(
      MINDMAP_NODE_SQUARE_TITLE
      | MINDMAP_NODE_CIRCLE_TITLE
      | MINDMAP_NODE_ROUNDED_SQUARE_TITLE
      | MINDMAP_NODE_BANG_TITLE
      | MINDMAP_NODE_CLOUD_TITLE
      | MINDMAP_NODE_HEXAGON_TITLE
      | MINDMAP_NODE_DEFAULT
    )
    NEWLINE+
    MindmapClassAndIcon*
    children+=MindmapNode*
    MINDMAP_OUTDENT
    | id=MINDMAP_NODE_ID?
    title=(
      MINDMAP_NODE_SQUARE_TITLE
      | MINDMAP_NODE_CIRCLE_TITLE
      | MINDMAP_NODE_ROUNDED_SQUARE_TITLE
      | MINDMAP_NODE_BANG_TITLE
      | MINDMAP_NODE_CLOUD_TITLE
      | MINDMAP_NODE_HEXAGON_TITLE
      | MINDMAP_NODE_DEFAULT
    )
    NEWLINE+
    MindmapClassAndIcon*
    children+=MindmapNode*
  )
;

MindmapNode returns Node:
  MINDMAP_INDENT
  id=MINDMAP_NODE_ID?
  title=(
    MINDMAP_NODE_SQUARE_TITLE
    | MINDMAP_NODE_CIRCLE_TITLE
    | MINDMAP_NODE_ROUNDED_SQUARE_TITLE
    | MINDMAP_NODE_BANG_TITLE
    | MINDMAP_NODE_CLOUD_TITLE
    | MINDMAP_NODE_HEXAGON_TITLE
    | MINDMAP_NODE_DEFAULT
  )
  NEWLINE+
  MindmapClassAndIcon*
  children+=MindmapNode*
  MINDMAP_OUTDENT
;

fragment MindmapClassAndIcon:
  (
    class=MINDMAP_CLASS
    | icon=MINDMAP_ICON
  )
  NEWLINE+
;

terminal MINDMAP_OUTDENT: /mindmap-outdent/;
terminal MINDMAP_INDENT: /mindmap-indent/;
hidden terminal MINDMAP_WHITESPACE: /[\t ]+/;

terminal MINDMAP_CLASS: /:::[^\n\r)]+/;
terminal MINDMAP_ICON: /::icon\([^\n\r)]+\)[\t ]*/;

terminal MINDMAP_NODE_ID: /mindmap-node-id/;
terminal MINDMAP_NODE_SQUARE_TITLE: /\[("[^"]+"|[^\]]+)][\t ]*/;
terminal MINDMAP_NODE_CIRCLE_TITLE:  /\(\(("[^"]+"|[^)]+)\)\)[\t ]*/;
terminal MINDMAP_NODE_ROUNDED_SQUARE_TITLE: /\(("[^"]+"|[^)]+)\)[\t ]*/;
terminal MINDMAP_NODE_BANG_TITLE: /\)\)("[^"]+"|[^(]+)\(\([\t ]*/;
terminal MINDMAP_NODE_CLOUD_TITLE: /\)("[^"]+"|[^(]+)\([\t ]*/;
terminal MINDMAP_NODE_HEXAGON_TITLE: /{{("[^"]+"|[^}]+)}}[\t ]*/;
terminal MINDMAP_NODE_DEFAULT: /mindmap-node-default/;
