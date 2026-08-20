import { describe, expect, it } from 'vitest';

import type {
  Accordion,
  Button,
  Canvas,
  CheckboxField,
  CheckboxGroup,
  ColBlock,
  Columns,
  ComboBox,
  ContentTabs,
  FieldSet,
  Icon,
  List,
  Menu,
  RadioGroup,
  WireframeSection,
  SelectField,
  TabBar,
  TextArea,
  TextField,
  TitleWindow,
  Tree,
} from '../src/language/index.js';
import { WireframeDiagram } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, wireframeParse as parse } from './test-util.js';

describe('Wireframe Parser', () => {
  describe('Root & Header Parsing', () => {
    it('should parse basic wireframe declaration', () => {
      const result = parse('wireframe-beta "User Profile"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(WireframeDiagram.$type);
      expect(result.value.label).toBe('User Profile');
    });

    it('should parse wireframe with size options', () => {
      const sizes = ['dialog', 'panel', 'tablet', 'desktop', 'page'] as const;
      for (const canvasSize of sizes) {
        const result = parse(`wireframe-beta "Dashboard" size=${canvasSize}`);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.canvasSize).toBe(canvasSize);
      }
    });

    it('should parse wireframe with optional end keyword', () => {
      const result = parse('wireframe-beta "Main"\nend');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(WireframeDiagram.$type);
    });

    it('should parse metadata divider ---', () => {
      const result = parse('wireframe-beta "Main"\n---\nbutton "Click"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.components).toHaveLength(1);
    });
  });

  describe('Action Bar Parsing', () => {
    it('should parse action bar with buttons', () => {
      const result = parse('wireframe-beta "App"\nactions [Save] [Cancel] [Delete]');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.actions).toBeDefined();
      expect(result.value.actions?.buttons).toHaveLength(3);
      expect(result.value.actions?.buttons[0].label).toBe('Save');
      expect(result.value.actions?.buttons[1].label).toBe('Cancel');
      expect(result.value.actions?.buttons[2].label).toBe('Delete');
    });

    it('should parse action bar buttons with quoted labels', () => {
      const result = parse('wireframe-beta "App"\nactions ["Submit Form"] ["Reset All"]');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.actions?.buttons).toHaveLength(2);
      expect(result.value.actions?.buttons[0].label).toBe('Submit Form');
    });
  });

  describe('Leaf Components Parsing', () => {
    it('should parse text field components (textfield, password, numberfield, datepicker)', () => {
      const result = parse(`wireframe-beta "Form"
textfield "Username"
password "Password"
numberfield "Age"
datepicker "Birth Date"`);

      expectNoErrorsOrAlternatives(result);
      expect(result.value.components).toHaveLength(4);

      const tf1 = result.value.components[0] as unknown as TextField;
      expect(tf1.$type).toBe('TextField');
      expect(tf1.type).toBe('textfield');
      expect(tf1.label).toBe('Username');

      const tf2 = result.value.components[1] as unknown as TextField;
      expect(tf2.type).toBe('password');

      const tf3 = result.value.components[2] as unknown as TextField;
      expect(tf3.type).toBe('numberfield');

      const tf4 = result.value.components[3] as unknown as TextField;
      expect(tf4.type).toBe('datepicker');
    });

    it('should parse textarea with rows attribute and richtext option', () => {
      const result = parse('wireframe-beta "Form"\ntextarea "Comments" richtext rows=8');
      expectNoErrorsOrAlternatives(result);
      const ta = result.value.components[0] as unknown as TextArea;
      expect(ta.$type).toBe('TextArea');
      expect(ta.label).toBe('Comments');
      expect(ta.rows).toBe(8);
      expect(ta.richtext).toBe(true);
    });

    it('should parse textarea with multiline backtick string value', () => {
      const input = `wireframe-beta "Form"
textarea "Comments" \`Lorem ipsum ...
dolorem...
last line\` richtext`;
      const result = parse(input);
      expectNoErrorsOrAlternatives(result);
      const ta = result.value.components[0] as unknown as TextArea;
      expect(ta.$type).toBe('TextArea');
      expect(ta.label).toBe('Comments');
      expect(ta.value).toBe('`Lorem ipsum ...\ndolorem...\nlast line`');
      expect(ta.richtext).toBe(true);
    });

    it('should parse simple inputs (richtext, multifield, imagefield, pathfield)', () => {
      const result = parse(`wireframe-beta "Inputs"
richtext "Description"
multifield "Tags"
imagefield "Avatar"
pathfield "File Path"`);

      expectNoErrorsOrAlternatives(result);
      expect(result.value.components).toHaveLength(4);
    });

    it('should parse select fields and combobox with options', () => {
      const result = parse(`wireframe-beta "Selects"
select "Country" [USA, Germany, Japan]
select-multiple "Roles" ["Admin", "User", "Guest"]
combobox "Category" [Tech, Science]`);

      expectNoErrorsOrAlternatives(result);
      const sf = result.value.components[0] as unknown as SelectField;
      expect(sf.type).toBe('select');
      expect(sf.options).toHaveLength(3);

      const smf = result.value.components[1] as unknown as SelectField;
      expect(smf.type).toBe('select-multiple');
      expect(smf.options).toHaveLength(3);

      const cb = result.value.components[2] as unknown as ComboBox;
      expect(cb.options).toHaveLength(2);
    });

    it('should parse checkbox and radio groups with selections', () => {
      const result = parse(`wireframe-beta "Checkboxes"
checkbox "Remember Me" checked
checkboxgroup "Hobbies" [*Coding, Reading, *Gaming]
radiogroup "Gender" [*Male, Female, Other]`);

      expectNoErrorsOrAlternatives(result);
      const cb = result.value.components[0] as unknown as CheckboxField;
      expect(cb.checked).toBe(true);

      const cbg = result.value.components[1] as unknown as CheckboxGroup;
      expect(cbg.options).toHaveLength(3);
      expect(cbg.options?.[0].selected).toBe(true);
      expect(cbg.options?.[1].selected).toBeFalsy();

      const rg = result.value.components[2] as unknown as RadioGroup;
      expect(rg.options).toHaveLength(3);
      expect(rg.options?.[0].selected).toBe(true);
    });

    it('should parse text labels and headings', () => {
      const result = parse(`wireframe-beta "Typography"
label "Simple Label"
paragraph "Paragraph content goes here."
heading "Main Header"
subtitle "Sub Header"`);

      expectNoErrorsOrAlternatives(result);
      expect(result.value.components).toHaveLength(4);
    });

    it('should parse buttons with primary flag', () => {
      const result = parse(`wireframe-beta "Buttons"
button "Submit" primary
button "Cancel"`);

      expectNoErrorsOrAlternatives(result);
      const b1 = result.value.components[0] as unknown as Button;
      expect(b1.primary).toBe(true);

      const b2 = result.value.components[1] as unknown as Button;
      expect(b2.primary).toBeFalsy();
    });

    it('should parse icon with glyph property', () => {
      const result = parse('wireframe-beta "Icons"\nicon "UserIcon" glyph="user"');
      expectNoErrorsOrAlternatives(result);
      const icon = result.value.components[0] as unknown as Icon;
      expect(icon.glyph).toBe('user');
    });

    it('should parse canvas with height property', () => {
      const result = parse('wireframe-beta "Draw"\ncanvas "Map" height=300');
      expectNoErrorsOrAlternatives(result);
      const cv = result.value.components[0] as unknown as Canvas;
      expect(cv.height).toBe(300);
    });

    it('should parse tabbar with active tab', () => {
      const result = parse(
        'wireframe-beta "Nav"\ntabbar "Main Navigation" [Home, Profile, Settings] active=1'
      );
      expectNoErrorsOrAlternatives(result);
      const tb = result.value.components[0] as unknown as TabBar;
      expect(tb.tabs).toHaveLength(3);
      expect(tb.activeTab).toBe(1);
    });

    it('should parse directional arrows', () => {
      const directions = ['right', 'left', 'up', 'down', 'both'] as const;
      for (const dir of directions) {
        const result = parse(`wireframe-beta "Flow"\narrow "Flow Pointer" ${dir}`);
        expectNoErrorsOrAlternatives(result);
      }
    });

    it('should parse formatting toolbar, vcurly, and vrule', () => {
      const result = parse(`wireframe-beta "Tools"
formattingtoolbar "Toolbar"
vcurly "Curly Bracket" height=100
vrule "Vertical Rule" height=50`);

      expectNoErrorsOrAlternatives(result);
      expect(result.value.components).toHaveLength(3);
    });

    it('should parse menu and list (ordered and unordered)', () => {
      const result = parse(`wireframe-beta "Lists"
menu "File Menu" [New, Open, Save]
list "Unordered List" [Alpha, Beta]
list "Ordered List" [First, Second] ordered`);

      expectNoErrorsOrAlternatives(result);
      const menu = result.value.components[0] as unknown as Menu;
      expect(menu.items).toHaveLength(3);

      const list1 = result.value.components[1] as unknown as List;
      expect(list1.ordered).toBeFalsy();

      const list2 = result.value.components[2] as unknown as List;
      expect(list2.ordered).toBe(true);
    });

    it('should parse tree component with nested nodes', () => {
      const result = parse(`wireframe-beta "Files"
tree "File Explorer"
node "src" expanded > "components", "utils"
node "components" > "Header.tsx"
end`);

      expectNoErrorsOrAlternatives(result);
      const tree = result.value.components[0] as unknown as Tree;
      expect(tree.nodes).toHaveLength(2);
      expect(tree.nodes?.[0].expanded).toBe(true);
      expect(tree.nodes?.[0].children).toHaveLength(2);
    });
  });

  describe('Component Modifiers', () => {
    it('should parse id, alignTo, and info modifiers on components', () => {
      const result = parse(
        'wireframe-beta "Modifiers"\nbutton "Click Me" id=btnSubmit alignTo=lblHeader info'
      );

      expectNoErrorsOrAlternatives(result);
      const btn = result.value.components[0] as unknown as Button;
      expect(btn.id).toBe('btnSubmit');
      expect(btn.alignTo).toBe('lblHeader');
      expect(btn.info).toBe(true);
    });
  });

  describe('Layout Container Components', () => {
    it('should parse section container', () => {
      const result = parse(`wireframe-beta "Containers"
section "Personal Info" id=sec1
  textfield "First Name"
  textfield "Last Name"
end`);

      expectNoErrorsOrAlternatives(result);
      const sec = result.value.components[0] as unknown as WireframeSection;
      expect(sec.$type).toBe('WireframeSection');
      expect(sec.label).toBe('Personal Info');
      expect(sec.components).toHaveLength(2);
    });

    it('should parse fieldset container', () => {
      const result = parse(`wireframe-beta "Containers"
fieldset "Account Credentials"
  textfield "Email"
  password "Password"
end`);

      expectNoErrorsOrAlternatives(result);
      const fs = result.value.components[0] as unknown as FieldSet;
      expect(fs.$type).toBe('FieldSet');
      expect(fs.components).toHaveLength(2);
    });

    it('should parse titlewindow container', () => {
      const result = parse(`wireframe-beta "Popup Window"
titlewindow "Edit Profile"
  textfield "Display Name"
  button "Save Changes" primary
end`);

      expectNoErrorsOrAlternatives(result);
      const tw = result.value.components[0] as unknown as TitleWindow;
      expect(tw.$type).toBe('TitleWindow');
      expect(tw.components).toHaveLength(2);
    });

    it('should parse columns and col blocks with width', () => {
      const result = parse(`wireframe-beta "Grid"
columns
  col 30%
    label "Sidebar"
  end
  col 70%
    label "Main Content"
  end
end`);

      expectNoErrorsOrAlternatives(result);
      const cols = result.value.components[0] as unknown as Columns;
      expect(cols.$type).toBe('Columns');
      expect(cols.cols).toHaveLength(2);

      const col1 = cols.cols?.[0] as unknown as ColBlock;
      expect(col1.width).toBe('30%');
      expect(col1.components).toHaveLength(1);

      const col2 = cols.cols?.[1] as unknown as ColBlock;
      expect(col2.width).toBe('70%');
      expect(col2.components).toHaveLength(1);
    });

    it('should parse content tabs and tab panes', () => {
      const result = parse(`wireframe-beta "Tabs"
tabs [General, Security] active=0
  tab "General"
    textfield "Username"
  end
  tab "Security"
    password "Current Password"
  end
end`);

      expectNoErrorsOrAlternatives(result);
      const contentTabs = result.value.components[0] as unknown as ContentTabs;
      expect(contentTabs.$type).toBe('ContentTabs');
      expect(contentTabs.tabs).toHaveLength(2);
      expect(contentTabs.activeTab).toBe(0);
      expect(contentTabs.tabBlocks).toHaveLength(2);
    });

    it('should parse showTabs with slug list like showTabs=general,notifications', () => {
      const result = parse(`wireframe-beta "Tabs"
tabs ["General", "Security", "Notifications"] showTabs=general,notifications
  tab "General"
    textfield "Username"
  end
  tab "Security"
    password "Current Password"
  end
  tab "Notifications"
    checkbox "Email Alerts" checked
  end
end`);
      expectNoErrorsOrAlternatives(result);
    });

    it('should parse accordion container with collapsed state', () => {
      const result = parse(`wireframe-beta "Accordion"
accordion "Advanced Options" collapsed
  checkbox "Enable Debug Logging"
end`);

      expectNoErrorsOrAlternatives(result);
      const acc = result.value.components[0] as unknown as Accordion;
      expect(acc.$type).toBe('Accordion');
      expect(acc.collapsed).toBe(true);
      expect(acc.components).toHaveLength(1);
    });
  });

  describe('Nested Containers & Complex Wireframes', () => {
    it('should parse multi-level nested layout containers', () => {
      const result = parse(`wireframe-beta "Complex Page" size=desktop
actions [Save] [Export]
---
section "Main Form" id=secMain
  columns
    col 50%
      fieldset "User Identity"
        textfield "Full Name" id=txt1
        datepicker "DOB"
      end
    end
    col 50%
      accordion "Preferences" collapsed
        checkboxgroup "Notifications" [*Email, SMS]
      end
    end
  end
end`);

      expectNoErrorsOrAlternatives(result);
      expect(result.value.canvasSize).toBe('desktop');
      expect(result.value.actions?.buttons).toHaveLength(2);

      const sec = result.value.components[0] as unknown as WireframeSection;
      expect(sec.components).toHaveLength(1);
      const cols = sec.components?.[0] as unknown as Columns;
      expect(cols.cols).toHaveLength(2);
    });
  });
});
