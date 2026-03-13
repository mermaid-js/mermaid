import { imgSnapshotTest } from '../../helpers/util.ts';

const looks = ['neo', 'classic'];
const themes = ['neo', 'neo-dark', 'redux', 'redux-dark', 'redux-color', 'redux-dark-color'];

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
    [*] --> State1
    State1 --> fork_state
    state fork_state <<fork>>
    fork_state --> State2
    fork_state --> State3
    state join_state <<join>>
    State2 --> join_state
    State3 --> join_state
    join_state --> choice_state
    state choice_state <<choice>>
    choice_state --> State4
    choice_state --> State5
    State4 --> [*]
    State5 --> [*]`,
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

looks.forEach((look) => {
  themes.forEach((theme) => {
    stateFeatureSets.forEach((featureSet, setIndex) => {
      describe(`Test ${featureSet.name} in ${look} look and ${theme} theme - set ${setIndex + 1}`, () => {
        it(`should render ${featureSet.name}`, () => {
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
          imgSnapshotTest(stateDiagramCode, { look, theme });
        });
      });
    });

    describe(`State diagram ${look} look and ${theme} theme - Additional Tests`, () => {
      it('should render a simple info', () => {
        imgSnapshotTest(`info`, { logLevel: 1, fontFamily: 'courier', look, theme });
      });

      it('should render a simple state diagrams', () => {
        imgSnapshotTest(
          `stateDiagram
    [*] --> State1
    State1 --> [*]`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a long descriptions instead of id when available', () => {
        imgSnapshotTest(
          `stateDiagram
      [*] --> S1
      state "Some long name" as S1`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a long descriptions with additional descriptions', () => {
        imgSnapshotTest(
          `stateDiagram
      [*] --> S1
      state "Some long name" as S1: The description`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a single state with short descriptions', () => {
        imgSnapshotTest(
          `stateDiagram
      state "A long long name" as long1
      state "A" as longlonglongid`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a transition descriptions with new lines', () => {
        imgSnapshotTest(
          `stateDiagram
      [*] --> S1
      S1 --> S2: long line using<br/>should work
      S1 --> S3: long line using <br>should work
      S1 --> S4: long line using \\nshould work`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a state with a note', () => {
        imgSnapshotTest(
          `stateDiagram
    State1: The state with a note
    note right of State1
      Important information! You can write
      notes.
    end note`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a state with on the left side when so specified', () => {
        imgSnapshotTest(
          `stateDiagram
    State1: The state with a note with minus - and plus + in it
    note left of State1
      Important information! You can write
      notes with . and  in them.
    end note`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a state with a note together with another state', () => {
        imgSnapshotTest(
          `stateDiagram
    State1: The state with a note +,-
    note right of State1
      Important information! You can write +,-
      notes.
    end note
    State1 --> State2 : With +,-
    note left of State2 : This is the note +,-<br/>`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a note with multiple lines in it', () => {
        imgSnapshotTest(
          `stateDiagram
    State1: The state with a note
    note right of State1
      Important information! You\\ncan write
      notes with multiple lines...
      Here is another line...
      And another line...
    end note`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should handle multiline notes with different line breaks', () => {
        imgSnapshotTest(
          `stateDiagram
      State1
      note right of State1
      Line1<br>Line2<br/>Line3<br />Line4<br/>Line5
      end note`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a states with descriptions including multi-line descriptions', () => {
        imgSnapshotTest(
          `stateDiagram
    State1: This a single line description
    State2: This a multi line description
    State2: here comes the multi part
    [*] --> State1
    State1 --> State2
    State2 --> [*]`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a simple state diagrams 2', () => {
        imgSnapshotTest(
          `stateDiagram
    [*] --> State1
    State1 --> State2
    State1 --> State3
    State1 --> [*]`,
          { logLevel: 0, fontFamily: 'courier', look, theme }
        );
      });

      it('should render a simple state diagrams with labels', () => {
        imgSnapshotTest(
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
