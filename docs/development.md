# Things to be done in order to add a new diagram type
## Step 1: Grammar & Parsing
### Grammar
This would be to  define a jison grammar for the new diagram type. That should start with a way to identify that the text in the mermaid tag is a diagram of that type. create a new folder under diagrams for your new diagram type and a parser folder in it. This leads us to step 2.

For instance:

* the flowchart starts with the keyword graph.
* the sequence diagram starts with the keyword sequenceDiagram

### Store data found during parsing
There are some jison specific sub steps here where the parser stores the data encountered when parsing the diagram, this data is later used by the renderer. You can during the parsing call a object provided to the parser by the user of the parser. This object can be called during parsing for storing data.

```
statement
	: 'participant' actor  { $$='actor'; }
	| signal               { $$='signal'; }
	| note_statement       { $$='note';  }
	| 'title' message      { yy.setTitle($2);  }
	;
```

In the extract of the grammar above, it is defined that a call to the setTitle method in the data object will be done when parsing and the title keyword is encountered.

## Step 2: Rendering
Write a renderer that given the data found during parsing renders the diagram. To look at an example look at sequendeRenderer.js rather then the flowchart renderer as this is a more generic example.

Place the renderer in the diagram folder.

## Step 3: Detection of the new diagram type
The second thing to do is to add the capability to detect the new new diagram to type to the detectType in utils.js. The detection should return a key for the new diagram type.

## Step 4: The final piece - triggering the rendering
At this point when mermaid is trying to render the diagram it will detect it as being of the new type but there will be no match when trying to render the diagram. To fix this add a new case in the switch statement in main.js:init this should match the diagram type returned from step num 2. The code in this new case statement should call the renderer for the diagram type with the data found by the parser as an argument
