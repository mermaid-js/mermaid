grammar css3;

// This grammar follows the formal CSS2.2 grammar closely https://www.w3.org/TR/CSS22/grammar.html
// and adds some extent of error handling from https://www.w3.org/TR/CSS22/syndata.html#parsing-errors
// CSS3 modifications are then applied
// IE and vendor specific rules are added for real world usage

stylesheet
    : ws ( charset ( Comment | Space | Cdo | Cdc )* )* ( imports ( Comment | Space | Cdo | Cdc )* )* ( namespace_ ( Comment | Space | Cdo | Cdc )* )* ( nestedStatement ( Comment | Space | Cdo | Cdc )* )*
    ;

charset
    : Charset ws String_ ws ';' ws    # goodCharset
    | Charset ws String_ ws           # badCharset
    ;

imports
    : Import ws ( String_ | Uri ) ws mediaQueryList ';' ws     # goodImport
    | Import ws ( String_ | Uri ) ws ';' ws                    # goodImport
    | Import ws ( String_ | Uri ) ws mediaQueryList            # badImport
    | Import ws ( String_ | Uri ) ws                           # badImport
    ;

// Namespaces
// https://www.w3.org/TR/css-namespaces-3/
namespace_
    : Namespace ws (namespacePrefix ws)? ( String_ | Uri ) ws ';' ws    # goodNamespace
    | Namespace ws (namespacePrefix ws)? ( String_ | Uri ) ws           # badNamespace
    ;

namespacePrefix
    : ident
    ;

// Media queries
// https://www.w3.org/TR/css3-mediaqueries/
media
    : Media ws mediaQueryList groupRuleBody ws
    ;

mediaQueryList
    : ( mediaQuery ( Comma ws mediaQuery )* )? ws
    ;

mediaQuery
    : ( MediaOnly | Not )? ws mediaType ws ( And ws mediaExpression )*
    | mediaExpression ( And ws mediaExpression )*
    ;

mediaType
    : ident
    ;

mediaExpression
    : '(' ws mediaFeature ( ':' ws expr )? ')' ws    // Grammar allows for 'and(', which gets tokenized as Function. In practice, people always insert space before '(' to have it work on Chrome.
    ;

mediaFeature
    : ident ws
    ;

// Page
page
    : Page ws pseudoPage? '{' ws declaration? ( ';' ws declaration? )* '}' ws
    ;

pseudoPage
    : ':' ident ws
    ;

// Selectors
// https://www.w3.org/TR/css3-selectors/
selectorGroup
    : selector ( Comma ws selector )*
    ;

selector
    : simpleSelectorSequence ws ( combinator simpleSelectorSequence ws )*
    ;

combinator
    : Plus ws
    | Greater ws
    | Tilde ws
    | Space ws
    ;

simpleSelectorSequence
    : ( typeSelector | universal ) ( Hash | className | attrib | pseudo | negation )*
    | ( Hash | className | attrib | pseudo | negation )+
    ;

typeSelector
    : typeNamespacePrefix? elementName
    ;

typeNamespacePrefix
    : ( ident | '*' )? '|'
    ;

elementName
    : ident
    ;

universal
    : typeNamespacePrefix? '*'
    ;

className
    : '.' ident
    ;

attrib
    : '[' ws typeNamespacePrefix? ident ws ( ( PrefixMatch | SuffixMatch | SubstringMatch | '=' | Includes | DashMatch ) ws ( ident | String_ ) ws )? ']'
    ;

pseudo
    /* '::' starts a pseudo-element, ':' a pseudo-class */
    /* Exceptions: :first-line, :first-letter, :before And :after. */
    /* Note that pseudo-elements are restricted to one per selector And */
    /* occur MediaOnly in the last simple_selector_sequence. */
    : ':' ':'? ( ident | functionalPseudo )
    ;

functionalPseudo
    : Function_ ws expression ')'
    ;

expression
    /* In CSS3, the expressions are identifiers, strings, */
    /* or of the form "an+b" */
    : ( ( Plus | Minus | Dimension | UnknownDimension | Number | String_ | ident ) ws )+
    ;

negation
    : PseudoNot ws negationArg ws ')'
    ;

negationArg
    : typeSelector
    | universal
    | Hash
    | className
    | attrib
    | pseudo
    ;

// Rules
operator_
    : '/' ws      # goodOperator
    | Comma ws    # goodOperator
    | Space ws    # goodOperator
    | '=' ws      # badOperator  // IE filter and DXImageTransform function
    ;

property_
    : ident ws       # goodProperty
    | Variable ws    # goodProperty
    | '*' ident      # badProperty  // IE hacks
    | '_' ident      # badProperty  // IE hacks
    ;

ruleset
    : selectorGroup '{' ws declarationList? '}' ws    # knownRuleset
    | any_* '{' ws declarationList? '}' ws             # unknownRuleset
    ;

declarationList
    : ( ';' ws )* declaration ws ( ';' ws declaration? )*
    ;

declaration
    : property_ ':' ws expr prio?    # knownDeclaration
    | property_ ':' ws value         # unknownDeclaration
    ;

prio
    : Important ws
    ;

value
    : ( any_ | block | atKeyword ws )+
    ;

expr
    : term ( operator_? term )*
    ;

term
    : number ws              # knownTerm
    | percentage ws          # knownTerm
    | dimension ws           # knownTerm
    | String_ ws              # knownTerm
    | UnicodeRange ws        # knownTerm
    | ident ws               # knownTerm
    | var_                   # knownTerm
    | Uri ws                 # knownTerm
    | hexcolor               # knownTerm
    | calc                   # knownTerm
    | function_              # knownTerm
    | unknownDimension ws    # unknownTerm
    | dxImageTransform       # badTerm
    ;

function_
    : Function_ ws expr ')' ws
    ;

dxImageTransform
    : DxImageTransform ws expr ')' ws    // IE DXImageTransform function
    ;

hexcolor
    : Hash ws
    ;

number
    : ( Plus | Minus )? Number
    ;

percentage
    : ( Plus | Minus )? Percentage
    ;

dimension
    : ( Plus | Minus )? Dimension
    ;

unknownDimension
    : ( Plus | Minus )? UnknownDimension
    ;

// Error handling
any_
    : ident ws
    | number ws
    | percentage ws
    | dimension ws
    | unknownDimension ws
    | String_ ws
    //| Delim ws    // Not implemented yet
    | Uri ws
    | Hash ws
    | UnicodeRange ws
    | Includes ws
    | DashMatch ws
    | ':' ws
    | Function_ ws ( any_ | unused )* ')' ws
    | '(' ws ( any_ | unused )* ')' ws
    | '[' ws ( any_ | unused )* ']' ws
    ;

atRule
    : atKeyword ws any_* ( block | ';' ws )    # unknownAtRule
    ;

atKeyword
    : '@' ident
    ;

unused
    : block
    | atKeyword ws
    | ';' ws
    | Cdo ws
    | Cdc ws
    ;

block
    : '{' ws (  declarationList | nestedStatement | any_ | block | atKeyword ws | ';' ws )* '}' ws
    ;

// Conditional
// https://www.w3.org/TR/css3-conditional/
nestedStatement
    : ruleset
    | media
    | page
    | fontFaceRule
    | keyframesRule
    | supportsRule
    | viewport
    | counterStyle
    | fontFeatureValuesRule
    | atRule
    ;

groupRuleBody
    : '{' ws nestedStatement* '}' ws
    ;

supportsRule
    : Supports ws supportsCondition ws groupRuleBody
    ;

supportsCondition
    : supportsNegation
    | supportsConjunction
    | supportsDisjunction
    | supportsConditionInParens
    ;

supportsConditionInParens
    : '(' ws supportsCondition ws ')'
    | supportsDeclarationCondition
    | generalEnclosed
    ;

supportsNegation
    : Not ws Space ws supportsConditionInParens
    ;

supportsConjunction
    : supportsConditionInParens ( ws Space ws And ws Space ws supportsConditionInParens )+
    ;

supportsDisjunction
    : supportsConditionInParens ( ws Space ws Or ws Space ws supportsConditionInParens )+
    ;

supportsDeclarationCondition
    : '(' ws declaration ')'
    ;

generalEnclosed
    : ( Function_ | '(' ) ( any_ | unused )* ')'
    ;

// Variable
// https://www.w3.org/TR/css-variables-1
var_
    : Var ws Variable ws ')' ws
    ;

// Calc
// https://www.w3.org/TR/css3-values/#calc-syntax
calc
    : Calc ws calcSum ')' ws
    ;

calcSum
    : calcProduct ( Space ws ( Plus | Minus ) ws Space ws calcProduct )*
    ;

calcProduct
    : calcValue ( '*' ws calcValue | '/' ws number ws )*
    ;

calcValue
    : number ws
    | dimension ws
    | unknownDimension ws
    | percentage ws
    | '(' ws calcSum ')' ws
    ;

// Font face
// https://www.w3.org/TR/2013/CR-css-fonts-3-20131003/#font-face-rule
fontFaceRule
    : FontFace ws '{' ws fontFaceDeclaration? ( ';' ws fontFaceDeclaration? )* '}' ws
    ;

fontFaceDeclaration
    : property_ ':' ws expr     # knownFontFaceDeclaration
    | property_ ':' ws value    # unknownFontFaceDeclaration
    ;

// Animations
// https://www.w3.org/TR/css3-animations/
keyframesRule
    : Keyframes ws Space ws ident ws '{' ws keyframesBlocks '}' ws
    ;

keyframesBlocks
    : ( keyframeSelector '{' ws declarationList? '}' ws )*
    ;

keyframeSelector
    : ( From | To | Percentage ) ws ( Comma ws ( From | To | Percentage ) ws )*
    ;

// Viewport
// https://www.w3.org/TR/css-device-adapt-1/
viewport
    : Viewport ws '{' ws declarationList? '}' ws
    ;

// Counter style
// https://www.w3.org/TR/css-counter-styles-3/
counterStyle
    : CounterStyle ws ident ws '{' ws declarationList? '}' ws
    ;

// Font feature values
// https://www.w3.org/TR/css-fonts-3/
fontFeatureValuesRule
    : FontFeatureValues ws fontFamilyNameList ws '{' ws featureValueBlock* '}' ws
    ;

fontFamilyNameList
    : fontFamilyName ( ws Comma ws fontFamilyName )*
    ;

fontFamilyName
    : String_
    | ident ( ws ident )*
    ;

featureValueBlock
    : featureType ws '{' ws featureValueDefinition? ( ws ';' ws featureValueDefinition? )* '}' ws
    ;

featureType
    : atKeyword
    ;

featureValueDefinition
    : ident ws ':' ws number ( ws number )*
    ;

// The specific words can be identifiers too
ident
    : Ident
    | MediaOnly
    | Not
    | And
    | Or
    | From
    | To
    ;

// Comments might be part of CSS hacks, thus pass them to visitor to decide whether to skip
// Spaces are significant around '+' '-' '(', thus they should not be skipped
ws
    : ( Comment | Space )*
    ;

// Tokens
fragment Hex
    : [0-9a-fA-F]
    ;

fragment NewlineOrSpace
    : '\r\n'
    | [ \t\r\n\f]
    |
    ;

fragment Unicode
    : '\\' Hex Hex? Hex? Hex? Hex? Hex? NewlineOrSpace
    ;

fragment Escape
    : Unicode
    | '\\' ~[\r\n\f0-9a-fA-F]
    ;

fragment Nmstart
    : [_a-zA-Z]
    | Nonascii
    | Escape
    ;

fragment Nmchar
    : [_a-zA-Z0-9\-]
    | Nonascii
    | Escape
    ;

// CSS2.2 Grammar defines the following, but I'm not sure how to add them to parser for error handling
// BadString :
// BadUri :
// BadComment :
// BadUri :

Comment
    : '/*' ~'*'* '*'+ ( ~[/*] ~'*'* '*'+ )* '/'
    ;

fragment Name
    : Nmchar+
    ;

fragment Url
    : ( [!#$%&*-~] | Nonascii | Escape )*
    ;

Space
    : [ \t\r\n\f]+
    ;

fragment Whitespace
    : Space
    |
    ;

fragment Newline
    : '\n'
    | '\r\n'
    | '\r'
    | '\f'
    ;

fragment ZeroToFourZeros
    : '0'? '0'? '0'? '0'?
    ;

fragment A
    : 'a'
    | 'A'
    | '\\' ZeroToFourZeros ('41'|'61') NewlineOrSpace
    ;

fragment B
    : 'b'
    | 'B'
    | '\\' ZeroToFourZeros ('42'|'62') NewlineOrSpace
    ;

fragment C
    : 'c'
    | 'C'
    | '\\' ZeroToFourZeros ('43'|'63') NewlineOrSpace
    ;

fragment D
    : 'd'
    | 'D'
    | '\\' ZeroToFourZeros ('44'|'64') NewlineOrSpace
    ;

fragment E
    : 'e'
    | 'E'
    | '\\' ZeroToFourZeros ('45'|'65') NewlineOrSpace
    ;

fragment F
    : 'f'
    | 'F'
    | '\\' ZeroToFourZeros ('46'|'66') NewlineOrSpace
    ;

fragment G
    : 'g'
    | 'G'
    | '\\' ZeroToFourZeros ('47'|'67') NewlineOrSpace
    | '\\g'
    | '\\G'
    ;

fragment H
    : 'h'
    | 'H'
    | '\\' ZeroToFourZeros ('48'|'68') NewlineOrSpace
    | '\\h'
    | '\\H'
    ;

fragment I
    : 'i'
    | 'I'
    | '\\' ZeroToFourZeros ('49'|'69') NewlineOrSpace
    | '\\i'
    | '\\I'
    ;

fragment K
    : 'k'
    | 'K'
    | '\\' ZeroToFourZeros ('4b'|'6b') NewlineOrSpace
    | '\\k'
    | '\\K'
    ;

fragment L
    : 'l'
    | 'L'
    | '\\' ZeroToFourZeros ('4c'|'6c') NewlineOrSpace
    | '\\l'
    | '\\L'
    ;

fragment M
    : 'm'
    | 'M'
    | '\\' ZeroToFourZeros ('4d'|'6d') NewlineOrSpace
    | '\\m'
    | '\\M'
    ;

fragment N
    : 'n'
    | 'N'
    | '\\' ZeroToFourZeros ('4e'|'6e') NewlineOrSpace
    | '\\n'
    | '\\N'
    ;

fragment O
    : 'o'
    | 'O'
    | '\\' ZeroToFourZeros ('4f'|'6f') NewlineOrSpace
    | '\\o'
    | '\\O'
    ;

fragment P
    : 'p'
    | 'P'
    | '\\' ZeroToFourZeros ('50'|'70') NewlineOrSpace
    | '\\p'
    | '\\P'
    ;

fragment Q
    : 'q'
    | 'Q'
    | '\\' ZeroToFourZeros ('51'|'71') NewlineOrSpace
    | '\\q'
    | '\\Q'
    ;

fragment R
    : 'r'
    | 'R'
    | '\\' ZeroToFourZeros ('52'|'72') NewlineOrSpace
    | '\\r'
    | '\\R'
    ;

fragment S
    : 's'
    | 'S'
    | '\\' ZeroToFourZeros ('53'|'73') NewlineOrSpace
    | '\\s'
    | '\\S'
    ;

fragment T
    : 't'
    | 'T'
    | '\\' ZeroToFourZeros ('54'|'74') NewlineOrSpace
    | '\\t'
    | '\\T'
    ;

fragment U
    : 'u'
    | 'U'
    | '\\' ZeroToFourZeros ('55'|'75') NewlineOrSpace
    | '\\u'
    | '\\U'
    ;

fragment V
    : 'v'
    | 'V'
    | '\\' ZeroToFourZeros ('56'|'76') NewlineOrSpace
    | '\\v'
    | '\\V'
    ;

fragment W
    : 'w'
    | 'W'
    | '\\' ZeroToFourZeros ('57'|'77') NewlineOrSpace
    | '\\w'
    | '\\W'
    ;

fragment X
    : 'x'
    | 'X'
    | '\\' ZeroToFourZeros ('58'|'78') NewlineOrSpace
    | '\\x'
    | '\\X'
    ;

fragment Y
    : 'y'
    | 'Y'
    | '\\' ZeroToFourZeros ('59'|'79') NewlineOrSpace
    | '\\y'
    | '\\Y'
    ;

fragment Z
    : 'z'
    | 'Z'
    | '\\' ZeroToFourZeros ('5a'|'7a') NewlineOrSpace
    | '\\z'
    | '\\Z'
    ;

fragment DashChar
    : '-'
    | '\\' ZeroToFourZeros '2d' NewlineOrSpace
    ;

Cdo
    : '<!--'
    ;

Cdc
    : '-->'
    ;

Includes
    : '~='
    ;

DashMatch
    : '|='
    ;

Hash
    : '#' Name
    ;

Import
    : '@' I M P O R T
    ;

Page
    : '@' P A G E
    ;

Media
    : '@' M E D I A
    ;

Namespace
    : '@' N A M E S P A C E
    ;

fragment AtKeyword
    : '@' Ident
    ;

Charset
    : '@charset '
    ;

Important
    : '!' ( Space | Comment )* I M P O R T A N T
    ;

fragment FontRelative
    : Number E M
    | Number E X
    | Number C H
    | Number R E M
    ;

// https://www.w3.org/TR/css3-values/#viewport-relative-lengths
fragment ViewportRelative
    : Number V W
    | Number V H
    | Number V M I N
    | Number V M A X
    ;

fragment AbsLength
    : Number P X
    | Number C M
    | Number M M
    | Number I N
    | Number P T
    | Number P C
    | Number Q
    ;

fragment Angle
    : Number D E G
    | Number R A D
    | Number G R A D
    | Number T U R N
    ;

fragment Time
    : Number M S
    | Number S
    ;

fragment Freq
    : Number H Z
    | Number K H Z
    ;

Percentage
    : Number '%'
    ;

Uri
    : U R L '(' Whitespace String_ Whitespace ')'
    | U R L '(' Whitespace Url Whitespace ')'
    ;

UnicodeRange
    : [u|U] '+?' '?'? '?'? '?'? '?'? '?'?
    | [u|U] '+' Hex '?'? '?'? '?'? '?'? '?'?
    | [u|U] '+' Hex Hex '?'? '?'? '?'? '?'?
    | [u|U] '+' Hex Hex Hex '?'? '?'? '?'?
    | [u|U] '+' Hex Hex Hex Hex '?'? '?'?
    | [u|U] '+' Hex Hex Hex Hex Hex '?'?
    ;

// https://www.w3.org/TR/css3-mediaqueries/
MediaOnly
    : O N L Y
    ;

Not
    : N O T
    ;

And
    : A N D
    ;

fragment Resolution
    : Number D P I
    | Number D P C M
    | Number D P P X
    ;

fragment Length
    : AbsLength
    | FontRelative
    | ViewportRelative
    ;

Dimension
    : Length
    | Time
    | Freq
    | Resolution
    | Angle
    ;

UnknownDimension
    : Number Ident
    ;

// https://www.w3.org/TR/css3-selectors/
fragment Nonascii
    : ~[\u0000-\u007f]
    ;

Plus
    : '+'
    ;

Minus
    : '-'
    ;

Greater
    : '>'
    ;

Comma
    : ','
    ;

Tilde
    : '~'
    ;

PseudoNot
    : ':' N O T '('
    ;

Number
    : [0-9]+
    | [0-9]* '.' [0-9]+
    ;

String_
    : '"' ( ~[\n\r\f\\"] | '\\' Newline | Nonascii | Escape )* '"'
    | '\'' ( ~[\n\r\f\\'] | '\\' Newline | Nonascii | Escape )* '\''
    ;

PrefixMatch
    : '^='
    ;

SuffixMatch
    : '$='
    ;

SubstringMatch
    : '*='
    ;

// https://www.w3.org/TR/css-fonts-3/#font-face-rule
FontFace
    : '@' F O N T DashChar F A C E
    ;

// https://www.w3.org/TR/css3-conditional/
Supports
    : '@' S U P P O R T S
    ;

Or
    : O R
    ;

// https://www.w3.org/TR/css3-animations/
fragment VendorPrefix
    : '-' M O Z '-'
    | '-' W E B K I T '-'
    | '-' O '-'
    ;

Keyframes
    : '@' VendorPrefix? K E Y F R A M E S
    ;

From
    : F R O M
    ;

To
    : T O
    ;

// https://www.w3.org/TR/css3-values/#calc-syntax
Calc
    : 'calc('
    ;

// https://www.w3.org/TR/css-device-adapt-1/
Viewport
    : '@' V I E W P O R T
    ;

// https://www.w3.org/TR/css-counter-styles-3/
CounterStyle
    : '@' C O U N T E R DashChar S T Y L E
    ;

// https://www.w3.org/TR/css-fonts-3/
FontFeatureValues
    : '@' F O N T DashChar F E A T U R E DashChar V A L U E S
    ;

// https://msdn.microsoft.com/en-us/library/ms532847.aspx
DxImageTransform
    : 'progid:DXImageTransform.Microsoft.' Function_
    ;

// Variables
// https://www.w3.org/TR/css-variables-1
Variable
    : '--' Nmstart Nmchar*
    ;

Var
    : 'var('
    ;

// Give Ident least priority so that more specific rules matches first
Ident
    : '-'? Nmstart Nmchar*
    ;

Function_
    : Ident '('
    ;
