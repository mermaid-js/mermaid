# Wireframe Diagrams (v<MERMAID_RELEASE_VERSION>+)

> [!NOTE]
> Wireframe diagrams are available starting in v<MERMAID_RELEASE_VERSION>+.

A Wireframe diagram allows you to create high-level low-fidelity UI mockups and layout wireframes using text syntax. It provides built-in support for standard UI controls, multi-column grid layouts, container nesting, canvas presets, and multi-tab panel previews.

```mermaid-example
wireframe-beta "User Profile Setup" size=desktop
  actions ["Help"] ["Save"] ["Cancel"]

  titlewindow "Account Settings" id=mainWin
    columns
      col 30%
        imagefield "User Photo"
        button "Upload Image" primary
      end
      col 70%
        textfield "Full Name"
        textfield "Email Address"
        select "Role" ["Admin", "Editor", "Viewer"]
        checkbox "Subscribe to newsletter" checked
      end
    end
  end
```

## Declaration & Canvas Size Presets

Every wireframe diagram starts with the `wireframe-beta` keyword. You can optionally specify a title enclosed in quotes and a canvas preset size using `size=<preset>`.

### Syntax

```text
wireframe-beta ["Diagram Title"] [size=preset]
```

### Canvas Presets

Mermaid Wireframe includes 5 predefined canvas size presets:

| Preset    | Default Width | Default Height | Typical Use Case                          |
| :-------- | :------------ | :------------- | :---------------------------------------- |
| `dialog`  | 400px         | 300px          | Modal dialogs, popups, and simple prompts |
| `panel`   | 600px         | 400px          | Embedded UI widgets and tool panels       |
| `tablet`  | 768px         | 1024px         | Mobile and tablet app screen layouts      |
| `desktop` | 1024px        | 768px          | Standard desktop applications (default)   |
| `page`    | 1200px        | 900px          | Full webpage and web application layouts  |

### Example

```mermaid-example
wireframe-beta "Edit Profile Dialog" size=dialog
  textfield "Username"
  password "Password"
  button "Submit" primary
```

---

## Action Bar Configuration

An action bar displays quick action buttons along the top of the wireframe header or canvas. You can specify buttons inside square brackets (prefix with `*` for primary buttons) under an `actions` directive:

```mermaid-example
wireframe-beta "Dashboard" size=panel
  actions ["Refresh"] ["Export PDF"] ["*Settings"]
  paragraph "Welcome back to your dashboard."
```

---

## Layout Containers & Multi-Column Grids

Wireframes support flexible layout containers to group controls and divide the screen into multi-column layouts.

### 1. Multi-Column Layout (`columns` & `col`)

Use `columns` to create a row of columns. Each column is specified with `col` and an optional width specifier (in percentage `%` or fixed pixels `px`, e.g. `col 30%` or `col 200px`).

```mermaid-example
wireframe-beta "Multi-Column Layout" size=desktop
  columns
    col 30%
      heading "Sidebar Menu"
      list "Navigation" ["Dashboard", "Analytics", "Settings"]
    end
    col 70%
      heading "Main Content"
      paragraph "This column takes up 70% of the available width."
      button "Create New Project" primary
    end
  end
```

### 2. Title Window (`titlewindow`)

Wraps components in a window container complete with a window header title bar.

```mermaid-example
wireframe-beta size=panel
  titlewindow "System Status"
    label "CPU Usage: 42%"
    label "Memory Usage: 68%"
    button "Restart Services"
  end
```

### 3. FieldSet (`fieldset`)

Groups related form elements inside a bordered fieldset box with a legend label.

```mermaid-example
wireframe-beta size=panel
  fieldset "Contact Information"
    textfield "Phone Number"
    textfield "Address"
  end
```

### 4. Section (`section`)

Creates a generic bordered section box for organizing content blocks.

```mermaid-example
wireframe-beta size=panel
  section "Overview"
    paragraph "Section content goes here."
  end
```

### 5. Content Tabs (`tabs` & `tab`)

Creates a tabbed container. You can control tab rendering and preview modes using the following modifiers:

- **`active=N`**: Sets the initial active tab index (1-indexed, default is `1`).
- **`showTabs`**: Displays all tab panes side-by-side as separate preview panels.
- **`showTabs="1,3"`**: Displays only specified 1-indexed tab panes side-by-side.

```mermaid-example
wireframe-beta size=panel
  tabs ["General", "Security", "Notifications"] active=1 showTabs="1,2"
    tab "General"
      textfield "Display Name"
      select "Language" ["English", "Spanish", "French"]
    end
    tab "Security"
      password "Current Password"
      password "New Password"
    end
    tab "Notifications"
      checkbox "Email Alerts" checked
    end
  end
```

### 6. Accordion (`accordion`)

Creates collapsible accordion sections. Use `collapsed` to render an accordion section in its collapsed state.

```mermaid-example
wireframe-beta size=desktop
  accordion "Advanced Settings" collapsed
    checkbox "Enable Developer Mode"
    textfield "API Key"
  end
```

---

## Component Reference

Wireframe diagrams support a wide selection of form input controls, text elements, and graphical UI elements.

### Form Inputs

| Component Syntax                                     | Description                                                             | Example                                                  |
| :--------------------------------------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------- |
| `textfield "Label"`                                  | Standard text input field                                               | `textfield "First Name"`                                 |
| `password "Label"`                                   | Masked password input field                                             | `password "Secret Pin"`                                  |
| `numberfield "Label"`                                | Numeric input field                                                     | `numberfield "Quantity"`                                 |
| `datepicker "Label"`                                 | Date selection input field                                              | `datepicker "Birth Date"`                                |
| `textarea ["Label"] [\`content\`] [richtext] rows=N` | Multi-line text area (supports `\`multiline\``& optional`richtext` bar) | `textarea "Comments" \`Line 1\nLine 2\` richtext rows=4` |
| `select "Label" ["A", "B"]`                          | Dropdown select menu                                                    | `select "Country" ["USA", "Canada"]`                     |
| `select-multiple "Label" ["A", "B"]`                 | Multi-select list box                                                   | `select-multiple "Tags" ["React", "Vue", "Svelte"]`      |
| `combobox "Label" ["A", "B"]`                        | Editable combo box dropdown                                             | `combobox "Search" ["Option 1", "Option 2"]`             |
| `checkbox "Label" [checked]`                         | Single checkbox input                                                   | `checkbox "I agree to terms" checked`                    |
| `checkboxgroup "Label" ["*A", "B"]`                  | Group of checkboxes (`*` = checked)                                     | `checkboxgroup "Interests" ["*Coding", "Design"]`        |
| `radiogroup "Label" ["*A", "B"]`                     | Group of radio options (`*` = selected)                                 | `radiogroup "Gender" ["*Male", "Female"]`                |
| `multifield "Label"`                                 | Multi-value input tag field                                             | `multifield "Categories"`                                |
| `pathfield "Label"`                                  | File path input field                                                   | `pathfield "Attachment Path"`                            |
| `imagefield "Label"`                                 | Image placeholder box                                                   | `imagefield "Banner Image"`                              |

### Buttons & Action Controls

| Component Syntax         | Description                             | Example                         |
| :----------------------- | :-------------------------------------- | :------------------------------ |
| `button "Label"`         | Standard button                         | `button "Cancel"`               |
| `button "Label" primary` | Primary highlighted button              | `button "Save Changes" primary` |
| `actions ["A"] ["*B"]`   | Header action bar buttons (`*`=primary) | `actions ["Help"] ["*Save"]`    |

### Text & Titles

| Component Syntax      | Description             | Example                              |
| :-------------------- | :---------------------- | :----------------------------------- |
| `heading "Title"`     | Heading text            | `heading "Dashboard Overview"`       |
| `subtitle "Subtitle"` | Subtitle text           | `subtitle "Version 2.0"`             |
| `label "Text"`        | Generic label           | `label "Status: Active"`             |
| `paragraph "Text"`    | Paragraph block of text | `paragraph "Detailed summary line."` |

### Displays, Graphics & Navigation

| Component Syntax                    | Description                                 | Example                                      |
| :---------------------------------- | :------------------------------------------ | :------------------------------------------- |
| `canvas "Label" [height=N]`         | Custom drawing canvas placeholder           | `canvas "Preview Area" height=150`           |
| `icon "Label" glyph="name"`         | Icon placeholder                            | `icon "Search" glyph="search"`               |
| `vrule ["Label"] [height=N]`        | Vertical separator line                     | `vrule height=100`                           |
| `vcurly "Label" [height=N]`         | Vertical curly brace indicator              | `vcurly "Group A" height=80`                 |
| `arrow "Label" [direction]`         | Directional arrow (right/left/up/down/both) | `arrow "Next" right`                         |
| `formattingtoolbar`                 | Standalone rich text format bar             | `formattingtoolbar "Toolbar"`                |
| `menu "Label" ["Item 1", "Item 2"]` | Menu bar element                            | `menu "Navigation" ["File", "Edit", "View"]` |
| `list "Label" ["Item 1", "Item 2"]` | Standard list element                       | `list "Options" ["Item A", "Item B"]`        |
| `tree` ... `end`                    | Hierarchical tree view container            | See Tree example below                       |

#### Tree Structure Example

```mermaid-example
wireframe-beta size=panel
  tree "File Explorer"
    node "src" expanded > "index.ts", "utils.ts"
    node "public" > "favicon.ico"
  end
```

---

## Relative Alignment (`alignTo`)

Components can be positioned horizontally adjacent to previously declared components using `alignTo`. The target component can be referenced either by an **explicit ID** (`id=<id>`) or by an **implicit slug** generated from its label.

### Using Explicit IDs

```mermaid-example
wireframe-beta size=panel
  button "Submit" primary id=btnSubmit
  button "Cancel" alignTo=btnSubmit
```

### Using Implicit Label Slugs

Implicit slugs are automatically generated from component labels (lowercased with spaces and special characters converted to hyphens). For example, `"Cancel"` becomes `cancel`, and `"Save Changes"` becomes `save-changes`.

```mermaid-example
wireframe-beta size=dialog
  button "Cancel"
  button "Save Changes" alignTo=cancel
  button "Submit" primary alignTo=save-changes
```

> [!NOTE]
> Explicit component IDs take precedence over implicit label slugs if a collision occurs.

---

## Configuration Options

You can configure global wireframe options using frontmatter or `mermaid.initialize()`.

```yaml
---
config:
  wireframe:
    defaultCanvasSize: 'desktop'
    padding: 15
    containerPadding: 20
    gapX: 16
    gapY: 16
    fontFamily: 'Inter, sans-serif'
    fontSize: 14
---
```

### Config Parameters

| Option              | Type     | Default     | Description                                                                                                             |
| :------------------ | :------- | :---------- | :---------------------------------------------------------------------------------------------------------------------- |
| `defaultCanvasSize` | `string` | `'desktop'` | Canvas preset to use when size is not specified in the diagram header (`dialog`, `panel`, `tablet`, `desktop`, `page`). |
| `padding`           | `number` | `15`        | Outer canvas padding (in pixels).                                                                                       |
| `containerPadding`  | `number` | `20`        | Inner padding for containers and columns (in pixels).                                                                   |
| `gapX`              | `number` | `16`        | Horizontal gap between aligned elements and grid columns (in pixels).                                                   |
| `gapY`              | `number` | `16`        | Vertical gap between stacked layout elements (in pixels).                                                               |
| `fontFamily`        | `string` | `undefined` | Custom font family for wireframe labels and headers.                                                                    |
| `fontSize`          | `number` | `undefined` | Base font size for wireframe text elements.                                                                             |

---

## Known Limitations

- **Hand-drawn style is not supported.** The global `look: 'handDrawn'` option has no effect on wireframe diagrams. Wireframe always renders with clean, geometric strokes regardless of the configured look.

---

## Complete Example

```mermaid-example
---
config:
  wireframe:
    defaultCanvasSize: 'desktop'
    fontFamily: 'system-ui, sans-serif'
---
wireframe-beta "E-Commerce Checkout" size=desktop
  actions ["Help"] ["Cart (2)"]

  titlewindow "Checkout Process"
    columns
      col 60%
        fieldset "Shipping Address"
          textfield "Full Name"
          textfield "Street Address"
          columns
            col 50%
              textfield "City"
            end
            col 50%
              textfield "Postal Code"
            end
          end
        end
        radiogroup "Shipping Method" ["*Standard (3-5 days)", "Express (Next day)"]
      end
      col 40%
        section "Order Summary"
          label "Item 1: Wireless Headphones - $99"
          label "Item 2: USB-C Cable - $15"
          paragraph "Total: $114"
          button "Place Order" primary
        end
      end
    end
  end
```
