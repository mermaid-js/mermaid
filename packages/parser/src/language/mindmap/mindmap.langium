grammar Mindmap
import "../common/common";

entry Mindmap:
  NEWLINE*
  "mindmap"
  (
    NEWLINE* TitleAndAccessibilities root=MindmapRootNode
    | NEWLINE+ root=MindmapRootNode
  )
  NEWLINE*
;

MindmapRootNode:
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

MindmapNode:
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
hidden terminal MINDMAP_WHITESPACE: /[\t ]+(\r?\n)+/;

terminal MINDMAP_CLASS: /[\t ]*:::[^\n\r)]+/;
terminal MINDMAP_ICON: /[\t ]*::icon\([^\n\r)]+\)[\t ]*/;

terminal MINDMAP_NODE_ID: /mindmap-node-id/;
terminal MINDMAP_NODE_SQUARE_TITLE: /\[([^\n\r\]]+|[^\]]+)][\t ]*/;
terminal MINDMAP_NODE_CIRCLE_TITLE:  /\(\(([^\n\r)]+|[^)]+)\)\)[\t ]*/;
terminal MINDMAP_NODE_ROUNDED_SQUARE_TITLE: /\(([^\n\r)]+|[^)]+)\)[\t ]*/;
terminal MINDMAP_NODE_BANG_TITLE: /\)\)([^\n\r(]+|[^(]+)\(\([\t ]*/;
terminal MINDMAP_NODE_CLOUD_TITLE: /\)([^\n\r(]+|[^(]+)\([\t ]*/;
terminal MINDMAP_NODE_HEXAGON_TITLE: /{{([^\n\r}]+|[^}]+)}}[\t ]*/;
terminal MINDMAP_NODE_DEFAULT: /mindmap-node-default/;
