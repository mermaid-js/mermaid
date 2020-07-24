# Theming

Mermaid as a system for theming in place. With it a site integrator can override a vast majority of attributes used when rendering a diagram.

The settings for a thime can be set globally for the site with the initialize call. The example below highlights how that can look:

```
 // example
```

It is also possible to override theme settings locally in a diagram using directives.

```
 // example
```

The easiest way to make a custom theme is to start with the base theme, the theme named base and just modify these three variables:
* primaryColor   - the base color for the theme
* secondaryColor - A compliment color to the primary color. This color is made lighter and used as background in subgraphs for instance

More specific color variables it is åpossible to change:
* lineColor
* textColor

