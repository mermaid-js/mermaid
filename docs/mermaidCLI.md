---
title: mermaid CLI
order: 2
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
  -s --svg          Output SVG instead of PNG (experimental)
  -p --png          If SVG was selected, and you also want PNG, set this flag
  -o --outputDir    Directory to save files, will be created automatically, defaults to `cwd`
  -e --phantomPath  Specify the path to the phantomjs executable
  -h --help         Show this message
  -v --verbose      Show logging
  --version         Print version and quit
```

## CLI Known Issues

- SVG output currently does some replacement on text, as mermaid's SVG output is only appropriate for browsers. Text color and background color is not yet replicated; please use PNGs for most purposes until this is resolved.
- SVG output is decidedly non-standard. It works, but may cause issues in some viewers.
