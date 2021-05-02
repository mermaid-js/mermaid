# Diagram Syntax
Mermaid's syntax is used to create diagrams.

Diagram Syntax is the next part of Mermaid. Syntax, together with Deployment and Configuration constitute the whole of Mermaid. 

Mermaid's Syntax is not too tricky and there are thorough guides for each type of Diagram. However, it requires some precision to render them correctly. 
Use the next section for reference. Adittionally, the [Getting Started](./n00b-gettingStarted.md) section can also provide some practical examples of mermaid syntax.


to save diagrams, there are a couple of ways,we recommend saving the diagram's definition along with the diagram itself, to make the diagram easy to edit. 
 

## Diagram Breaking
 One should beware the use of some words or symbols that can break diagrams, and using avoid them. Often these words or symbols only affect specific types of 
 
 `%%{ }%%` These are 
| Diagram Breakers  | Reason |Solution|
| ---               | ---    |---|
|  **Comments**     |        |   |
|[`%%{``}%%`](https://github.com/mermaid-js/mermaid/issues/1968) |  Similar to [Directives](./directives.md) confuses the renderer.|To comment, just use `%%`|
|  **Flow-Charts**      |  ||
|'end'              |  The word "End" can cause Flowcharts and Sequence diagrams to break |wrap them in quotation marks to prevent breakage|
| [Nodes inside Nodes](https://mermaid-js.github.io/mermaid/#/flowchart?id=special-characters-that-break-syntax)|  Mermaid gets confused with nested shapes | wrap them in quotation marks to prevent breaking graph LR|
|                   |  ||


### Mermaid Live Editor
Now, that you've seen what you should not add to your diagrams, you can play around with them in the [Mermaid Live Editor](https://mermaid-js.github.io/mermaid-live-editor). 

# Configuration

Configuration is the third part of Mermaid, after deployment and syntax. It deals with the different ways that Mermaid can be customized across different deployments. 

If you are interested in altering and customizing your Mermaid Diagrams, you will find the methods and values available for [Configuration](./Setup.md) here. It includes themes
This section will introduce the different methods of configuring of the behaviors and apperances of Mermaid Diagrams. 
The Following are the most commonly used methods, and are all tied to Mermaid [Deployment](./n00b-gettingStarted.md) methods. 

### Configuration Section in the [Live Editor](./Live-Editor.md). 
Here you can edit certain values to change the behavior and appearance of the diagram. 

### [The initialize() call](https://mermaid-js.github.io/mermaid/#/n00b-gettingStarted?id=_3-calling-the-javascript-api), for when Mermaid is called via an API, or through a <script> tag. 


### [Directives](./directives.md),
Allows for the limited reconfiguration of a diagram just before it is rendered. It can alter the font style, color and other aesthetic aspects of the diagram. you can pass a directive alongside your defintion inside `%%{ }%%`, either above or below your diagram defintion. 

### [Theme Manipulation](./theming.md):
An application of using Directives to change [Themes](./theming.md). `Theme` is an value within mermaid's configuration that dictates the color scheme for diagrams. 




