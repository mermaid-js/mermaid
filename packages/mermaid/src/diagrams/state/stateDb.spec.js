import stateDb from './stateDb';

describe('stateDb', () => {
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
});
