import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const looks = ['classic'];
const participantTypes = [
  { type: 'participant', display: 'participant' },
  { type: 'actor', display: 'actor' },
  { type: 'boundary', display: 'boundary' },
  { type: 'control', display: 'control' },
  { type: 'entity', display: 'entity' },
  { type: 'database', display: 'database' },
  { type: 'collections', display: 'collections' },
  { type: 'queue', display: 'queue' },
];

const restrictedTypes = ['boundary', 'control', 'entity', 'database', 'collections', 'queue'];

const interactionTypes = ['->>', '-->>', '->', '-->', '-x', '--x', '->>+', '-->>+'];

const notePositions = ['left of', 'right of', 'over'];

function getParticipantLine(name, type, alias) {
  if (restrictedTypes.includes(type)) {
    return `  participant ${name}@{ "type" : "${type}" }\n`;
  } else if (alias) {
    return `  participant ${name}@{ "type" : "${type}" } \n`;
  } else {
    return `  participant ${name}@{ "type" : "${type}" }\n`;
  }
}

looks.forEach((look) => {
  test.describe(`Sequence Diagram Tests - ${look} look`, () => {
    test('should render all participant types', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.forEach((pt, index) => {
        const name = `${pt.display}${index}`;
        diagramCode += getParticipantLine(name, pt.type);
      });
      for (let i = 0; i < participantTypes.length - 1; i++) {
        diagramCode += `  ${participantTypes[i].display}${i} ->> ${participantTypes[i + 1].display}${i + 1}: Message ${i}\n`;
      }
      await imgSnapshotTest(page, testInfo, diagramCode, {
        look,
        sequence: { diagramMarginX: 50, diagramMarginY: 10 },
      });
    });

    test('should render all interaction types', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += getParticipantLine('A', 'actor');
      diagramCode += getParticipantLine('B', 'boundary');
      interactionTypes.forEach((interaction, index) => {
        diagramCode += `  A ${interaction} B: ${interaction} message ${index}\n`;
      });
      await imgSnapshotTest(page, testInfo, diagramCode, { look });
    });

    test('should render participant creation and destruction', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.forEach((pt, index) => {
        const name = `${pt.display}${index}`;
        diagramCode += getParticipantLine('A', pt.type);
        diagramCode += getParticipantLine('B', pt.type);
        diagramCode += `  create participant ${name}@{ "type" : "${pt.type}" }\n`;
        diagramCode += `  A ->> ${name}: Hello ${pt.display}\n`;
        if (index % 2 === 0) {
          diagramCode += `  destroy ${name}\n`;
        }
      });
      await imgSnapshotTest(page, testInfo, diagramCode, { look });
    });

    test('should render notes in all positions', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += getParticipantLine('A', 'actor');
      diagramCode += getParticipantLine('B', 'boundary');
      notePositions.forEach((position, index) => {
        diagramCode += `  Note ${position} A: Note ${position} ${index}\n`;
      });
      diagramCode += `  A ->> B: Message with notes\n`;
      await imgSnapshotTest(page, testInfo, diagramCode, { look });
    });

    test('should render parallel interactions', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 4).forEach((pt, index) => {
        diagramCode += getParticipantLine(`${pt.display}${index}`, pt.type);
      });
      diagramCode += `  par Parallel actions\n`;
      for (let i = 0; i < 3; i += 2) {
        diagramCode += `    ${participantTypes[i].display}${i} ->> ${participantTypes[i + 1].display}${i + 1}: Message ${i}\n`;
        if (i < participantTypes.length - 2) {
          diagramCode += `    and\n`;
        }
      }
      diagramCode += `  end\n`;
      await imgSnapshotTest(page, testInfo, diagramCode, { look });
    });

    test('should render alternative flows', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += getParticipantLine('A', 'actor');
      diagramCode += getParticipantLine('B', 'boundary');
      diagramCode += `  alt Successful case\n`;
      diagramCode += `    A ->> B: Request\n`;
      diagramCode += `    B -->> A: Success\n`;
      diagramCode += `  else Failure case\n`;
      diagramCode += `    A ->> B: Request\n`;
      diagramCode += `    B --x A: Failure\n`;
      diagramCode += `  end\n`;
      await imgSnapshotTest(page, testInfo, diagramCode, { look });
    });

    test('should render loops', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 3).forEach((pt, index) => {
        diagramCode += getParticipantLine(`${pt.display}${index}`, pt.type);
      });
      diagramCode += `  loop For each participant\n`;
      for (let i = 0; i < 3; i++) {
        diagramCode += `    ${participantTypes[0].display}0 ->> ${participantTypes[1].display}1: Message ${i}\n`;
      }
      diagramCode += `  end\n`;
      await imgSnapshotTest(page, testInfo, diagramCode, { look });
    });

    test('should render boxes around groups', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += `  box Group 1\n`;
      participantTypes.slice(0, 3).forEach((pt, index) => {
        diagramCode += `    ${getParticipantLine(`${pt.display}${index}`, pt.type)}`;
      });
      diagramCode += `  end\n`;
      diagramCode += `  box rgb(200,220,255) Group 2\n`;
      participantTypes.slice(3, 6).forEach((pt, index) => {
        diagramCode += `    ${getParticipantLine(`${pt.display}${index}`, pt.type)}`;
      });
      diagramCode += `  end\n`;
      diagramCode += `  ${participantTypes[0].display}0 ->> ${participantTypes[3].display}0: Cross-group message\n`;
      await imgSnapshotTest(page, testInfo, diagramCode, { look });
    });

    test('should render with different font settings', async ({ page }, testInfo) => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 3).forEach((pt, index) => {
        diagramCode += getParticipantLine(`${pt.display}${index}`, pt.type);
      });
      diagramCode += `  ${participantTypes[0].display}0 ->> ${participantTypes[1].display}1: Regular message\n`;
      diagramCode += `  Note right of ${participantTypes[1].display}1: Regular note\n`;
      await imgSnapshotTest(page, testInfo, diagramCode, {
        look,
        sequence: {
          actorFontFamily: 'courier',
          actorFontSize: 14,
          messageFontFamily: 'Arial',
          messageFontSize: 12,
          noteFontFamily: 'times',
          noteFontSize: 16,
          noteAlign: 'left',
        },
      });
    });
  });
});

// Additional tests for specific combinations
test.describe('Sequence Diagram Special Cases', () => {
  test('should render complex sequence with all features', async ({ page }, testInfo) => {
    const diagramCode = `
      sequenceDiagram
        box rgb(200,220,255) Authentication
          actor User
          participant LoginUI@{ "type": "boundary" }
          participant AuthService@{ "type": "control" }
          participant UserDB@{ "type": "database" }
        end

        box rgb(200,255,220) Order Processing
          participant Order@{ "type": "entity" }
          participant OrderQueue@{ "type": "queue" }
          participant AuditLogs@{ "type": "collections" }
        end

        User ->> LoginUI: Enter credentials
        LoginUI ->> AuthService: Validate
        AuthService ->> UserDB: Query user
        UserDB -->> AuthService: User data
        alt Valid credentials
          AuthService -->> LoginUI: Success
          LoginUI -->> User: Welcome

          par Place order
            User ->> Order: New order
            Order ->> OrderQueue: Process
            and
            Order ->> AuditLogs: Record
          end

          loop Until confirmed
            OrderQueue ->> Order: Update status
            Order -->> User: Notification
          end
        else Invalid credentials
          AuthService --x LoginUI: Failure
          LoginUI --x User: Retry
        end
    `;
    await imgSnapshotTest(page, testInfo, diagramCode, {});
  });

  test('should render with wrapped messages and notes', async ({ page }, testInfo) => {
    const diagramCode = `
      sequenceDiagram
        participant A
        participant B

        A ->> B: This is a very long message that should wrap properly in the diagram rendering
        Note over A,B: This is a very long note that should also wrap properly when rendered in the diagram

        par Wrapped parallel
          A ->> B: Parallel message 1<br>with explicit line break
          and
          B ->> A: Parallel message 2<br>with explicit line break
        end

        loop Wrapped loop
          Note right of B: This is a long note<br>in a loop
          A ->> B: Message in loop
        end
    `;
    await imgSnapshotTest(page, testInfo, diagramCode, { sequence: { wrap: true } });
  });

  test.describe('svg size', () => {
    test('should render a sequence diagram when useMaxWidth is true (default)', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        actor Alice
        participant Bob@{ "type" : "boundary" }
        participant John@{ "type" : "control" }
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
        else or this
          Alice->>John: No
        else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
          Alice -->> Bob: Parallel message 1
        and
          Alice -->> John: Parallel message 2
        end
      `,
        { sequence: { useMaxWidth: true } }
      );
      const svg = page.locator('svg');
      await expect(svg).toHaveAttribute('width', '100%');
      const style = await svg.getAttribute('style');
      expect(style).toMatch(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).toBeGreaterThanOrEqual(820 * 0.95);
      expect(maxWidthValue).toBeLessThanOrEqual(820 * 1.05);
    });

    test('should render a sequence diagram when useMaxWidth is false', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        actor Alice
        participant Bob@{ "type" : "boundary" }
        participant John@{ "type" : "control" }
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
        else or this
          Alice->>John: No
        else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
          Alice -->> Bob: Parallel message 1
        and
          Alice -->> John: Parallel message 2
        end
      `,
        { sequence: { useMaxWidth: false } }
      );
      const svg = page.locator('svg');
      const width = parseFloat((await svg.getAttribute('width')) ?? '0');
      expect(width).toBeGreaterThanOrEqual(820 * 0.95);
      expect(width).toBeLessThanOrEqual(820 * 1.05);
      await expect(svg).not.toHaveAttribute('style');
    });
  });
});
