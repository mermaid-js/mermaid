## Directives
**Edit this Page** [![N|Solid](./img/GitHub-Mark-32px.png)](./directives.md)


## Directives were added in [Version 8.6.0](/8.6.0_docs.md). Please Read it for more information.

## Directives 
With this version, directives are supported. Directives are divided in two sets, by priority. the first set, containing 'init' or 'initialize' directives take priority. While the other set, containing all other kinds of directives are considered only after 'init' and the graph-type declared.

#### Init 

 
| Parameter | Description |Type | Required | Values|
| --- | --- | --- | --- | --- |
| init | modifies configurations| Directive| Optional | Any parameters not included in the secure array|

**Notes:**

init would be an argument-directive: %%{init: { **insert argument here**}}%%

The json object that is passed as {**argument** } must be valid, quoted json or it will be ignored.
    
The init/initialize directive is parsed early in the flow, enough to be able to re-initialize mermaid with a new configuration object. Example:
```
%%{init: { 'logLevel': 'debug', 'theme': 'dark' } }%%
graph >
A-->B
```

will set the `logLevel` to `debug` and the `theme` to `dark` for a flowchart diagram.

Note: 'init' or 'initialize' are both acceptable as init directives. Also note that init directives are coalesced. This means:

```
%%{init: { 'logLevel': 'debug', 'theme': 'forest' } }%%
%%{initialize: { 'logLevel': 'fatal', "theme":'dark', 'startOnLoad': true } }%%
...
```

will result an init object looking like this:

```
{
  logLevel: 'fatal',
  theme: 'dark',
  startOnLoad: true
}
```

to be sent to `mermaid.initialize(...)`
 

#### Other directives

In this category are any directives that follow the graph type declaration. Essentially, these directives will not be processed early in the flow like the init directive. Each individual graph type will handle these directives. As an example:

```
%%{init: { 'logLevel': 'debug', 'theme': 'dark' } }%%
sequenceDiagram
%%{config: { 'fontFamily': 'Menlo', 'fontSize': 18, 'fontWeight': 400} }%%
Alice->>Bob: Hi Bob
Bob->>Alice: Hi Alice
```
## Chronology 
This will set the `logLevel` to `debug` and `theme` to `dark` for a sequence diagram. Then, during processing, the config for the sequence diagram is set by the `config` directive. This directive is handled in the `sequenceDb.js`. In this example, the fontFamily, fontSize, and fontWeight are all set for this sequence diagram.

#### Backwards Compatibility

Init directives and any other non-multiline directives should be backwards compatible, because they will be treated as comments in prior versions of mermaid-js.

Multiline directives, however, will pose an issue and will render an error. This is unavoidable.

### Wrapping

The `%%{wrap}%%` directive and the inline `wrap:` text hint have also been added for sequence diagrams. This has been explained in my previous comments and has not materially changed.

# Wrap
| Parameter | Description |Type | Required | Values|
| --- | --- | --- | --- | --- |
| wrap | a callable text-wrap function| Directive| Optional | %%{wrap}%%|
