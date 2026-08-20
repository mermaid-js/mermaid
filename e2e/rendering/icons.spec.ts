import { test } from '@playwright/test';

import { imgSnapshotTest } from '../helpers/util.ts';

const logosPackFrontmatter = `---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
---
`;

test.describe('Icons rendering tests', () => {
  test('should render icon from config pack', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C[End]
`
    );
  });

  test('should render icons from different packs', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
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
`
    );
  });

  test('should use custom CDN template', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
    cdnTemplate: "https://cdn.jsdelivr.net/npm/\${packageSpec}/icons.json"
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C[End]
`
    );
  });

  test('should use different allowed hosts', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart TB
  A[Start] --> B@{ icon: 'logos:aws', label: 'AWS' }
`,
      {
        icons: {
          packs: { logos: '@iconify-json/logos@1' },
          allowedHosts: ['cdn.jsdelivr.net', 'unpkg.com'],
        },
      }
    );
  });

  test('should ignore allowedHosts from diagram text', async ({ page }, testInfo) => {
    // The frontmatter allowlist must be stripped — if it were applied, the
    // default CDN host would be rejected and the icon would fail to render.
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
  icons:
    packs:
      logos: "@iconify-json/logos@1"
    allowedHosts:
      - evil.example.com
---
flowchart TB
  A[Start] --> B@{ icon: 'logos:aws', label: 'AWS' }
`
    );
  });

  test('should render icon with label at top', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker Container', pos: 't' }
`
    );
  });

  test('should render icon with label at bottom', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:kubernetes', label: 'Kubernetes', pos: 'b' }
`
    );
  });

  test('should render icon with long label', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'This is a very long label for Docker container orchestration', h: 64 }
`
    );
  });

  test('should render large icon', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Large', h: 80, w: 80 }
`
    );
  });

  test('should render small icon', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Small', h: 32, w: 32 }
`
    );
  });

  test('should apply custom styles to icon shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Styled', form: 'square' }
  B --> C[End]
  style B fill:#0db7ed,stroke:#333,stroke-width:4px
`
    );
  });

  test('should use classDef with icons', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  classDef dockerIcon fill:#0db7ed,stroke:#fff,stroke-width:2px
  classDef awsIcon fill:#FF9900,stroke:#fff,stroke-width:2px
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C@{ icon: 'logos:aws', label: 'AWS' }
  B:::dockerIcon
  C:::awsIcon
`
    );
  });

  test('should render in TB layout', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  B --> C[End]
`
    );
  });

  test('should render in LR layout', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart LR
  A[Start] --> B@{ icon: 'logos:kubernetes', label: 'K8s' }
  B --> C[End]
`
    );
  });

  test('should handle unknown icon gracefully', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'unknown:invalid', label: 'Unknown Icon' }
  B --> C[End]
`
    );
  });

  test('should handle timeouts gracefully', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart TB
  A[Start] --> B@{ icon: 'logos:aws', label: 'Timeout' }
  B --> C[End]
`,
      {
        icons: {
          timeout: 1,
          packs: { logos: '@iconify-json/logos@1' },
        },
      }
    );
  });

  test('should handle missing pack gracefully', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart TB
  A[Start] --> B@{ icon: 'missing:icon', label: 'Missing Pack Icon' }
`
    );
  });

  test('should render multiple icons in sequence', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:aws', label: 'AWS' }
  B --> C@{ icon: 'logos:docker', label: 'Docker' }
  C --> D@{ icon: 'logos:kubernetes', label: 'K8s' }
  D --> E[End]
`
    );
  });

  test('should render icons in parallel branches', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `${logosPackFrontmatter}flowchart TB
  A[Start] --> B@{ icon: 'logos:docker', label: 'Docker' }
  A --> C@{ icon: 'logos:kubernetes', label: 'K8s' }
  B --> D[End]
  C --> D
`
    );
  });
});
