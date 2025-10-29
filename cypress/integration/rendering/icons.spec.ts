import { imgSnapshotTest } from '../../helpers/util';

describe('Icons rendering tests', () => {
  it('should render icon from config pack', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C[End]
`);
  });

  it('should render icons from different packs', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
      simple-icons: "@iconify-json/simple-icons@1"
---
flowchart TB
  A@{ icon: 'logos:aws', label: 'AWS' } --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C@{ icon: 'logos:kubernetes', label: 'K8s' }
  C --> D@{ icon: 'simple-icons:github', label: 'GitHub' }
`);
  });

  it('should use custom CDN template', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
    cdnTemplate: "https://cdn.jsdelivr.net/npm/\${packageSpec}/icons.json"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C[End]
`);
  });

  it('should use different allowed hosts', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
    allowedHosts:
      - cdn.jsdelivr.net
      - unpkg.com
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:aws', label: 'AWS' }
`);
  });

  it('should render icon with label at top', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker Container', pos: 't' }
`);
  });

  it('should render icon with label at bottom', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:kubernetes', label: 'Kubernetes', pos: 'b' }
`);
  });

  it('should render icon with long label', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'This is a very long label for Docker container orchestration', h: 64 }
`);
  });

  it('should render large icon', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Large', h: 80, w: 80 }
`);
  });

  it('should render small icon', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Small', h: 32, w: 32 }
`);
  });

  it('should apply custom styles to icon shape', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Styled', form: 'square' }
  B --> C[End]
  style B fill:#0db7ed,stroke:#333,stroke-width:4px
`);
  });

  it('should use classDef with icons', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  classDef dockerIcon fill:#0db7ed,stroke:#fff,stroke-width:2px
  classDef awsIcon fill:#FF9900,stroke:#fff,stroke-width:2px
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C@{ icon: 'logos:aws', label: 'AWS' }
  B:::dockerIcon
  C:::awsIcon
`);
  });

  it('should render in TB layout', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C[End]
`);
  });

  it('should render in LR layout', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart LR
  A[Start] --> B@{ icon: 'logos:kubernetes', label: 'K8s' }
  B --> C[End]
`);
  });

  it('should handle unknown icon gracefully', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'unknown:invalid', label: 'Unknown Icon' }
  B --> C[End]
`);
  });

  it('should handle missing pack gracefully', () => {
    imgSnapshotTest(`flowchart TB
  A[Start] --> B@{ icon: 'missing:icon', label: 'Missing Pack Icon' }
`);
  });

  it('should render multiple icons in sequence', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:aws', label: 'AWS' }
  B --> C@{ icon: 'logos:docker', label: 'Docker' }
  C --> D@{ icon: 'logos:kubernetes', label: 'K8s' }
  D --> E[End]
`);
  });

  it('should render icons in parallel branches', () => {
    imgSnapshotTest(`---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  A --> C@{ icon: 'logos:kubernetes', label: 'K8s' }
  B --> D[End]
  C --> D
`);
  });
});
