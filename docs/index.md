#Installation

Either use the bower package manager as per below:

```
bower install mermaid --save-dev
```

Or download javascript files:

* [mermaid including dependencies](http://www.sveido.com/mermaid/dist/mermaid.full.min.js)

This file bundles mermaid with d3 and dagre-d3.

* [mermaid without dependencies](http://www.sveido.com/mermaid/dist/mermaid.slim.min.js)

With this file you will need to include d3 and dagre-d3 yourself.

# Usage

Include mermaid on your web page:

```
<script src="mermaid.full.min.js"></script>
```

Further down on your page mermaid will look for tags with ```class="mermaid"```. From these tags mermaid will try to
read the chart definiton which will be replaced with the svg chart.


A chart defined like this:
```
<div class="mermaid">
    CHART DEFINITION GOES HERE
</div>
```

Would end up like this:
```
<div class="mermaid" id="mermaidChart0">
    <svg>
        Chart ends up here
    </svg>
</div>
```
An id is also added to mermaid tags without id.

