grammar WireframeGrammar
import "../common/common";

/* ─── AST Interfaces ──────────────────────────────────────────────────────── */

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
    activeTab?: number
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

interface Section extends WireframeComponent {
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
    activeTab?: number
    tabBlocks?: TabPane[]
}

interface Accordion extends WireframeComponent {
    collapsed?: boolean
    components?: Component[]
}

/* ─── Shared Fragments ─────────────────────────────────────────────────────── */

fragment Modifiers:
    ('id=' id=ID)? ('alignTo=' alignTo=ID)? (info?='info')?
;

/* ─── Entry & Root Rules ───────────────────────────────────────────────────── */

entry WireframeDiagram:
    NEWLINE*
    'wireframe' label=STRING ('size=' canvasSize=CanvasSize)?
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
    type=('textfield' | 'password' | 'numberfield' | 'datepicker') label=STRING
    Modifiers EOL
;

RichText returns RichText:
    'richtext' label=STRING Modifiers EOL
;

TextArea returns TextArea:
    'textarea' label=STRING ('rows=' rows=INT)? Modifiers EOL
;

MultiField returns MultiField:
    'multifield' label=STRING Modifiers EOL
;

ImageField returns ImageField:
    'imagefield' label=STRING Modifiers EOL
;

PathField returns PathField:
    'pathfield' label=STRING Modifiers EOL
;

SelectField returns SelectField:
    type=('select' | 'select-multiple') label=STRING
    ('[' options+=SelectOption (',' options+=SelectOption)* ']')?
    Modifiers EOL
;

ComboBox returns ComboBox:
    'combobox' label=STRING
    ('[' options+=SelectOption (',' options+=SelectOption)* ']')?
    Modifiers EOL
;

CheckboxField returns CheckboxField:
    'checkbox' label=STRING (checked?='checked')? Modifiers EOL
;

CheckboxGroup returns CheckboxGroup:
    'checkboxgroup' label=STRING
    ('[' options+=CheckboxOption (',' options+=CheckboxOption)* ']')?
    Modifiers EOL
;

RadioGroup returns RadioGroup:
    'radiogroup' label=STRING
    ('[' options+=RadioOption (',' options+=RadioOption)* ']')?
    Modifiers EOL
;

TextElement returns TextElement:
    'label' label=STRING Modifiers EOL
;

Paragraph returns Paragraph:
    'paragraph' label=STRING Modifiers EOL
;

Button returns Button:
    'button' label=STRING (primary?='primary')? Modifiers EOL
;

Icon returns Icon:
    'icon' label=STRING ('glyph=' glyph=STRING)? Modifiers EOL
;

Canvas returns Canvas:
    'canvas' label=STRING ('height=' height=INT)? Modifiers EOL
;

TabBar returns TabBar:
    'tabbar' label=STRING
    ('[' tabs+=TabOption (',' tabs+=TabOption)* ']')?
    ('active=' activeTab=INT)?
    Modifiers EOL
;

Heading returns Heading:
    'heading' label=STRING Modifiers EOL
;

SubTitle returns SubTitle:
    'subtitle' label=STRING Modifiers EOL
;

Arrow returns Arrow:
    'arrow' label=STRING (direction=('right' | 'left' | 'up' | 'down' | 'both'))?
    Modifiers EOL
;

FormattingToolbar returns FormattingToolbar:
    'formattingtoolbar' label=STRING Modifiers EOL
;

VCurly returns VCurly:
    'vcurly' label=STRING ('height=' height=INT)? Modifiers EOL
;

VRule returns VRule:
    'vrule' label=STRING ('height=' height=INT)? Modifiers EOL
;

Menu returns Menu:
    'menu' label=STRING
    ('[' items+=SelectOption (',' items+=SelectOption)* ']')?
    Modifiers EOL
;

List returns List:
    'list' label=STRING
    ('[' items+=SelectOption (',' items+=SelectOption)* ']')?
    (ordered?='ordered')?
    Modifiers EOL
;

Tree returns Tree:
    'tree' label=STRING Modifiers
    (NEWLINE | nodes+=TreeNode)*
    'end' EOL
;

TreeNode:
    'node' label=STRING (expanded?='expanded')?
    ('>' children+=(STRING | ID) (',' children+=(STRING | ID))*)?
    EOL
;

/* ─── Layout Containers ───────────────────────────────────────────────────── */

Section returns Section:
    'section' label=STRING Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

FieldSet returns FieldSet:
    'fieldset' label=STRING Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

TitleWindow returns TitleWindow:
    'titlewindow' label=STRING Modifiers
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
    'tab' label=STRING Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

ContentTabs returns ContentTabs:
    'tabs' '[' tabs+=TabOption (',' tabs+=TabOption)* ']'
    ('active=' activeTab=INT)?
    Modifiers
    (NEWLINE | tabBlocks+=TabPane)*
    'end' EOL
;

Accordion returns Accordion:
    'accordion' label=STRING (collapsed?='collapsed')? Modifiers
    (NEWLINE | components+=Component)*
    'end' EOL
;

/* ─── Terminals ───────────────────────────────────────────────────────────── */

terminal COL_WIDTH: /[0-9]+(%|px)/;