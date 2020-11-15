# Breaking changes

### Breaking changes from history version to latest version:

## #1

```javascript
mermaid.initialize({
    sequenceDiagram:{
        ...
    }
})
```

has been changed to

```javascript
mermaid.initialize({
    sequence:{
        ...
    }
})
```

## #2

In old versions you need to add CSS file to your HTML:

```html
<link rel="stylesheet" href="mermaid.min.css">
```

or

```html
<link rel="stylesheet" href="mermaid.forest.min.css">
```

Now it is not needed to do so. And there are no more CSS files in distrubtion files.

You just

```javascript
mermaid.initialize({
    theme: 'forest'
})
```

and it works like a charm.

This is because now the CSS is inline with SVG for portability.
