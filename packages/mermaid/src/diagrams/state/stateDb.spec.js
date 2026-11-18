import { StateDB } from './stateDb.js';

describe('State Diagram stateDb', () => {
  let stateDb;
  beforeEach(() => {
    stateDb = new StateDB(1);
  });

  describe('addStyleClass', () => {
    it('is added to the list of style classes', () => {
      const newStyleClassId = 'newStyleClass';
      const newStyleClassAttribs = 'font-weight:bold, border:blue;';

      stateDb.addStyleClass(newStyleClassId, newStyleClassAttribs);
      const styleClasses = stateDb.getClasses();
      expect(styleClasses.get(newStyleClassId).id).toEqual(newStyleClassId);
      expect(styleClasses.get(newStyleClassId).styles.length).toEqual(2);
      expect(styleClasses.get(newStyleClassId).styles[0]).toEqual('font-weight:bold');
      expect(styleClasses.get(newStyleClassId).styles[1]).toEqual('border:blue');
    });

    it('removes the first ; of each style attribute', () => {
      // What `attrib.replace(/([^;]*);/, '$1')` did before #5958; kept as the oracle.
      const legacyFix = (attrib) => attrib.replace(/([^;]*);/, '$1').trim();
      const attribs = [
        'fill:#f96',
        'stroke:#333;',
        ' stroke-width:2px;; ',
        ';font-weight:bold',
        ';',
        '',
      ];

      stateDb.addStyleClass('newStyleClass', attribs.join(','));

      const { styles } = stateDb.getClasses().get('newStyleClass');
      expect(styles).toEqual([
        'fill:#f96',
        'stroke:#333',
        'stroke-width:2px;',
        'font-weight:bold',
        '',
        '',
      ]);
      expect(styles).toEqual(attribs.map(legacyFix));
    });

    it('scales linearly with the length of a style attribute', () => {
      // Same measurement as in regexes.spec.ts: the minimum over a few trials, because noise on
      // a shared runner only ever adds time.
      const fastestRun = (run, trials = 5, iterations = 5) => {
        let fastest = Infinity;
        for (let trial = 0; trial < trials; trial++) {
          const t0 = performance.now();
          for (let i = 0; i < iterations; i++) {
            run();
          }
          fastest = Math.min(fastest, (performance.now() - t0) / iterations);
        }
        return fastest;
      };
      const measure = (n) => {
        // No ; anywhere, so the old expression retried its greedy match from every position.
        const attrib = 'fill:' + 'a'.repeat(n);
        new StateDB(1).addStyleClass('warmUp', attrib);
        return fastestRun(() => new StateDB(1).addStyleClass('newStyleClass', attrib));
      };

      const small = measure(5000);
      const large = measure(20000);

      // 4x the input. Linear predicts ~4x, quadratic ~16x.
      expect(large / Math.max(small, 0.01)).toBeLessThan(8);
    });
  });

  describe('addDescription to a state', () => {
    let stateDb;
    beforeEach(() => {
      stateDb = new StateDB(1);
      stateDb.addState('state1');
    });

    const testStateId = 'state1';

    it('removes only the first leading :', () => {
      const restOfTheDescription = 'rest of the description';
      const oneLeadingColon = `:${restOfTheDescription}`;
      const twoLeadingColons = `::${restOfTheDescription}`;

      stateDb.addDescription(testStateId, restOfTheDescription);
      let states = stateDb.getStates();
      expect(states.get(testStateId).descriptions[0]).toEqual(restOfTheDescription);

      stateDb.addDescription(testStateId, oneLeadingColon);
      states = stateDb.getStates();
      expect(states.get(testStateId).descriptions[1]).toEqual(restOfTheDescription);

      stateDb.addDescription(testStateId, twoLeadingColons);
      states = stateDb.getStates();
      expect(states.get(testStateId).descriptions[2]).toEqual(`:${restOfTheDescription}`);
    });

    it('adds each description to the array of descriptions', () => {
      stateDb.addDescription(testStateId, 'description 0');
      stateDb.addDescription(testStateId, 'description 1');
      stateDb.addDescription(testStateId, 'description 2');

      let states = stateDb.getStates();
      expect(states.get(testStateId).descriptions.length).toEqual(3);
      expect(states.get(testStateId).descriptions[0]).toEqual('description 0');
      expect(states.get(testStateId).descriptions[1]).toEqual('description 1');
      expect(states.get(testStateId).descriptions[2]).toEqual('description 2');
    });

    it('sanitizes on the description', () => {
      stateDb.addDescription(
        testStateId,
        'desc outside the script <script>the description</script>'
      );
      let states = stateDb.getStates();
      expect(states.get(testStateId).descriptions[0]).toEqual('desc outside the script ');
    });

    it('adds the description to the state with the given id', () => {
      stateDb.addDescription(testStateId, 'the description');
      let states = stateDb.getStates();
      expect(states.get(testStateId).descriptions[0]).toEqual('the description');
    });
  });
});

describe('state db class', () => {
  let stateDb;
  beforeEach(() => {
    stateDb = new StateDB(1);
  });
  // This is to ensure that functions used in state JISON are exposed as function from StateDb
  it('should have functions used in flow JISON as own property', () => {
    const functionsUsedInParser = [
      'setRootDoc',
      'trimColon',
      'getDividerId',
      'setAccTitle',
      'setAccDescription',
      'setDirection',
    ];

    for (const fun of functionsUsedInParser) {
      expect(Object.hasOwn(stateDb, fun)).toBe(true);
    }
  });
});
