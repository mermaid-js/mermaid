---
order: 4
---

# mermaid CLI

Installing mermaid globally (`npm install -g mermaid`) will expose the `mermaid` command to your environment, allowing you to generate PNGs from any file containing mermaid markup via the command line.

**Note:** The `mermaid` command requires [PhantomJS](http://phantomjs.org/) (version `^1.9.0`) to be installed and available in your *$PATH*, or you can specify it's location with the `-e` option. For most environments, `npm install -g phantomjs` will satisfy this requirement.

## Usage

```
$ mermaid --help

Usage: mermaid [options] <file>...

file    The mermaid description file to be rendered

Options:
  -s --svg             Output SVG instead of PNG (experimental)
  -p --png             If SVG was selected, and you also want PNG, set this flag
  -o --outputDir       Directory to save files, will be created automatically, defaults to `cwd`
  -e --phantomPath     Specify the path to the phantomjs executable
  -c --sequenceConfig  Specify the path to the file with the configuration to be applied in the sequence diagram
  -h --help            Show this message
  -v --verbose         Show logging
  -w --width           width of the generated png (number)
  --version            Print version and quit
```

```
mermaid testGraph.mmd
mermaid testGraph.mmd -w 980
```

## Sequence diagram configuration

The --sequenceConfig option allows overriding the sequence diagram configuration. It could be useful to increase the width between actors, the notes width or the margin to fit some large texts that are not well rendered with the default configuration, for example.

The content of the file must be a JSON like this:

```

{
    "diagramMarginX": 100,
    "diagramMarginY": 10,
    "actorMargin": 150,
    "width": 150,
    "height": 65,
    "boxMargin": 10,
    "boxTextMargin": 5,
    "noteMargin": 10,
    "messageMargin": 35
}

```

These properties will override the default values and if a property is not set in this object, it will left it empty and could raise an error. The current properties (measured in px) are:

- diagramMarginX: Size of the empty space to add at the left-right of the diagram.
- diagramMarginY: Size of the empty space to add at the top-bottom of the diagram.
- actorMargin: Horizontal space between each participant. The arrows between them would have this size too.
- width: Width of the participant box.
- height: Height of the participant box.
- boxMargin: Blank area around loop boxes.
- boxTextMargin: Blank area between the text and the border in a loop box.
- noteMargin: Size of the empty space around a note.
- messageMargin: Space between messages

## CLI Known Issues

- SVG output currently does some replacement on text, as mermaid's SVG output is only appropriate for browsers. Text color and background color is not yet replicated; please use PNGs for most purposes until this is resolved.
- SVG output is decidedly non-standard. It works, but may cause issues in some viewers.
