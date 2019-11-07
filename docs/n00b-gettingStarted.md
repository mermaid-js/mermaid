# A more basic getting started

Writing mermaid code is simple.

But how is it turned into a diagram in a web page? To do this we need a mermaid renderer.

Thankfully the mermaid renderer is very accessible.

The requirement is on the part of the web browser. Modern web browsers work, such as Firefox, Chrome, Safari. But Internet Explorer does not. The web browser also needs to be able to access the online mermaid renderer at cdn.jsdelivr.net/npm/

For an easy introduction, here follows three practical examples using:
1. an online mermaid editor
2. a mermaid plugin
3. a generic web server of your choosing

Following either of these examples, you can get started converting your own mermaid code into web diagrams.

## the mermaid live editor

The quickest way to get started with mermaid is to visit [The mermaid live editor](https://mermaidjs.github.io/mermaid-live-editor).

In the `Code` section one can write or edit raw mermaid code, and instantly `Preview` the rendered result.

This is a great way to get started.

It is also the easiest way to develop diagrams, the code of which can be pasted straight into documentation.

![Flowchart](./img/n00b-liveEditor.png)

The `Mermaid configuration` is for controlling the behaviour of mermaid.

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

We do not need to install anything on the server, apart from a normal file of html which can be reached by a web browser (such as Firefox, Chrome, Safari, but not Internet Explorer).

Through the html file, we give the web browser three instructions inside the html code it retrieves:
1. a reference for fetching the online mermaid renderer, in essence a javascript.
2. the mermaid code we want to diagram.
3. the `mermaid.initialize()` command to start the rendering process

All this is done in the html `<body>` section of the web page.



1. The reference to the mermaid renderer is done in a `<script src>` tag like so:

```
<body>
  <script src="//cdn.jsdelivr.net/npm/mermaid@8.4.0/dist/mermaid.min.js"></script>
</body>
```

2. The embedded mermaid code is similarly placed in a `<script>` tag:

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

3. When initializing mermaid, it starts to render the content of all the `<div class="mermaid">` tags it can find in the html body. This is done like so:

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
Save this to a file and fetch it with a browser from the web server.

Voila!

---

**Three additional comments from Knut, the creator of mermaid:**
- In early versions of mermaid, the `<script src>` tag was invoked in the `<head>` part of the web page. Nowdays we can place it directly in `<body>` as seen above. However, the documentation still frequently reflects the old way which still works.
  
- We initialize the mermaid rendering with `mermaid.initialize()` directly in the html code. In principle this could be done through placing `mermaid.initialize()` inside of `mermaid.min.js`. We would then eliminate the need for this explicit line in the html. However, there are use cases where we do want to separate the two steps. Sometimes we want full control over when we start looking for `<div>`tags inside the web page, i.e. running `mermaid.initialize()`, as all `<div>` tags may not have loaded when `mermaid.min.js` runs.

- In the example above, the `mermaid.min.js` is called using an absolute path. Even worse, it includes the mermaid version number which will of course change as time goes by. However the example makes it easy to understand what is going on, even though it is doomed in a way we do not want in a production environment. When going from testing mermaid out to getting serious with it, I would suggest one of the following approaches for calling `mermaid.min.js`:
  
  1. One
  2. Two
  3. ...
   
