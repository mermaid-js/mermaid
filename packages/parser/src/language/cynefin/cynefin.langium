grammar CynefinGrammar
import "../common/common";

entry Cynefin:
    NEWLINE*
    // Accept bare keyword or colon-terminated form; both are equivalent
    ('cynefin-beta' | 'cynefin-beta:')
    NEWLINE*
    (
        TitleAndAccessibilities
        | domains+=DomainBlock
        | transitions+=Transition
        | NEWLINE
    )*
;

DomainBlock:
    domain=DOMAIN_NAME NEWLINE*
    (items+=DomainItem NEWLINE*)*
;

DomainItem:
    label=STRING
;

Transition:
    from=DOMAIN_NAME '-->' to=DOMAIN_NAME (':' label=STRING)? EOL
;

terminal DOMAIN_NAME returns string: 'complex' | 'complicated' | 'clear' | 'chaotic' | 'confusion';
