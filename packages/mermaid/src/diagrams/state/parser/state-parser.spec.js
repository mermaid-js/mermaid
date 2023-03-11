import stateDb from '../stateDb.js';
import stateDiagram from './stateDiagram.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('state parser can parse...', () => {
  beforeEach(function () {
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  describe('states with id displayed as a (name)', () => {
    describe('syntax 1: stateID as "name in quotes"', () => {
      it('stateID as "some name"', () => {
        const diagramText = `stateDiagram-v2
        state "Small State 1" as namedState1`;
        stateDiagram.parser.parse(diagramText);
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const states = stateDiagram.parser.yy.getStates();
        expect(states['namedState1']).not.toBeUndefined();
        expect(states['namedState1'].descriptions.join(' ')).toEqual('Small State 1');
      });
    });

    describe('syntax 2: stateID: "name in quotes" [colon after the id]', () => {
      it('space before and after the colon', () => {
        const diagramText = `stateDiagram-v2
        namedState1 : Small State 1`;
        stateDiagram.parser.parse(diagramText);
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const states = stateDiagram.parser.yy.getStates();
        expect(states['namedState1']).not.toBeUndefined();
        expect(states['namedState1'].descriptions.join(' ')).toEqual('Small State 1');
      });

      it('no spaces before and after the colon', () => {
        const diagramText = `stateDiagram-v2
        namedState1:Small State 1`;
        stateDiagram.parser.parse(diagramText);
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const states = stateDiagram.parser.yy.getStates();
        expect(states['namedState1']).not.toBeUndefined();
        expect(states['namedState1'].descriptions.join(' ')).toEqual('Small State 1');
      });
    });
  });

  describe('can handle "as" in a state name', () => {
    it('assemble, assemblies, state assemble, state assemblies', function () {
      const diagramText = `stateDiagram-v2
      assemble
      assemblies
      state assemble
      state assemblies
      `;
      stateDiagram.parser.parse(diagramText);
      stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
      const states = stateDiagram.parser.yy.getStates();
      expect(states['assemble']).not.toBeUndefined();
      expect(states['assemblies']).not.toBeUndefined();
    });

    it('state "as" as as', function () {
      const diagramText = `stateDiagram-v2
      state "as" as as
      `;
      stateDiagram.parser.parse(diagramText);
      stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
      const states = stateDiagram.parser.yy.getStates();
      expect(states['as']).not.toBeUndefined();
      expect(states['as'].descriptions.join(' ')).toEqual('as');
    });
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

    it('group has a state with stateID AS "state name" and state2ID: "another state name"', () => {
      const diagramText = `stateDiagram-v2
        state "Big State 1" as bigState1 {
            state "inner state 1" as inner1
            inner2: inner state 2
            inner1 --> inner2
        }`;
      stateDiagram.parser.parse(diagramText);
      stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

      const states = stateDiagram.parser.yy.getStates();
      expect(states['bigState1']).not.toBeUndefined();
      expect(states['bigState1'].doc[0].id).toEqual('inner1');
      expect(states['bigState1'].doc[0].description).toEqual('inner state 1');
      expect(states['bigState1'].doc[1].id).toEqual('inner2');
      expect(states['bigState1'].doc[1].description).toEqual('inner state 2');
    });
  });
});
