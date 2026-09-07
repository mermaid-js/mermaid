import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

const looks = ['neo'];
const themes = ['neo', 'neo-dark', 'redux', 'redux-dark'];

// State diagram feature sets to test
const stateFeatureSets = [
  {
    name: 'Basic States',
    states: ['State1', 'State2', 'State3', 'State4', 'State5'],
  },
  {
    name: 'States with Descriptions',
    states: [
      'State1: Description 1',
      'State2: Description 2',
      'State3: Description 3',
      'State4: Description 4',
    ],
  },
  {
    name: 'Special State Types',
    code: `stateDiagram-v2
    state fork_state <<fork>>
    [*] --> fork_state
    fork_state --> State2
    fork_state --> State3

    state join_state <<join>>
    State2 --> join_state
    State3 --> join_state
    join_state --> State4
    State4 --> [*]`,
  },
  {
    name: 'Composite States',
    code: `stateDiagram-v2
    [*] --> Active
    state Active {
      [*] --> Running
      Running --> Paused
      Paused --> Running
      Running --> [*]
    }
    Active --> Inactive
    Inactive --> [*]`,
  },
  {
    name: 'Concurrent States',
    code: `stateDiagram-v2
    [*] --> Active
    state Active {
      [*] --> NumLockOff
      NumLockOff --> NumLockOn
      NumLockOn --> NumLockOff
      --
      [*] --> CapsLockOff
      CapsLockOff --> CapsLockOn
      CapsLockOn --> CapsLockOff
    }`,
  },
];

test.describe('State diagram classic look and default theme', () => {
  test('should render a simple state diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `stateDiagram-v2
    [*] --> State1
    State1 --> State2
    State2 --> [*]`,
      { look: 'classic', theme: 'default' }
    );
  });
});

looks.forEach((look) => {
  themes.forEach((theme) => {
    stateFeatureSets.forEach((featureSet, setIndex) => {
      test.describe(`Test ${featureSet.name} in ${look} look and ${theme} theme`, () => {
        test(`should render ${featureSet.name}`, async ({ page }, testInfo) => {
          let stateDiagramCode;
          if (featureSet.states) {
            stateDiagramCode = `stateDiagram-v2\n    [*] --> ${featureSet.states[0].split(':')[0]}\n`;
            for (let i = 0; i < featureSet.states.length; i++) {
              for (let j = i + 1; j < featureSet.states.length; j++) {
                const state1 = featureSet.states[i].split(':')[0];
                const state2 = featureSet.states[j].split(':')[0];
                stateDiagramCode += `    ${state1} --> ${state2}\n`;
              }
            }
            featureSet.states.forEach((state) => {
              if (state.includes(':')) {
                stateDiagramCode += `    state ${state}\n`;
              }
            });
            stateDiagramCode += `    ${featureSet.states[featureSet.states.length - 1].split(':')[0]} --> [*]`;
          } else if (featureSet.code) {
            stateDiagramCode = featureSet.code;
          }
          await imgSnapshotTest(page, testInfo, stateDiagramCode, { look, theme });
        });
      });
    });

    test.describe(`State diagram ${look} look and ${theme} theme - Additional Tests`, () => {
      test('should render a simple state diagram', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `stateDiagram
    [*] --> State1
    State1 --> [*]`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      test('should render a state with a note', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `stateDiagram
    State1: The state with a note
    note right of State1
      Important information! You can write
      notes.
    end note`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      test('should render transitions with labels', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `stateDiagram
    [*] --> State1
    State1 --> State2 : Transition 1
    State1 --> State3 : Transition 2
    State1 --> State4 : Transition 3
    State1 --> State5 : Transition 4
    State2 --> State3 : Transition 5
    State1 --> [*]`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });
    });
  });
});
