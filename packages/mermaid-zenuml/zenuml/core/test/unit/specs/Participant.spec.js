import { describe, expect, it } from 'vitest';
import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { VueSequence } from '../../../src/index';
import Participant from '../../../src/components/DiagramFrame/SeqDiagram/LifeLineLayer/Participant.vue';
const localVue = createLocalVue();
localVue.use(Vuex);
const storeConfig = VueSequence.Store();
storeConfig.state.code = 'abc';

const store = new Vuex.Store(storeConfig);
describe('select a participant', () => {
  it('For VM and HTML and store', async () => {
    store.state.firstInvocations = {
      A: {
        top: 3,
      },
    };
    const propsData = { entity: { name: 'A' } };
    let participantWrapper = mount(Participant, { store, localVue, propsData });
    expect(participantWrapper.vm.selected).toBeFalsy();
    expect(participantWrapper.find('.selected').exists()).toBeFalsy();

    participantWrapper.find('.participant').trigger('click');
    expect(participantWrapper.vm.selected).toBeTruthy();
    await participantWrapper.vm.$nextTick();
    expect(store.state.selected).toContain('A');
    expect(participantWrapper.find('.selected').exists()).toBeTruthy();

    participantWrapper.find('.participant').trigger('click');
    expect(participantWrapper.vm.selected).toBeFalsy();
    await participantWrapper.vm.$nextTick();
    expect(store.state.selected.includes('A')).toBeFalsy();
    expect(participantWrapper.find('.selected').exists()).toBeFalsy();
  });
});
