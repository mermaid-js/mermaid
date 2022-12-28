import vue from 'vue';
import vuex from 'vuex';
import { VueSequence } from './index';
vue.use(vuex);

describe('index (store)', () => {
  it('should have title', () => {
    const storeInstance = VueSequence.Store();
    const store = new vuex.Store(storeInstance);
    store.commit('code', 'title abcd');
    expect(store.state.code).toBe('title abcd');
    expect(store.getters.title).toBe('abcd');
  });

  it('may not have title', () => {
    const storeInstance = VueSequence.Store();
    const store = new vuex.Store(storeInstance);
    store.commit('code', 'title ');
    expect(store.state.code).toBe('title ');
    expect(store.getters.title).toBe('');

    store.commit('code', 'A.m');
    expect(store.state.code).toBe('A.m');
    expect(store.getters.title).toBeUndefined();

    store.commit('code', '');
    expect(store.state.code).toBe('');
    expect(store.getters.title).toBeUndefined();
  });
});
