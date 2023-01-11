import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { VueSequence } from '../../../../index';
import MessageLayer from './MessageLayer.vue';
import Block from './Block/Block.vue';
import { ProgContextFixture } from '../../../../parser/ContextsFixture';
const storeConfig = VueSequence.Store();
storeConfig.state.code = 'a';
storeConfig.getters.centerOf = function () {
  return (p) => (p === 'a' ? 100 : NaN);
};

const store = createStore(storeConfig);

describe('MessageLayer', () => {
  let messageLayerWrapper = shallowMount(MessageLayer, {
    global: {
      plugins: [store],
    },
    props: {
      context: ProgContextFixture('A->B.method()').block(),
    },
    components: {
      Block,
    },
  });
  it('should have a width', async () => {
    expect(messageLayerWrapper.find('.message-layer').exists()).toBeTruthy();
    // We do not need to wait until next tick in **test**.
    // await messageLayerWrapper.vm.$nextTick()
    expect(messageLayerWrapper.find('.pt-24').exists()).toBeTruthy();
  });
  it('gets participant names', async () => {
    expect(messageLayerWrapper.vm.participantNames()[0]).toBe('a');
  });
});
