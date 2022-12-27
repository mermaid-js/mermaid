import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Interaction from './Interaction';
import { VueSequence } from '../../../../../../../index';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Highlight current interact based on position of cursor', () => {
  test.each([
    ['A.bc', null, false],
    ['A.bc', undefined, false],
    ['A.bc', -1, false],
    ['A.bc', 0, true],
    ['A.bc', 1, true],
    ['A.bc', 2, true],
    ['A.bc', 3, true],
    ['A.bc', 4, true],
    ['A.bc', 5, false],
  ])(
    'Interaction: for code: `%s` if cursor is %s then isCurrent will be %s ',
    (code, cursor, isCurrent) => {
      const storeConfig = VueSequence.Store();
      storeConfig.state.cursor = cursor;
      const store = new Vuex.Store(storeConfig);
      store.state.code = code;
      const rootContext = store.getters.rootContext;
      const wrapper = shallowMount(Interaction, {
        store,
        localVue,
        propsData: {
          from: 'A',
          context: rootContext.block().stat()[0],
        },
      });
      expect(wrapper.vm.isCurrent).toBe(isCurrent);
    }
  );
});
describe('Interaction width', () => {
  test.each([
    // A --- ?px ---> B
    [1, 10, 25, 14],
    [1, 25, 10, 16],
  ])(
    'If selfCallIndent is %s and distance is %s, interactionWidth should be %s',
    (selfCallIndent, a, b, width) => {
      Interaction.computed.to = () => 'B';
      const storeConfig = VueSequence.Store();
      storeConfig.getters.centerOf = () => (participant) => {
        if (participant === 'A') return a;
        if (participant === 'B') return b;
      };
      const store = new Vuex.Store(storeConfig);
      const wrapper = shallowMount(Interaction, {
        store,
        localVue,
        propsData: {
          selfCallIndent: selfCallIndent,
        },
        computed: {
          from: function () {
            return 'A';
          },
        },
      });
      expect(wrapper.vm.interactionWidth).toBe(width);
    }
  );
});

describe('Translate X', () => {
  // A          B           C
  // provided   inherited   to
  it('when left to right', function () {
    Interaction.computed.providedFrom = () => 'A';
    Interaction.computed.origin = () => 'B';
    Interaction.computed.to = () => 'C';
    const storeConfig = VueSequence.Store();
    storeConfig.getters.centerOf = () => (participant) => {
      if (participant === 'A') return 10;
      if (participant === 'B') return 25;
      if (participant === 'C') return 35;
    };

    const store = new Vuex.Store(storeConfig);
    const wrapper = shallowMount(Interaction, {
      store,
      localVue,
    });
    expect(wrapper.vm.translateX).toBe(-15);
    expect(wrapper.find('.right-to-left').exists()).toBeFalsy();
  });

  // A      B      C
  // to   real     from
  it('when right to left', function () {
    Interaction.computed.providedFrom = () => 'B';
    Interaction.computed.origin = () => 'C';
    Interaction.computed.to = () => 'A';
    const storeConfig = VueSequence.Store();
    storeConfig.getters.centerOf = () => (participant) => {
      if (participant === 'A') return 10;
      if (participant === 'B') return 25;
      if (participant === 'C') return 35;
    };

    const store = new Vuex.Store(storeConfig);
    const wrapper = shallowMount(Interaction, {
      store,
      localVue,
    });
    expect(wrapper.vm.translateX).toBe(-25);
    expect(wrapper.find('.right-to-left').exists()).toBeTruthy();
  });
});
