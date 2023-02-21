# A collection of updates that change the behavior

## Async

`parse`, `render` are now async.

## Lazy loading and asynchronisity

- Invalid dates are rendered as syntax error instead of returning best guess or the current date

## ParseError is removed

```js
//< v10.0.0
mermaid.parse(text, parseError);

//>= v10.0.0
await mermaid.parse(text).catch(parseError);
// or
try {
  await mermaid.parse(text);
} catch (err) {
  parseError(err);
}
```

## Init deprecated and InitThrowsErrors removed

The config passed to `init` was not being used eariler.
It will now be used.
The `init` function is deprecated and will be removed in the next major release.
init currently works as a wrapper to `initialize` and `run`.

```js
//< v10.0.0
mermaid.init(config, selector, cb);

//>= v10.0.0
mermaid.initialize(config);
mermaid.run({
  querySelector: selector,
  postRenderCallback: cb,
  suppressErrors: true,
});
```

```js
//< v10.0.0
mermaid.initThrowsErrors(config, selector, cb);

//>= v10.0.0
mermaid.initialize(config);
mermaid.run({
  querySelector: selector,
  postRenderCallback: cb,
  suppressErrors: false,
});
```
