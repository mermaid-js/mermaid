
mermaid [![Build Status](https://travis-ci.org/knsv/mermaid.svg?branch=master)](https://travis-ci.org/knsv/mermaid) [![Code Climate](https://codeclimate.com/github/knsv/mermaid/badges/gpa.svg)](https://codeclimate.com/github/knsv/mermaid)
=======

Generation of diagrams and flowcharts from text in a similar manner as markdown.

Ever wanted to simplify documentation and avoid heavy tools like Visio when explaining your code?

This is why mermaid was born, a simple markdown-like script language for generating charts from text via javascript.

The code below would render the following image
<table>
<tr><th>Code</th><th>Rendered diagram</th></tr>
<tr><td>
<pre>
<code>
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
<code>
</pre>
</td>
<td>
<img src='http://www.sveido.com/mermaid/img/ex1.png' alt='Example 1'>
</td>
</tr>
<tr>
<td>
<pre>
<code>
sequenceDiagram
    participant Alice
    participant Bob
    Alice->John: Hello John, how are you?
    loop Healthcheck
        John->John: Fight against hypochondria
    end
    Note right of John: Rational thoughts &lt;br/>prevail...
    John-->Alice: Great!
    John->Bob: How about you?
    Bob-->John: Jolly good!
</code>
</pre>
</td>
<td>
<img src='http://www.sveido.com/mermaid/img/seq1.png' alt='Example 2'>
</td>
</tr>
</table>

## Further reading

* [Flowchart syntax](http://knsv.github.io/mermaid/flowchart.html)
* [Seqeucen diagram syntax](http://knsv.github.io/mermaid/sequenceDiagram.html)
* Mermaid client

