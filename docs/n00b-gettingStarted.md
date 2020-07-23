# A basic mermaid User-Guide for Beginners
**Edit this Page** [![N|Solid](./img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/n00b-gettingStarted.md)

Creating diagrams and charts using mermaid code is simple.
The code is turned into a diagram in the web page with the use of a mermaid renderer.

The mermaid renderer is a piece of javascript that parses mermaid definitions, when called.
This then renders a diagram based on that code in SVG, alternatively it 

Most web browsers, such as Firefox, Chrome and Safari, can render mermaid, Internet Explorer however cannot.

## For beginners, there are four relatively easy ways you can use mermaid:
1. Using the mermaid [live editor](https://mermaid-js.github.io/mermaid-live-editor/) For some popular video tutorials on the live editor go to [Overview](./n00b-overview.md).
2. Using one of the many [mermaid plugins](https://mermaid-js.github.io/mermaid/#/integrations).
3. Calling mermaid renderer with HTML,click here for more in depth information on [Usage](./usage.md).
4. Installing mermaid with npm and deploying it using a relative link in the `<script>` tag. 
.
# Following either of these examples, you can get started with creating your own diagrams using mermaid code.

## 1. The mermaid live editor:

 A great way to get started with mermaid is to visit [The mermaid live editor](https://mermaidjs.github.io/mermaid-live-editor).

In the `Code` section one can write or edit raw mermaid code, and instantly `Preview` the rendered result on the panel beside it.

**This is a great way to learn how to define a mermaid diagram.** 

For some popular video tutorials on the live editor go to [Overview](./n00b-overview.md).

![Flowchart](./img/n00b-liveEditor.png) 

**Notes:**

You can also click "Copy Markdown" to copy the markdown code for the diagram, that can then be pasted directly into your documentation. 

![Flowchart](./img/liveEditorOptions.png)

The `Mermaid configuration` is for controlling mermaid behaviour. An easy introduction to mermaid configuration is found in the [Advanced usage](n00b-advanced.md) section. A complete configuration reference cataloguing default values is found on the [mermaidAPI](https://mermaid-js.github.io/mermaid/#/Setup) page.


## 2. Using mermaid plugins:

Thanks to the growing popularity of mermaid, many plugins already exist which incorporate a mermaid renderer. An extensive list can be found [here](./integrations.md).

One example in the list is the [Atlassian Confluence mermaid plugin](https://marketplace.atlassian.com/apps/1214124/mermaid-plugin-for-confluence?hosting=server&tab=overview) 

When the mermaid plugin is installed on a Confluence server, one can insert a mermaid object into any Confluence page.
### Here is a step by step process for using the mermaid-Confluence plugin:

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
## There are two ways of hosting mermaid on a webpage. They will be discussed in 3 and 4, respectively.  

## 3. mermaid using any web server (or just a browser):
**This is covered in detail in the [Usage section](https://mermaid-js.github.io/mermaid/#/usage)**

This method can be used with any common web server. Apache, IIS, nginx, node express [...], you pick your favourite.

We do not need to install anything on the server, apart from a program (like Notepad++) that can generate an html file, which is then deployed by a web browser (such as Firefox, Chrome, Safari, but not Internet Explorer). 

So if you want to really simplify things when testing this out, don't use a web server at all but just create an HTML file locally and drag it into your browser window. The browser will do the work of rendering the mermaid diagrams according to the descriptions you've given!

### Note that all this is written in the html `<body>` section of the web page.

When writing the html file, we give the web browser three instructions inside the html code:

a. A reference for fetching the online mermaid renderer, which is written in Javascript.

b. The mermaid code for the diagram we want to create.

c. The `mermaid.initialize()` command to start the rendering process. 


## This is what needs to go into the html file (and all of them are important):



### a. The reference to the mermaid renderer has to be contained in a `<script src>` tag like so:

```
<body>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</body>
```

### b. The embedded mermaid diagram definition is similarly placed inside a `<div>` tag:

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
(take note that every mermaid chart/graph/diagram definition, has to have separate `<div>` tags.)

### c. When initializing mermaid using `mermaid.initialize()`, mermaid takes all the `<div class="mermaid">` tags it can find in the html body and starts to render them one by one. This is done like so:

```
<body>
  <script>mermaid.initialize({startOnLoad:true});</script>
</body>
```

### *Finally*
### If the three steps mentioned are followed you will end up with something like this:
### Note that 

```
<html>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
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
### Save this to an html file and open it with a browser.

---
## 4. Calling mermaid from a relative link. 
This method is similar to 3, if only a little more involved.  The difference may be very subtle even, insignificant to a majority of people, but it offers its own advantages. 

1. install node v10 or 12, which would have npm

2. download yarn using npm.
npm install -g yarn

3. After yarn installs, enter the following command:
    yarn add mermaid

4. After downloading mermaid, you can then open the mermaid you’ve downloaded and go to the `dist` folder.

5. Find the `mermaid.min.js` file, press the shift key and right click on and select copy as path from the options. 

6. Paste it within the `script` tag as the `src`. 
```
<script src=[Paste the mermaid.min.js file address here]></script>
 <script>mermaid.initialize({startOnLoad:true});</script>
```
7. It should look something like this
```
  <script src="C:\Users\myPC\mermaid\dist\mermaid.js"></script>
  <script>mermaid.initialize({startOnLoad:true});</script>
```
8. Add the graph and diagram definitions as you would in number 3, be mindful of the `div` tags. 

9. Save, load/edit your HTML file to your liking.  

 
**Note** placing the HTML file on the same folder the mermaid filed you've downloaded is a good practice and allows you to shorten the address. 

**As seen here:**
```
<script src=".\mermaid\dist\mermaid.min.js"></script>
```



**Three additional comments from Knut Sveidqvist, creator of mermaid:**
- In early versions of mermaid, the `<script src>` tag was invoked in the `<head>` part of the web page. Nowdays we can place it directly in `<body>` as seen above. However, older parts of the documentation frequently reflects the previous way which still works.
  
- We initialize the mermaid rendering with `mermaid.initialize()` directly in the html code. In principle this could be done through placing `mermaid.initialize()` inside of `mermaid.min.js`. We would then eliminate the need for this explicit line in the html. However, there are use cases where we do want to separate the two steps. Sometimes we want full control over when we start looking for `<div>`tags inside the web page with `mermaid.initialize()`, for example when we think that all `<div>` tags may not have been loaded by the time `mermaid.min.js` runs.

- In the third method, `mermaid.min.js` is called using an absolute path. Even worse, the example includes the mermaid version number which of course will change as time goes by. However, the example makes it easy to understand what is going on - even though it is perhaps doomed in a way we do not want in a production environment. When going from testing mermaid out to getting serious with it, I would suggest one of the following approaches for calling `mermaid.min.js`:
  
  1. If you do not enter a specific version, you automatically get the latest one.
  2. If you really need a specific version, hard code it (this is rare but it happens).
  3. If you need to know the current mermaid version, replace a mermaid code block with the word `info` and the version will be returned like [this](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiaW5mb1xuXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ==)
   
