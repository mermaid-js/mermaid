# Version News and Updates
**Edit this Page** [![N|Solid](./img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/8.6.0_docs.md)

This file will track the progress and the evolution of mermaid over time. 

## Here is the list of the newest versions in Descending Order, beginning from the latest version.

# [Version 8.6.0](./8.6.0_docs.md) introduces New Configuration Protocols and Directives 

With version 8.6.0 comes the release of directives for mermaid, a new system for modifying configurations, with the aim of establishing centralized, sane defaults and simple implementation.

directives allow for a diagram specific overriding of config, as it has been discussed in Configurations. This allows site users to input modifications to config alongside diagram definitions, when creating diagrams on a private webpage that supports mermaid.

# Version 8.5.0, introduces New diagrams

**New diagrams in 8.5**

With version 8.5 there are some bug fixes and enhancements, plus a new diagram type,  entity relationship diagrams.

![Image showing the new ER diagram type](./img/er.png)

# Version 8.2.0, introduces a security improvement


 A `securityLevel` configuration has to first be cleared, `securityLevel` sets the level of trust for the parsed diagrams and limits click functionality. This was introduce in version 8.2 as a security improvement, aimed at preventing malicious use. 
 
## securityLevel

| Parameter     | Description                       | Type   | Required | Values                    |
| ------------- | --------------------------------- | ------ | -------- | ------------------------- |
| securitylevel | Level of trust for parsed diagram | String | Required | Strict, Loose, antiscript |

\*\*Notes:

-   **strict**: (**default**) tags in text are encoded, click functionality is disabeled
-   **loose**: tags in text are allowed, click functionality is enabled
-   **antiscript**: html tags in text are allowed, (only script element is removed), click functionality is enabled


⚠️ **Note** : This changes the default behaviour of mermaid so that after upgrade to 8.2, if the `securityLevel` is not configured, tags in flowcharts are encoded as tags and clicking is prohibited.	

If you are taking resposibility for the diagram source security you can set the `securityLevel` to a value of your choosing . By doing this clicks and tags are again allowed.	

## To chage `securityLevel` with `mermaidAPI.initialize`: 

```javascript	
    mermaidAPI.initialize({	
        securityLevel: 'loose'	
    });	
