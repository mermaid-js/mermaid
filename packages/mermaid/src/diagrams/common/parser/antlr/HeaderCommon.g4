lexer grammar HeaderCommon;

@members {
  // headerMode is true until the diagram header keyword is seen
  protected headerMode = true;
  // Helper to disable header mode from delegator lexers on diagram start
  protected disableHeaderMode(): void { this.headerMode = false; }
}

// Header directives: only before the diagram header keyword has been seen
// Accept optional leading spaces/tabs on the line before the directive
HEADER_DIRECTIVE: { this.headerMode }? [ \t]* '%%{' .*? '}%%';

// YAML front matter (allowed only before the diagram header)
// Use a dedicated mode to consume until the closing '---' line
FRONTMATTER: { this.headerMode }? [ \t]* '---' [ \t]* ('\r'? '\n') -> pushMode(YAML_MODE);

mode YAML_MODE;
YAML_END: [ \t]* '---' [ \t]* ('\r'? '\n') -> popMode, skip;
YAML_CONTENT: . -> skip;

// Comments (skip) - simple, broad handling; rely on longest-match to keep HEADER_DIRECTIVE intact
HASH_COMMENT: '#' ~[\r\n]* -> skip;
PERCENT_COMMENT: '%%' ~[\r\n]* -> skip;

