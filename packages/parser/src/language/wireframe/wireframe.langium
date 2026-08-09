grammar WireframeGrammar
import "../common/common";

/* ─── AST Interfaces ──────────────────────────────────────────────────────── */
// Wireframe Diagram Grammar for Langium

interface WireframeComponent {
    label?: string
    id?: string
    alignTo?: string
    info?: boolean
}

interface TextField extends WireframeComponent {
    type?: string
}

interface RichText extends WireframeComponent {}
interface MultiField extends WireframeComponent {}
interface ImageField extends WireframeComponent {}
interface PathField extends WireframeComponent {}
interface TextElement extends WireframeComponent {}
interface Paragraph extends WireframeComponent {}
interface Heading extends WireframeComponent {}
interface SubTitle extends WireframeComponent {}
interface FormattingToolbar extends WireframeComponent {}

interface TextArea extends WireframeComponent {
    rows?: number
    richtext?: boolean
    value?: string
}

interface SelectField extends WireframeComponent {
    type?: string
    options?: SelectOption[]
}

interface ComboBox extends WireframeComponent {
    options?: SelectOption[]
}

interface CheckboxField extends WireframeComponent {
    checked?: boolean
}

interface CheckboxGroup extends WireframeComponent {
    options?: CheckboxOption[]
}
interface RadioGroup extends WireframeComponent {
    options?: RadioOption[]
}

interface Button extends WireframeComponent {
    primary?: boolean
}

interface Icon extends WireframeComponent {
    glyph?: string
}

interface Canvas extends WireframeComponent {
    height?: number
}

interface TabBar extends WireframeComponent {
    tabs?: TabOption[]
    activeTab?: (string | number)
}

interface Arrow extends WireframeComponent {
    direction?: string
}

interface VCurly extends WireframeComponent {
    height?: number
}

interface VRule extends WireframeComponent {
    height?: number
}

interface Menu extends WireframeComponent {
    items?: SelectOption[]
}

interface List extends WireframeComponent {
    items?: SelectOption[]
    ordered?: boolean
}

interface Tree extends WireframeComponent {
    nodes?: TreeNode[]
}

interface WireframeSection extends WireframeComponent {
    components?: Component[]
}

interface FieldSet extends WireframeComponent {
    components?: Component[]
}

interface TitleWindow extends WireframeComponent {
    components?: Component[]
}

interface TabPane extends WireframeComponent {
    components?: Component[]
}

interface ColBlock extends WireframeComponent {
    width?: string
    components?: Component[]
}

interface Columns extends WireframeComponent {
    cols?: ColBlock[]
}

interface ContentTabs extends WireframeComponent {
    tabs?: TabOption[]
    activeTab?: (string | number)
    tabBlocks?: TabPane[]
    showTabs?: boolean
    showTabsValue?: (string | number)[]
}

interface Accordion extends WireframeComponent {
    collapsed?: boolean
    components?: Component[]
}

/* ─── Shared Fragments ─────────────────────────────────────────────────────── */

fragment Modifiers:
    (
        'id=' id=(ID | STRING) |
        'alignTo=' alignTo=(ID | STRING) |
        info?='info'
    )*
;

/* ─── Entry & Root Rules ───────────────────────────────────────────────────── */

entry WireframeDiagram:
    NEWLINE*
    ('wireframe' | 'wireframe-beta') (label=(STRING | ID))? ('size=' canvasSize=CanvasSize)?
    (
        NEWLINE
        | TitleAndAccessibilities
        | actions=ActionBar
        | '---'
        | components+=Component
    )*
    ('end')?
;

CanvasSize returns string:
    'dialog' | 'panel' | 'tablet' | 'desktop' | 'page'
;

ActionBar:
    'actions' buttons+=ActionButton+ EOL
;

ActionButton:
    '[' label=(STRING | ID) ']'
;

Component:
    TextField         |
    RichText          |
    TextArea          |
    MultiField        |
    ImageField        |
    PathField         |
    SelectField       |
    ComboBox          |
    CheckboxField     |
    CheckboxGroup     |
    RadioGroup        |
    Section           |
    FieldSet          |
    TitleWindow       |
    TextElement       |
    Paragraph         |
    Button            |
    Icon              |
    Canvas            |
    TabBar            |
    Heading           |
    SubTitle          |
    Arrow             |
    FormattingToolbar |
    VCurly            |
    VRule             |
    Menu              |
    List              |
    Tree              |
    ColBlock          |
    Columns           |
    ContentTabs       |
    Accordion
;

/* ─── Value Rules ──────────────────────────────────────────────────────────── */

SelectOption:
    value=(STRING | ID)
;

CheckboxOption:
    (selected?='*')? value=(STRING | ID)
;

RadioOption:
    (selected?='*')? value=(STRING | ID)
;

TabOption:
    value=(STRING | ID)
;

/* ─── Leaf Components ──────────────────────────────────────────────────────── */

TextField returns TextField:
    type=('textfield' | 'password' | 'numberfield' | 'datepicker') label=(STRING | ID)
    Modifiers EOL
;

RichText returns RichText:
    'richtext' label=(STRING | ID) Modifiers EOL
;

TextArea returns TextArea:
    'textarea' (label=(STRING | ID))? (value=(BACKTICK_STRING | STRING) | ('value=' value=(BACKTICK_STRING | STRING)))? (('rows=' rows=INT) | (richtext?='richtext'))* Modifiers EOL
;

MultiField returns MultiField:
    'multifield' label=(STRING | ID) Modifiers EOL
;

ImageField returns ImageField:
    'imagefield' label=(STRING | ID) Modifiers EOL
;

PathField returns PathField:
    'pathfield' label=(STRING | ID) Modifiers EOL
;

SelectField returns SelectField:
    type=(SELECT | SELECT_MULTIPLE) label=(STRING | ID)
    ('[' options+=SelectOption ((',' | NEWLINE)? options+=SelectOption)* ']')?
    Modifiers EOL
;

ComboBox returns ComboBox:
    'combobox' label=(STRING | ID)
    ('[' options+=SelectOption ((',' | NEWLINE)? options+=SelectOption)* ']')?
    Modifiers EOL
;

CheckboxField returns CheckboxField:
    CHECKBOX label=(STRING | ID) (checked?='checked')? Modifiers EOL
;

CheckboxGroup returns CheckboxGroup:
    CHECKBOXGROUP label=(STRING | ID)
    ('[' options+=CheckboxOption ((',' | NEWLINE)? options+=CheckboxOption)* ']')?
    Modifiers EOL
;

RadioGroup returns RadioGroup:
    'radiogroup' label=(STRING | ID)
    ('[' options+=RadioOption ((',' | NEWLINE)? options+=RadioOption)* ']')?
    Modifiers EOL
;

TextElement returns TextElement:
    'label' label=(STRING | ID) Modifiers EOL
;

Paragraph returns Paragraph:
    'paragraph' label=(STRING | ID) Modifiers EOL
;

Button returns Button:
    'button' label=(STRING | ID) (primary?='primary')? Modifiers EOL
;

Icon returns Icon:
    'icon' label=(STRING | ID) ('glyph=' glyph=(STRING | ID))? Modifiers EOL
;

Canvas returns Canvas:
    'canvas' label=(STRING | ID) ('height=' height=INT)? Modifiers EOL
;

TabBar returns TabBar:
    TABBAR label=(STRING | ID)
    ('[' tabs+=TabOption ((',' | NEWLINE)? tabs+=TabOption)* ']')?
    ('active=' activeTab=(STRING | ID | INT))?
    Modifiers EOL
;

Heading returns Heading:
    'heading' label=(STRING | ID) Modifiers EOL
;

SubTitle returns SubTitle:
    'subtitle' label=(STRING | ID) Modifiers EOL
;

Arrow returns Arrow:
    'arrow' label=(STRING | ID) (direction=('right' | 'left' | 'up' | 'down' | 'both'))?
    Modifiers EOL
;

FormattingToolbar returns FormattingToolbar:
    'formattingtoolbar' label=(STRING | ID) Modifiers EOL
;

VCurly returns VCurly:
    'vcurly' label=(STRING | ID) ('height=' height=INT)? Modifiers EOL
;

VRule returns VRule:
    'vrule' label=(STRING | ID) ('height=' height=INT)? Modifiers EOL
;

Menu returns Menu:
    'menu' label=(STRING | ID)
    ('[' items+=SelectOption ((',' | NEWLINE)? items+=SelectOption)* ']')?
    Modifiers EOL
;

List returns List:
    'list' label=(STRING | ID)
    ('[' items+=SelectOption ((',' | NEWLINE)? items+=SelectOption)* ']')?
    (ordered?='ordered')?
    Modifiers EOL
;

Tree returns Tree:
    'tree' label=(STRING | ID) Modifiers
    (NEWLINE | nodes+=TreeNode)*
    'end' EOL
;

TreeNode:
    'node' label=(STRING | ID) (expanded?='expanded')?
    ('>' children+=(STRING | ID) (',' children+=(STRING | ID))*)?
    EOL
;

/* ─── Layout Containers ───────────────────────────────────────────────────── */

Section returns WireframeSection:
    'section' label=(STRING | ID) Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

FieldSet returns FieldSet:
    'fieldset' label=(STRING | ID) Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

TitleWindow returns TitleWindow:
    TITLEWINDOW label=(STRING | ID) Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

ColBlock returns ColBlock:
    'col' (width=COL_WIDTH)? Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

Columns returns Columns:
    'columns' Modifiers
    (NEWLINE | cols+=ColBlock)*
    'end' EOL
;

TabPane returns TabPane:
    TAB label=(STRING | ID) Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

ContentTabs returns ContentTabs:
    TABS '[' tabs+=TabOption ((',' | NEWLINE)? tabs+=TabOption)* ']'
    ('active=' activeTab=(STRING | ID | INT))?
    ('showTabs=' showTabsValue+=(STRING | ID | INT) (',' showTabsValue+=(STRING | ID | INT))* | showTabs?='showTabs')?
    Modifiers
    (NEWLINE | tabBlocks+=TabPane)*
    'end' EOL
;

Accordion returns Accordion:
    'accordion' label=(STRING | ID) Modifiers
    (collapsed?='collapsed')?
    (NEWLINE | components+=Component)*
    'end' EOL
;

/* ─── Terminals ───────────────────────────────────────────────────────────── */

terminal CHECKBOXGROUP: /[\t ]*checkboxgroup(?!\w)/;
terminal CHECKBOX: /[\t ]*checkbox(?!\w)/;
terminal SELECT_MULTIPLE: /[\t ]*select-multiple(?!\w)/;
terminal SELECT: /[\t ]*select(?!\w)/;
terminal TABBAR: /[\t ]*tabbar(?!\w)/;
terminal TABS: /[\t ]*tabs(?!\w)/;
terminal TAB: /[\t ]*tab(?!\w)/;
terminal TITLEWINDOW: /[\t ]*titlewindow(?!\w)/;
terminal COL_WIDTH: /[0-9]+(%|px)/;
terminal BACKTICK_STRING returns string: /`([^`\\]|\\.)*`/;