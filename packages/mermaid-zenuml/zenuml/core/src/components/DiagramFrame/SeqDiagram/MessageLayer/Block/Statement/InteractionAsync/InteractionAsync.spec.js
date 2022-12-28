import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import InteractionAsync from './Interaction-async.vue';
import { VueSequence } from '../../../../../../../index';

const localVue = createLocalVue();
localVue.use(Vuex);

function renderCode(code) {
  const storeConfig = VueSequence.Store();
  storeConfig.state.code = code;

  const store = new Vuex.Store(storeConfig);
  return shallowMount(InteractionAsync, {
    store,
    localVue,
    propsData: {
      context: store.getters.rootContext.block().stat()[0],
    },
  });
}

describe('Async Call', () => {
  // A -> B: m
  test.each([
    // A --- ?px ---> B
    ['A->B:m', 'A', 'B', 'm', false],
    ['A->A:m', 'A', 'A', 'm', true],
    // [ 'B:m',  'Starter', 'B', 'm', false], // Removed support of 'B:m'. This is confusing and dramatically increase parsing time (13 times slower)
  ])('code %s', function (code, source, target, message, isSelf) {
    const wrapper = renderCode(code);
    expect(wrapper.vm.source).toBe(source);
    expect(wrapper.vm.target).toBe(target);
    expect(wrapper.vm.signature).toBe(message);
    expect(wrapper.vm.isSelf).toBe(isSelf);
  });
});
