grammar DomainStorytellingGrammar
import "../common/common";

entry DomainStorytelling:
  NEWLINE*
  "domainstorytelling-beta"
  NEWLINE*
  TitleAndAccessibilities?
  DomainStorytellingElements*
;

fragment DomainStorytellingElements:
  groupBlocks+=GroupBlock
  | groupDefinitions+=GroupDefinition
  | actorDeclarations+=ActorDeclaration
  | workObjectDeclarations+=WorkObjectDeclaration
  | sentences+=DomainStorytellingSentence
  | annotations+=Annotation
;

GroupBlock:
  'group' id=GROUP_ID title=ACTIVITY_LABEL? ('in' parent=GROUP_ID)? '{' EOL?
  (sentences+=DomainStorytellingSentence)*
  '}' EOL
;

GroupDefinition:
  'group' id=GROUP_ID title=ACTIVITY_LABEL? ('in' parent=GROUP_ID)? EOL
;

ActorDeclaration:
  actor=ACTOR label=ACTIVITY_LABEL? icon=(ICON_REF | ID)? ('in' group=GROUP_ID)? EOL
;

WorkObjectDeclaration:
  workobject=WORKOBJECT label=ACTIVITY_LABEL? icon=(ICON_REF | ID)? EOL
;

DomainStorytellingSentence:
  actor=ACTOR ':' noOfSeq=SEQNO '--' activity=ACTIVITY_LABEL '->' workobject=WORKOBJECT ('in' group=GROUP_ID)?
  (continuations+=AdditionalWorkObject | continuations+=AdditionalActor | continuations+=ReverseActor)*
  ('id' sentenceId=SENTENCE_ID)?
  EOL
;

Annotation:
  'annotate'
  ( 'actor' actor=ACTOR
  | 'group' group=GROUP_ID
  | 'sentence' (noOfSeq=SEQNO | sentenceId=SENTENCE_ID)
  | 'workobject' workobject=WORKOBJECT '@' (workobjectSeqNo=SEQNO | workobjectSentenceId=SENTENCE_ID)
  )
  body=ACTIVITY_LABEL
  EOL?
;

AdditionalWorkObject:
  '--' activity=ACTIVITY_LABEL '->' workobject=WORKOBJECT ('in' group=GROUP_ID)?
;

AdditionalActor:
  '--' activity=ACTIVITY_LABEL '->' actor=ACTOR
;

ReverseActor:
  '<-' activity=ACTIVITY_LABEL '--' actor=ACTOR
;

terminal SEQNO returns number: /0[1-9]|[1-9][0-9]+/;
terminal ACTIVITY_LABEL returns string: /"[^"]+"|'[^']+'/;
terminal ACTOR: /A_[a-zA-Z0-9_]+/;
terminal WORKOBJECT: /W_[a-zA-Z0-9_]+/;
terminal GROUP_ID: /G_[a-zA-Z0-9_]+/;
// Iconify "pack:name" form. Prefix-less icon names (resolved against the
// built-in mermaid-domainstorytelling pack) parse via the common ID terminal
// instead — ID is ordered after the common TITLE/ACC_* terminals, so a bare
// lowercase word terminal here would shadow those line-consuming terminals
// (importing-grammar terminals are considered first; Chevrotain is first-match-wins).
terminal ICON_REF: /[a-z0-9-]+:[a-z0-9-]+/;
terminal SENTENCE_ID: /S_[a-zA-Z0-9_]+/;