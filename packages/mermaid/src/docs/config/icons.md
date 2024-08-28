# SVG Icons (v<MERMAID_RELEASE_VERSION>+)

SVG Icons can be used with supported diagrams. Alongside the icon packs included with Mermaid, 3rd party libraries can be included in the configuration to cover additional use-cases.

## Supported Diagrams

| Diagram      | Usage                             |
| ------------ | --------------------------------- |
| Architecture | Icon names are surrounded by `()` |

## Included Icon Packs

| Icon Pack     | Prefix |
| ------------- | ------ |
| default       | N/A    |
| Amazon AWS    | `aws:` |
| Digital Ocean | `do:`  |
| GitHub        | `gh:`  |

Note that in order to use non-generic icons that are provided with Mermaid, the packs must be explicitly loaded when on initialization initialized.

```js
import sampleIconPack from 'sample-icon-pack';

mermaid.initialize({
  iconLibraries: ['aws:common', 'aws:full', 'github', 'digital-ocean'],
});
```

## Using Custom Icon Packs

Custom icon packs can be used by including them in the `iconLibraries` array on mermaid initialization.

```js
import sampleIconPack from 'sample-icon-pack';

mermaid.initialize({
  iconLibraries: [sampleIconPack, 'aws:full', ...],
});
```

## Creating Custom Icon Packs

```js
import { createIcon } from 'mermaid';
import type { IconLibrary, IconResolver } from 'mermaid';

// type IconLibrary = Record<string, IconResolver>;
// createIcon: (icon: string, originalSize: number) => IconResolver
const myIconLibrary: IconLibrary = {
  defaultCloudExample: createIcon(
        `<g>
            <rect width="80" height="80" style="fill: #087ebf; stroke-width: 0px;"/>
            <path d="..." style="fill: none; stroke: #fff; stroke-miterlimit: 10; stroke-width: 2px;"/>
        </g>`,
        80
    )
};

export default myIconLibrary
```
