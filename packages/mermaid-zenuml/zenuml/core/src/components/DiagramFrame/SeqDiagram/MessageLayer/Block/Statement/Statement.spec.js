import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Statement from './Statement.vue';
import { VueSequence } from '../../../../../../index';

function renderCode(code) {
  const storeConfig = VueSequence.Store();
  storeConfig.state.code = code;

  const store = new createStore(storeConfig);
  return shallowMount(Statement, {
    global: {
      plugins: [store],
    },
    props: {
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
