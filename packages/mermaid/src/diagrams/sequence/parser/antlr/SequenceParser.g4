parser grammar SequenceParser;

options {
  tokenVocab = SequenceLexer;
}

start: header SD document EOF;

header: (NEWLINE | HEADER_DIRECTIVE | FRONTMATTER)*;

document: (line | loopBlock | rectBlock | boxBlock | optBlock | altBlock | parBlock | parOverBlock | breakBlock | criticalBlock)* statement?;

line: statement? NEWLINE;

statement
  : participantStatement
  | createStatement
  | destroyStatement
  | signalStatement
  | noteStatement
  | linksStatement
  | linkStatement
  | propertiesStatement
  | detailsStatement
  | activationStatement
  | autonumberStatement
  | titleStatement
  | legacyTitleStatement
  | accTitleStatement
  | accDescrStatement
  | accDescrMultilineStatement
  ;

createStatement
  : CREATE (PARTICIPANT | PARTICIPANT_ACTOR) actor (AS restOfLine)?
  ;

destroyStatement
  : DESTROY actor
  ;

participantStatement
  : PARTICIPANT actorWithConfig
  | (PARTICIPANT | PARTICIPANT_ACTOR) actor (AS restOfLine)?
  ;

actorWithConfig
  : ACTOR configObject
  ;

configObject
  : CONFIG_START CONFIG_CONTENT CONFIG_END
  ;

signalStatement
  : actor signaltype (PLUS actor | MINUS actor | actor) text2
  ;
noteStatement
  : NOTE RIGHT_OF actor text2
  | NOTE LEFT_OF actor text2
  | NOTE OVER actor (COMMA actor)? text2
  ;

linksStatement
  : LINKS actor text2
  ;

linkStatement
  : LINK actor text2
  ;

propertiesStatement
  : PROPERTIES actor text2
  ;

detailsStatement
  : DETAILS actor text2
  ;

autonumberStatement
  : AUTONUMBER                            // enable default numbering
  | AUTONUMBER OFF                        // disable numbering
  | AUTONUMBER ACTOR                      // start value
  | AUTONUMBER ACTOR ACTOR                // start and step
  ;

activationStatement
  : ACTIVATE actor
  | DEACTIVATE actor
  ;
titleStatement
  : TITLE
  | TITLE restOfLine
  | TITLE ACTOR+          // title without colon
  ;
accTitleStatement
  : ACC_TITLE ACC_TITLE_VALUE
  ;
accDescrStatement
  : ACC_DESCR ACC_DESCR_VALUE
  ;
accDescrMultilineStatement
  : ACC_DESCR_MULTI ACC_DESCR_MULTILINE_VALUE ACC_DESCR_MULTILINE_END
  ;
legacyTitleStatement
  : LEGACY_TITLE
  ;

// Blocks
loopBlock: LOOP restOfLine? document END;
rectBlock: RECT restOfLine? document END;
boxBlock: BOX restOfLine? document END;
optBlock: OPT restOfLine? document END;
altBlock: ALT restOfLine? altSections END;
parBlock: PAR restOfLine? parSections END;
parOverBlock: PAR_OVER restOfLine? parSections END;
breakBlock: BREAK restOfLine? document END;
criticalBlock: CRITICAL restOfLine? optionSections END;

altSections: document (elseSection)*;
elseSection: ELSE restOfLine? document;

parSections: document (andSection)*;
andSection: AND restOfLine? document;

optionSections: document (optionSection)*;
optionSection: OPTION restOfLine? document;






actor: ACTOR;

signaltype
  : SOLID_ARROW
  | DOTTED_ARROW
  | SOLID_OPEN_ARROW
  | DOTTED_OPEN_ARROW
  | SOLID_CROSS
  | DOTTED_CROSS
  | SOLID_POINT
  | DOTTED_POINT
  | BIDIRECTIONAL_SOLID_ARROW
  | BIDIRECTIONAL_DOTTED_ARROW
  ;

restOfLine: TXT;

text2: TXT;

