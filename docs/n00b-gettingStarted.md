# A basic mermaid User-Guide for Beginners

Creating diagrams and charts using mermaid code is simple.

But how is the code turned into a diagram in a web page? This is done with the use of a mermaid renderer.

The mermaid renderer is very accessible, in essence it is a piece of javascript that can be called. 

Most web browsers, such as Firefox, Chrome and Safari, can render mermaid, Internet Explorer however cannot. The web browser also needs access to the online mermaid renderer which it downloads from https://cdn.jsdelivr.net/npm/mermaid

## For beginners, there are three relatively easy ways you can use mermaid:
1. Using the mermaid [live editor](https://mermaid-js.github.io/mermaid-live-editor/)
2. Using one of the many mermaid plugins
3. Calling mermaid renderer with HTML, deployed in a friendly browser. 

# Following either of these examples, you can get started with creating your own diagrams using mermaid code.

## 1. The mermaid live editor:

 A great way to get started with mermaid is to visit [The mermaid live editor](https://mermaidjs.github.io/mermaid-live-editor).

In the `Code` section one can write or edit raw mermaid code, and instantly `Preview` the rendered result on the panel beside it.

![Flowchart](./img/n00b-liveEditor.png) 


You can also copy the code from the code section and paste it into either a mermaid plugin or in inside an html file, which will be taught in numbers 2 and 3. 

It is also an easier way to develop diagrams. You can also click "Copy Markdown" to copy the markdown code for the diagram, that can then be pasted directly into your documentation. 

![Flowchart](./img/liveEditorOptions.png)

The `Mermaid configuration` is for controlling mermaid behaviour. An easy introduction to mermaid configuration is found in the [Advanced usage](n00b-advanced.md) section. A complete configuration reference cataloguing default values is found on the [mermaidAPI](https://mermaid-js.github.io/mermaid/#/Setup) page.


## 2. Using mermaid plugins:

Thanks to the growing popularity of mermaid, many plugins already exist which incorporate a mermaid renderer. An extensive list can be found [here](./integrations.md).

One example in the list is the [Atlassian Confluence mermaid plugin](https://marketplace.atlassian.com/apps/1214124/mermaid-plugin-for-confluence?hosting=server&tab=overview) 

When the mermaid plugin is installed on a Confluence server, one can insert a mermaid object into any Confluence page.
# Here is a step by step process for using the mermaid-Confluence plugin:

---

- In a Confluence page, Add Other macros.

![Flowchart](./img/n00b-Confluence1.png)

---

- Search for mermaid.

![Flowchart](./img/n00b-Confluence2.png)

---

- The mermaid object appears. Paste your mermaid code into it.

![Flowchart](./img/n00b-Confluence3.png)

---

- Save the page and the diagram appears.

![Flowchart](./img/n00b-Confluence4.png)

---

## 3. mermaid using any web server (or just a browser):

This method can be used with any common web server. Apache, IIS, nginx, node express [...], you pick your favourite.

We do not need to install anything on the server, apart from a program (like Notepad++) that can generate an html file, which is then deployed by a web browser (such as Firefox, Chrome, Safari, but not Internet Explorer). 

So if you want to really simplify things when testing this out, don't use a web server at all but just create the file locally and drag it into your browser window. It is the browser which does all the work of rendering mermaid!

# Here are instructions for creating an html file with mermaid code: 
# Note that all this is written in the html `<body>` section of the web page.

When writing the html file, we give the web browser three instructions inside the html code:

a. A reference for fetching the online mermaid renderer, which is written in Javascript.

b. The mermaid code for the diagram we want to create.

c. The `mermaid.initialize()` command to start the rendering process. 




This is what needs to go into the html file:


# a. The reference to the mermaid renderer has to be contained in a `<script src>` tag like so:

```
<body>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@8.4.0/dist/mermaid.min.js"></script>
</body>
```

# b. The embedded mermaid code is similarly placed inside a `<div>` tag:

```
<body>
  Here is a mermaid diagram:
  <div class="mermaid">
    graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server01]
    B --> D[Server02]
  </div>
</body>
```
(take note that every mermaid chart/graph/diagram, has to have separate `<div>` tags.)

# c. When initializing mermaid using `mermaid.initialize()`, mermaid takes all the `<div class="mermaid">` tags it can find in the html body and starts to render them one by one. This is done like so:

```
<body>
  <script>mermaid.initialize({startOnLoad:true});</script>
</body>
```

# *Finally*
# If the three steps mentioned are followed you will end up with something like this:

```
<html>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@8.6.0/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({startOnLoad:true});</script>

    Here is one mermaid diagram:
    <div class="mermaid">
      graph TD
      A[Client] --> B[Load Balancer]
      B --> C[Server1]
      B --> D[Server2]
    </div>

    And here is another:
    <div class="mermaid">
      graph TD
      A[Client] -->|tcp_123| B(Load Balancer)
      B -->|tcp_456| C[Server1]
      B -->|tcp_456| D[Server2]
    </div>
  </body>
</html>
```
# Save this to an html file and open it with a browser from the web server (or just drag it into your web browser window) and voila!

---

**Three additional comments from Knut Sveidqvist, creator of mermaid:**
- In early versions of mermaid, the `<script src>` tag was invoked in the `<head>` part of the web page. Nowdays we can place it directly in `<body>` as seen above. However, older parts of the documentation frequently reflects the previous way which still works.
  
- We initialize the mermaid rendering with `mermaid.initialize()` directly in the html code. In principle this could be done through placing `mermaid.initialize()` inside of `mermaid.min.js`. We would then eliminate the need for this explicit line in the html. However, there are use cases where we do want to separate the two steps. Sometimes we want full control over when we start looking for `<div>`tags inside the web page with `mermaid.initialize()`, for example when we think that all `<div>` tags may not have been loaded by the time `mermaid.min.js` runs.

- In the example above, `mermaid.min.js` is called using an absolute path. Even worse, the example includes the mermaid version number which of course will change as time goes by. However, the example makes it easy to understand what is going on - even though it is perhaps doomed in a way we do not want in a production environment. When going from testing mermaid out to getting serious with it, I would suggest one of the following approaches for calling `mermaid.min.js`:
  
  1. If you do not enter a specific version, you automatically get the latest one.
  2. If you really need a specific version, hard code it (this is rare but it happens).
  3. If you need to know the current mermaid version, replace a mermaid code block with the word `info` and the version will be returned like [this](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiaW5mb1xuXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ==)
   
