# Directives

**Edit this Page** [![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/directives.md)

## Directives
Directives gives a diagram author the capability to alter the appearance of a diagram before rendering by changing the applied configuration. 

Directives are divided into two sets or orders, by priority in parsing. The first set, containing 'init' or 'initialize' directives are loaded ahead of any other directive. While the other set, containing all other kinds of directives are parsed and factored into the rendering, only after 'init' and the desired graph-type are declared.

### Init

| Parameter | Description |Type | Required | Values|
| --- | --- | --- | --- | --- |
| init | modifies configurations| Directive| Optional | Any parameters not included in the secure array|

**Notes:**

init would be an argument-directive: %%{init: { **insert argument here**}}%%

The json object that is passed as {**argument** } must be valid key value pairs and encased in quotation marks or it will be ignored.
Valid Key Value pairs can be found in config. 

The init/initialize directive is parsed earlier in the flow, this allows the incorporation of `%%init%%` directives into the mermaid diagram that is being rendered. Example:
```
%%{init: { 'logLevel': 'debug', 'theme': 'dark' } }%%
graph >
A-->B
```

will set the `logLevel` to `debug` and the `theme` to `dark` for a flowchart diagram, changing the appearance of the diagram itself. 

Note: 'init' or 'initialize' are both acceptable as init directives. Also note that `%%init%%` and `%%initialize%%` directives will be grouped together after they are parsed. This means:

```
%%{init: { 'logLevel': 'debug', 'theme': 'forest' } }%%
%%{initialize: { 'logLevel': 'fatal', "theme":'dark', 'startOnLoad': true } }%%
...
```

parsing the above generates the `%%init%%` object below, combining the two directives and carrying over the last value given for `loglevel`:

```
{
  logLevel: 'fatal',
  theme: 'dark',
  startOnLoad: true
}
```

This will then be sent to `mermaid.initialize(...)` for rendering.


### Other directives

In this category are any directives that come after the graph type declaration. Essentially, these directives will only be processed after the init directive. Each individual graph type will handle these directives. As an example:

```
%%{init: { 'logLevel': 'debug', 'theme': 'dark' } }%%
sequenceDiagram
%%{config: { 'fontFamily': 'Menlo', 'fontSize': 18, 'fontWeight': 400} }%%
Alice->>Bob: Hi Bob
Bob->>Alice: Hi Alice
```
## Chronology
This will set the `logLevel` to `debug` and `theme` to `dark` for a sequence diagram. Then, during processing, the config for the sequence diagram is set by the `config` directive. This directive is handled in the `sequenceDb.js`. In this example, the fontFamily, fontSize, and fontWeight are all set for this sequence diagram.

### Wrapping

## Wrap

| Parameter | Description |Type | Required | Values|
| --- | --- | --- | --- | --- |
| wrap | a callable text-wrap function| Directive| Optional | %%{wrap}%%|


#### Backwards Compatibility

Init directives and any other non-multiline directives should be backwards compatible, because they will be treated as comments in prior versions of mermaid-js.

Multiline directives, however, will pose an issue and will render an error. This is unavoidable.

# example 


