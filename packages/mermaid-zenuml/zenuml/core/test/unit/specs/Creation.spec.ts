import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import { VueSequence } from '@/index';
import Creation from '../../../src/components/DiagramFrame/SeqDiagram/MessageLayer/Block/Statement/Creation/Creation.vue';
import { Fixture } from '../parser/fixture/Fixture';

const localVue = createLocalVue();
localVue.use(Vuex);

function mountCreationWithCode(code: string, contextLocator: Function) {
  const storeConfig = VueSequence.Store();
  storeConfig.state.code = code;
  const store = new Vuex.Store(storeConfig);

  let creationContext = contextLocator(code);
  const propsData = {
    context: creationContext,
    fragmentOffset: 100,
  };

  return mount(Creation, { store, localVue, propsData });
}

describe('Creation', () => {
  it('data , props and computed properties', async () => {
    /**
     * Known limitations:
     * 1. `IA a = new A()` cannot be the first statement in the file. `IA` will be recognised as a Participant.
     */
    let creationWrapper = mountCreationWithCode('a = new A', Fixture.firstStatement);

    expect(creationWrapper.vm.from).toBe('_STARTER_');
    expect(creationWrapper.vm.signature).toBe('«create»');
    expect(creationWrapper.vm.assignee).toBe('a');
    expect(creationWrapper.vm.distance).toStrictEqual(expect.any(Function));
    expect(creationWrapper.vm.interactionWidth).toBe(70);
    expect(creationWrapper.vm.rightToLeft).toBeFalsy();
  });

  it('right to left', async () => {
    let creationWrapper = mountCreationWithCode('A.m{B.m{new A}}', Fixture.firstGrandChild);
    expect(creationWrapper.vm.rightToLeft).toBeTruthy();
    expect(creationWrapper.vm.interactionWidth).toBe(120);
  });

  it('right to left within alt fragment', async () => {
    function contextLocator(code: string) {
      return Fixture.firstGrandChild(code).alt().ifBlock().braceBlock().block().stat()[0];
    }
    let creationWrapper = mountCreationWithCode('A.m{B.m{if(x){new A}}}', contextLocator);
    expect(creationWrapper.vm.rightToLeft).toBeTruthy();
    expect(creationWrapper.vm.interactionWidth).toBe(120);
  });
});
