# Upgrading

Some of the interfaces has been upgraded.


## From version 0.4.0 to 0.5.0


### Initialization

`mermaid_config` is no longer used. Instead a call to mermaid initialize is done as in the example below:


#### version 0.4.0

```javascript
mermaid_config = {
    startOnLoad: true
}
```

#### version 0.5.0

```javascript
mermaid.initialize({
    startOnLoad: true
})
```
