grammar Interface;

participant : LT LT ID GT GT ID EOF;

LT
  : '<'
  ;

GT
  : '>'
  ;

ID
 : [a-zA-Z_] [a-zA-Z_0-9]*
 ;

SPACE
 : [ \t] -> channel(HIDDEN)
 ;
