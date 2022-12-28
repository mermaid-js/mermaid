import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Statement from './Statement.vue';
import { VueSequence } from '../../../../../../index';

const localVue = createLocalVue();
localVue.use(Vuex);

function renderCode(code) {
  const storeConfig = VueSequence.Store();
  storeConfig.state.code = code;

  const store = new Vuex.Store(storeConfig);
  return shallowMount(Statement, {
    store,
    localVue,
    propsData: {
      context: store.getters.rootContext.block().stat()[0],
    },
  });
}

describe('Statement', () => {
  test.each([
    ['// comment \n A->B:m', ' comment', undefined],
    ['// [red] comment \n A->B:m', '  comment', 'red'],
  ])('code %s', function (code, text, color) {
    const wrapper = renderCode(code);
    expect(wrapper.vm.commentObj).toEqual({ text: text, color: color });
  });
});
