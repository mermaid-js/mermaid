import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

const looks = ['neo'] as const;
const themes = [
  'neo',
  'neo-dark',
  'redux',
  'redux-dark',
  'redux-color',
  'redux-dark-color',
] as const;
// Requirement diagram relationship types
const relationshipTypes = [
  { type: 'contains', name: 'contains' },
  { type: 'copies', name: 'copies' },
  { type: 'derives', name: 'derives' },
  { type: 'satisfies', name: 'satisfies' },
  { type: 'verifies', name: 'verifies' },
  { type: 'refines', name: 'refines' },
  { type: 'traces', name: 'traces' },
] as const;

looks.forEach((look) => {
  themes.forEach((theme) => {
    test.describe(`Test Requirement diagrams in ${look} look and ${theme} theme`, () => {
      test('should render a simple requirement diagram', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement test_req {
                  id: 1
                  text: the test text.
                  risk: high
                  verifymethod: test
              }
              element test_entity {
                  type: simulation
              }
              test_entity - satisfies -> test_req
          `,
          { look, theme }
        );
      });

      test('should render all requirement types', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement req1 {
                  id: 1
                  text: basic requirement.
                  risk: low
                  verifymethod: analysis
              }
              functionalRequirement req2 {
                  id: 2
                  text: functional requirement.
                  risk: medium
                  verifymethod: demonstration
              }
              interfaceRequirement req3 {
                  id: 3
                  text: interface requirement.
                  risk: high
                  verifymethod: inspection
              }
              performanceRequirement req4 {
                  id: 4
                  text: performance requirement.
                  risk: medium
                  verifymethod: test
              }
              physicalRequirement req5 {
                  id: 5
                  text: physical requirement.
                  risk: low
                  verifymethod: analysis
              }
              designConstraint req6 {
                  id: 6
                  text: design constraint.
                  risk: high
                  verifymethod: test
              }
          `,
          { look, theme }
        );
      });

      test('should render all relationship types', async ({ page }, testInfo) => {
        let diagram = `requirementDiagram\n`;
        relationshipTypes.forEach((_rel, i) => {
          diagram += `    requirement req_${i} {\n        id: ${i}\n        text: req ${i}.\n        risk: low\n        verifymethod: test\n    }\n`;
          diagram += `    element elem_${i} {\n        type: system\n    }\n`;
        });
        relationshipTypes.forEach((rel, i) => {
          diagram += `    elem_${i} - ${rel.type} -> req_${i}\n`;
        });
        await imgSnapshotTest(page, testInfo, diagram, { look, theme });
      });

      test('should render relationship using reverse arrow direction', async ({
        page,
      }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement sys_req {
                  id: 10
                  text: system level requirement.
                  risk: high
                  verifymethod: test
              }
              element design_doc {
                  type: document
                  docRef: docs/design.md
              }
              sys_req <- copies - design_doc
          `,
          { look, theme }
        );
      });

      test('should render an element with type and docRef', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement perf_req {
                  id: 1
                  text: latency under 100ms.
                  risk: high
                  verifymethod: test
              }
              element test_suite {
                  type: "test suite"
                  docRef: github.com/org/tests
              }
              test_suite - verifies -> perf_req
          `,
          { look, theme }
        );
      });

      test('should render a complex diagram with multiple requirements and elements', async ({
        page,
      }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement sys_req {
                  id: 1
                  text: the system shall perform the action.
                  risk: high
                  verifymethod: test
              }
              functionalRequirement func_req {
                  id: 1.1
                  text: the system shall respond within 100ms.
                  risk: medium
                  verifymethod: demonstration
              }
              performanceRequirement perf_req {
                  id: 1.2
                  text: throughput must exceed 1000 requests per second.
                  risk: high
                  verifymethod: test
              }
              element hw_element {
                  type: hardware
                  docRef: specs/hw_spec.pdf
              }
              element sw_element {
                  type: software
                  docRef: github.com/org/repo
              }
              hw_element - satisfies -> sys_req
              sw_element - verifies -> func_req
              sys_req - contains -> func_req
              sys_req - contains -> perf_req
              func_req - traces -> perf_req
          `,
          { look, theme }
        );
      });

      test('should render requirements with empty bodies', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement empty_req {
              }
              element empty_entity {
              }
          `,
          { look, theme }
        );
      });

      test('should render requirements with quoted names containing spaces', async ({
        page,
      }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement "system performance requirement" {
                  id: 1
                  text: the system shall meet performance targets.
                  risk: medium
                  verifymethod: test
              }
              element "test harness component" {
                  type: "test suite"
                  docRef: docs/test_harness.md
              }
              "test harness component" - verifies -> "system performance requirement"
          `,
          { look, theme }
        );
      });

      test('should render diagram with TB direction', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
          direction TB
              requirement req_a {
                  id: 1
                  text: req A.
                  risk: low
                  verifymethod: analysis
              }
              requirement req_b {
                  id: 2
                  text: req B.
                  risk: medium
                  verifymethod: inspection
              }
              req_a - derives -> req_b
          `,
          { look, theme }
        );
      });

      test('should render diagram with BT direction', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
          direction BT
              requirement req_a {
                  id: 1
                  text: req A.
                  risk: low
                  verifymethod: analysis
              }
              requirement req_b {
                  id: 2
                  text: req B.
                  risk: medium
                  verifymethod: inspection
              }
              req_a - derives -> req_b
          `,
          { look, theme }
        );
      });

      test('should render diagram with LR direction', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
          direction LR
              requirement req_a {
                  id: 1
                  text: req A.
                  risk: low
                  verifymethod: analysis
              }
              requirement req_b {
                  id: 2
                  text: req B.
                  risk: medium
                  verifymethod: inspection
              }
              req_a - derives -> req_b
          `,
          { look, theme }
        );
      });

      test('should render diagram with RL direction', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
          direction RL
              requirement req_a {
                  id: 1
                  text: req A.
                  risk: low
                  verifymethod: analysis
              }
              requirement req_b {
                  id: 2
                  text: req B.
                  risk: medium
                  verifymethod: inspection
              }
              req_a - derives -> req_b
          `,
          { look, theme }
        );
      });

      test('should render a diagram with a title', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
title: Requirement Diagram Title
---
          requirementDiagram
              requirement sys_req {
                  id: 1
                  text: the test text.
                  risk: high
                  verifymethod: test
              }
              element test_entity {
                  type: simulation
              }
              test_entity - satisfies -> sys_req
          `,
          { look, theme }
        );
      });

      test('should render requirements with styles applied from style statement', async ({
        page,
      }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement styled_req {
                  id: 1
                  text: a styled requirement.
                  risk: medium
                  verifymethod: inspection
              }
              element styled_entity {
                  type: component
              }
              styled_entity - satisfies -> styled_req
              style styled_req fill:#f9f,stroke:blue,color:grey,font-weight:bold
              style styled_entity fill:#bbf,stroke:green
          `,
          { look, theme }
        );
      });

      test('should render requirements with styles applied from class statement', async ({
        page,
      }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement req_a {
                  id: 1
                  text: req A.
                  risk: low
                  verifymethod: analysis
              }
              element elem_a {
                  type: module
              }
              elem_a - refines -> req_a
              classDef bold font-weight:bold
              classDef blue stroke:lightblue,color:#0000FF
              class req_a bold
              class elem_a blue,bold
          `,
          { look, theme }
        );
      });

      test('should render requirements with styles applied from classDef shorthand syntax', async ({
        page,
      }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `
          requirementDiagram
              requirement req_b:::blue {
                  id: 2
                  text: req B with shorthand class.
                  risk: high
                  verifymethod: test
              }
              element elem_b {
                  type: service
              }
              elem_b - verifies -> req_b
              classDef bold font-weight:bold
              classDef blue stroke:lightblue,color:#0000FF
              elem_b:::bold
          `,
          { look, theme }
        );
      });
    });
  });
});

test.describe('Requirement diagrams in classic look (regression)', () => {
  test('should render a basic requirement diagram with relationship in classic look and default theme', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      requirementDiagram
          requirement test_req {
              id: 1
              text: the test text.
              risk: high
              verifymethod: test
          }
          element test_entity {
              type: simulation
          }
          test_entity - satisfies -> test_req
      `,
      { look: 'classic', theme: 'default' }
    );
  });
});
