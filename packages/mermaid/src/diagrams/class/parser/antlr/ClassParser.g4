parser grammar ClassParser;

options {
  tokenVocab = ClassLexer;
}

start
  : (NEWLINE)* classDiagramSection EOF
  ;

classDiagramSection
  : CLASS_DIAGRAM (NEWLINE)+ document
  ;

document
  : (line)* statement?
  ;

line
  : statement? NEWLINE
  ;

statement
  : classStatement
  | namespaceStatement
  | relationStatement
  | noteStatement
  | annotationStatement
  | memberStatement
  | classDefStatement
  | styleStatement
  | cssClassStatement
  | directionStatement
  | accTitleStatement
  | accDescrStatement
  | accDescrMultilineStatement
  | callbackStatement
  | clickStatement
  | linkStatement
  | callStatement
  ;

classStatement
  : classIdentifier classStatementTail?
  ;

classStatementTail
  : STRUCT_START classMembers? STRUCT_END
  | STYLE_SEPARATOR cssClassRef classStatementCssTail?
  ;

classStatementCssTail
  : STRUCT_START classMembers? STRUCT_END
  ;

classIdentifier
  : CLASS className classLabel?
  ;

classLabel
  : LBRACKET stringLiteral RBRACKET
  ;

cssClassRef
  : className
  | IDENTIFIER
  ;

classMembers
  : (NEWLINE | classMember)*
  ;

classMember
  : MEMBER
  | EDGE_STATE
  ;

namespaceStatement
  : namespaceIdentifier namespaceBlock
  ;

namespaceIdentifier
  : NAMESPACE namespaceName
  ;

namespaceName
  : className
  ;

namespaceBlock
  : STRUCT_START (NEWLINE)* namespaceBody? STRUCT_END
  ;

namespaceBody
  : namespaceLine+
  ;

namespaceLine
  : (classStatement | namespaceStatement)? NEWLINE
  | classStatement
  | namespaceStatement
  ;

relationStatement
  : className relation className relationLabel?
  | className stringLiteral relation className relationLabel?
  | className relation stringLiteral className relationLabel?
  | className stringLiteral relation stringLiteral className relationLabel?
  ;

relation
  : RELATION_ARROW
  ;

relationLabel
  : LABEL
  ;

noteStatement
  : NOTE_FOR className noteBody
  | NOTE noteBody
  ;

noteBody
  : stringLiteral
  ;

annotationStatement
  : ANNOTATION_START annotationName ANNOTATION_END className
  ;

annotationName
  : IDENTIFIER
  | stringLiteral
  ;

memberStatement
  : className LABEL
  ;

classDefStatement
  : CLASSDEF_LINE
  ;

styleStatement
  : STYLE_LINE
  ;

cssClassStatement
  : CSSCLASS_LINE
  ;

directionStatement
  : DIRECTION_TB
  | DIRECTION_BT
  | DIRECTION_LR
  | DIRECTION_RL
  ;

accTitleStatement
  : ACC_TITLE ACC_TITLE_VALUE
  ;

accDescrStatement
  : ACC_DESCR ACC_DESCR_VALUE
  ;

accDescrMultilineStatement
  : ACC_DESCR_MULTI ACC_DESCR_MULTILINE_VALUE ACC_DESCR_MULTI_END
  ;

callbackStatement
  : CALLBACK_LINE
  ;

clickStatement
  : CLICK_LINE
  ;

linkStatement
  : LINK_LINE
  ;

callStatement
  : CALL_LINE
  ;

stringLiteral
  : STRING
  ;

className
  : classNameSegment (DOT classNameSegment)*
  ;

classNameSegment
  : IDENTIFIER genericSuffix?
  | BACKTICK_ID genericSuffix?
  | EDGE_STATE
  ;

genericSuffix
  : GENERIC
  ;
