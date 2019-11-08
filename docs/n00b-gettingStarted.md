# A more basic getting started

Writing mermaid code is simple.

But how is the code turned into a diagram in a web page? To do this we need a mermaid renderer.

Thankfully the mermaid renderer is very accessible.

The requirement is on the part of the web browser. Modern web browsers, such as Firefox, Chrome and Safari, can render mermaid. But Internet Explorer cannot. The web browser also needs to be able to access the online mermaid renderer at cdn.jsdelivr.net/npm/

For an easy introduction, here follows three practical examples for turning code into diagram with:
1. an online mermaid editor
2. a mermaid plugin
3. a generic web server of your choosing

Following either of these examples, you can get started with converting your own mermaid code into web diagrams.

## the mermaid live editor

The quickest way to get started with mermaid is to visit [The mermaid live editor](https://mermaidjs.github.io/mermaid-live-editor).

In the `Code` section one can write or edit raw mermaid code, and instantly `Preview` the rendered result.

This is a great way to get started.

It is also the easiest way to develop diagrams, the code of which can be pasted straight into documentation.

![Flowchart](./img/n00b-liveEditor.png)

The `Mermaid configuration` is for controlling mermaid behaviour.

An easy introduction to mermaid configuration is found in the [n00b Advanced section]. A complete configuration reference is found [here].


## mermaid using plugins

Thanks to the growing popularity of mermaid, many plugins already exist which incorporate a mermaid renderer.

One example is the [Atlassian Confluence mermaid plugin](https://marketplace.atlassian.com/apps/1214124/mermaid-plugin-for-confluence?hosting=server&tab=overview)

When the mermaid plugin is installed on a Confluence server, one can insert a mermaid object into any Confluence page.

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

## mermaid using any web server

This example can be used with any common web server. Apache, IIS, nginx, node express [...], you pick your favourite.

We do not need to install anything on the server, apart from a normal file of html to be reached by a web browser (such as Firefox, Chrome, Safari, but not Internet Explorer). So if you want to really simplify things when testing this out, don't use a web server at all but just create the file locally and drag it into your browser window. It is the browser which does all the work of rendering mermaid!

Through the html file, we give the web browser three instructions inside the html code it retrieves:
1. a reference for fetching the online mermaid renderer, in essence a javascript.
2. the mermaid code we want to diagram.
3. the `mermaid.initialize()` command to start the rendering process

All this is done in the html `<body>` section of the web page.

This is what needs to go into the html file:



1. The reference to the mermaid renderer is done in a `<script src>` tag like so:

```
<body>
  <script src="//cdn.jsdelivr.net/npm/mermaid@8.4.0/dist/mermaid.min.js"></script>
</body>
```

2. The embedded mermaid code is similarly placed in a `<div>` tag:

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

3. When initializing mermaid using `mermaid.initialize()`, mermaid takes all the `<div class="mermaid">` tags it can find in the html body and starts to render them one by one. This is done like so:

```
<body>
  <script>mermaid.initialize({startOnLoad:true});</script>
</body>
```

*Finally*
4. Putting the three steps together is as simple as:
```
<html>
  <body>
    <script src="//cdn.jsdelivr.net/npm/mermaid@8.4.0/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({startOnLoad:true});</script>

    Here is one mermaid diagram:
    <div class="mermaid">
      graph TD
      A[Client] --> B[Load Balancer]
      B --> C[Server01]
      B --> D[Server02]
    </div>

    And here is another diagram:
    <div class="mermaid">
      graph TD
      A[Client] -->|tcp_1234| B(Load Balancer)
      B -->|tcp_5678| C[Server01]
      B -->|tcp_5678| D[Server02]
    </div>
  </body>
</html>
```
Save this to a html file and fetch it with a browser from the web server (or just drag it into your web browser window) and voila!

---

A more condensed html code can be achieved by embedding the mermaid code in its own .js file, which is referenced like so:

```
stuff stuff
  </div>
  </body>
</html>
```
The actual mermaid file could for example look like this:

```
mermaid content...
```

---

**Three additional comments from Knut Sveidqvist, creator of mermaid:**
- In early versions of mermaid, the `<script src>` tag was invoked in the `<head>` part of the web page. Nowdays we can place it directly in `<body>` as seen above. However, older parts of the documentation frequently reflects the previous way which still works.
  
- We initialize the mermaid rendering with `mermaid.initialize()` directly in the html code. In principle this could be done through placing `mermaid.initialize()` inside of `mermaid.min.js`. We would then eliminate the need for this explicit line in the html. However, there are use cases where we do want to separate the two steps. Sometimes we want full control over when we start looking for `<div>`tags inside the web page with `mermaid.initialize()`, for example when we think that all `<div>` tags may not have been loaded by the time `mermaid.min.js` runs.

- In the example above, `mermaid.min.js` is called using an absolute path. Even worse, the example includes the mermaid version number which of course will change as time goes by. However, the example makes it easy to understand what is going on - even though it is doomed in a way we do not want in a production environment. When going from testing mermaid out to getting serious with it, I would suggest one of the following approaches for calling `mermaid.min.js`:
  
  1. One
  2. Two
  3. ...
   
