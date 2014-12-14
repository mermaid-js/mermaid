mermaid [![Build Status](https://travis-ci.org/knsv/mermaid.svg?branch=master)](https://travis-ci.org/knsv/mermaid) [![Code Climate](https://codeclimate.com/github/knsv/mermaid/badges/gpa.svg)](https://codeclimate.com/github/knsv/mermaid)
=======

Generation of diagrams and flowcharts from text in a similar manner as markdown.

Ever wanted to simplify documentation and avoid heavy tools like Visio when explaining your code?

This is why mermaid was born, a simple markdown-like script language for generating charts from text via javascript.

The code below would render the following image

```
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

would render this lovely chart:

![Example 1](http://www.sveido.com/mermaid/img/ex1.png)

A page with a live example can be seen [here](http://www.sveido.com/mermaid/demo/html/web.html). You can also look at mermaid in action using [jsbin](http://jsbin.com/faxunexeku/1/edit?html,output). If you want a live demo, there is an editor provided in the mermaid project or you can simply look at this [great editor](http://danielmschmidt.github.io/mermaid-demo/)


# [The main documentation is located in the wiki](https://github.com/knsv/mermaid/wiki)



# Another graph example

```
graph LR;
    A[Hard edge]-->|Link text|B(Round edge);
    B-->C{Decision};
    C-->|One|D[Result one];
    C-->|Two|E[Result two];
```

![Example 2](http://www.sveido.com/mermaid/img/ex2.png)



# Credits
Many thanks to the [d3](http://d3js.org/) and [dagre-d3](https://github.com/cpettitt/dagre-d3) projects for providing the graphical layout and drawing libraries! Thanks also to the [js-sequence-diagram](http://bramp.github.io/js-sequence-diagrams) project for usage of the grammar for the sequence diagrams.

*Mermaid was created by Knut Sveidqvist for easier documentation.*
