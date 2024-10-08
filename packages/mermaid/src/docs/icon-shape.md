---
title: Icon Shape Configuration
---

# Icon Shape Configuration

This document provides details on how to configure icon shapes in Mermaid using the specified syntax.

## Syntax

```plaintext
Id@{ icon: "icon-name", form: "icon-form", label: "label", pos: "t", h: 60 }
```

### Parameters

- **icon**: The name of the icon from the registered icon pack.
- **form**: Specifies the background shape of the icon. Options include:
  - `square`
  - `circle`
  - `rounded`
- **label**: The text label associated with the icon. This can be any string. If not defined, no label will be displayed.
- **pos**: The position of the label. Possible values are:
  - `t` (top)
  - `b` (bottom, default if not provided)
- **h**: The height of the icon in pixels. This parameter is optional and defaults to 48 pixels, which is the minimum height.

### Example

```mermaid
B2@{ icon: "fa:window-minimize", form: "rounded", label: "B2", pos: "t", h: 60 }
```

In this example:

- The icon is "fa:window-minimize".
- The shape is "rounded".
- The label is "B2".
- The label position is at the top (`t`).
- The height of the icon is 40 pixels.

### Additional Notes

Ensure that the icon name corresponds to a valid icon in the registered icon pack to avoid rendering issues.

### Registering Icon Packs

To use icons in Mermaid, you need to register the icon packs. Below is an example of how to register icon packs:

```javascript
mermaid.registerIconPacks([
  {
    name: 'logos',
    loader: () =>
      fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then((res) => res.json()),
  },
  {
    name: 'fa',
    loader: () =>
      fetch('https://unpkg.com/@iconify-json/fa6-regular@1/icons.json').then((res) => res.json()),
  },
]);
```

In this example:

- The `logos` icon pack is registered by fetching the icons from the specified URL.
- The `fa` (Font Awesome) icon pack is registered similarly.

Ensure that the URLs provided point to valid Iconify JSON files containing the icon definitions.
