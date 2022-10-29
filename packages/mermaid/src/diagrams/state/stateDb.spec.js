import stateDb from './stateDb';

describe('State Diagram stateDb', () => {
  beforeEach(() => {
    stateDb.clear();
  });

  describe('addStyleClass', () => {
    it('is added to the list of style classes', () => {
      const newStyleClassId = 'newStyleClass';
      const newStyleClassAttribs = 'font-weight:bold, border:blue;';

      stateDb.addStyleClass(newStyleClassId, newStyleClassAttribs);
      const styleClasses = stateDb.getClasses();
      expect(styleClasses[newStyleClassId].id).toEqual(newStyleClassId);
      expect(styleClasses[newStyleClassId].styles.length).toEqual(2);
      expect(styleClasses[newStyleClassId].styles[0]).toEqual('font-weight:bold');
      expect(styleClasses[newStyleClassId].styles[1]).toEqual('border:blue');
    });
  });

  describe('addDescription to a state', () => {
    beforeEach(() => {
      stateDb.clear();
      stateDb.addState('state1');
    });

    const testStateId = 'state1';

    it('removes only the first leading :', () => {
      const restOfTheDescription = 'rest of the description';
      const oneLeadingColon = `:${restOfTheDescription}`;
      const twoLeadingColons = `::${restOfTheDescription}`;

      stateDb.addDescription(testStateId, restOfTheDescription);
      let states = stateDb.getStates();
      expect(states[testStateId].descriptions[0]).toEqual(restOfTheDescription);

      stateDb.addDescription(testStateId, oneLeadingColon);
      states = stateDb.getStates();
      expect(states[testStateId].descriptions[1]).toEqual(restOfTheDescription);

      stateDb.addDescription(testStateId, twoLeadingColons);
      states = stateDb.getStates();
      expect(states[testStateId].descriptions[2]).toEqual(`:${restOfTheDescription}`);
    });

    it('adds each description to the array of descriptions', () => {
      stateDb.addDescription(testStateId, 'description 0');
      stateDb.addDescription(testStateId, 'description 1');
      stateDb.addDescription(testStateId, 'description 2');

      let states = stateDb.getStates();
      expect(states[testStateId].descriptions.length).toEqual(3);
      expect(states[testStateId].descriptions[0]).toEqual('description 0');
      expect(states[testStateId].descriptions[1]).toEqual('description 1');
      expect(states[testStateId].descriptions[2]).toEqual('description 2');
    });

    it('sanitizes on the description', () => {
      stateDb.addDescription(
        testStateId,
        'desc outside the script <script>the description</script>'
      );
      let states = stateDb.getStates();
      expect(states[testStateId].descriptions[0]).toEqual('desc outside the script ');
    });

    it('adds the description to the state with the given id', () => {
      stateDb.addDescription(testStateId, 'the description');
      let states = stateDb.getStates();
      expect(states[testStateId].descriptions[0]).toEqual('the description');
    });
  });
});
