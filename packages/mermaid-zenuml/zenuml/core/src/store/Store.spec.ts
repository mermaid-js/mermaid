import Store from './Store';

describe('Store', () => {
  it('should create an instance', () => {
    expect(Store().state.showTips).toBeDefined();
    expect(Store().state.showTips).toBeFalsy();
  });
});
