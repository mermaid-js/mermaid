# A collection of updates that change the behavior

## Async

`init`, `parse`, `render` are now async.

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
