---
order: 10
---

# Upgrading to from version -0.4.0

Some of the interfaces has been upgraded.

## Initialization

mermaid_config is no longer used. Instead a call to mermaid initialize is done as in the example below:

### version 0.4.0

```
mermaid_config = {
    startOnLoad:true
    };
```

### will look like below in version 0.5.0

```
mermaid.initialize({
    startOnLoad:true
});
```
