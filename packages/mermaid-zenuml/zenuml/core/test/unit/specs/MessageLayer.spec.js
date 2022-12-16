import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { VueSequence } from '@/index';
import MessageLayer from '@/components/DiagramFrame/SeqDiagram/MessageLayer/MessageLayer.vue';
const localVue = createLocalVue();
localVue.use(Vuex);
const storeConfig = VueSequence.Store();
storeConfig.state.code = 'a';
storeConfig.getters.centerOf = function () {
  return (p) => (p === 'a' ? 100 : NaN);
};

const store = new Vuex.Store(storeConfig);

describe('MessageLayer', () => {
  let messageLayerWrapper = mount(MessageLayer, { store, localVue });
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
