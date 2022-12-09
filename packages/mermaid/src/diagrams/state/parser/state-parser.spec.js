import stateDb from '../stateDb';
import stateDiagram from './stateDiagram';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict',
});

describe('state parser can parse...', () => {
  beforeEach(function () {
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  describe('groups (clusters/containers)', () => {
    it('state "Group Name" as stateIdentifier', () => {
      const diagramText = `stateDiagram-v2
        state "Small State 1" as namedState1
        %% Notice that this is named "Big State 1" with an "as"
        state "Big State 1" as bigState1 {
            bigState1InternalState
        }
        namedState1 --> bigState1: should point to \\nBig State 1 container

        state "Small State 2" as namedState2
        %% Notice that bigState2 does not have a name; no "as"
        state bigState2 {
            bigState2InternalState
        }
        namedState2 --> bigState2: should point to \\nbigState2 container`;

      stateDiagram.parser.parse(diagramText);
      stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

      const states = stateDiagram.parser.yy.getStates();
      expect(states['namedState1']).not.toBeUndefined();
      expect(states['bigState1']).not.toBeUndefined();
      expect(states['bigState1'].doc[0].id).toEqual('bigState1InternalState');
      expect(states['namedState2']).not.toBeUndefined();
      expect(states['bigState2']).not.toBeUndefined();
      expect(states['bigState2'].doc[0].id).toEqual('bigState2InternalState');
      const relationships = stateDiagram.parser.yy.getRelations();
      expect(relationships[0].id1).toEqual('namedState1');
      expect(relationships[0].id2).toEqual('bigState1');
      expect(relationships[1].id1).toEqual('namedState2');
      expect(relationships[1].id2).toEqual('bigState2');
    });
  });
});
