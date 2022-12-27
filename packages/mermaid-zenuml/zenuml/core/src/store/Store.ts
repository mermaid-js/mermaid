import now from 'lodash/now';
import debounce from 'lodash/debounce';
import { RootContext, Participants, GroupContext, ParticipantContext } from '../parser/index.js';

import WidthProviderOnBrowser from '@/positioning/WidthProviderFunc';
import { Coordinates } from '@/positioning/Coordinates';
import { CodeRange } from '@/parser/CodeRange';

let storeInitiationTime: number = 0;
setTimeout(function () {
  if (!storeInitiationTime) {
    console.warn('[vue-sequence] Store is a function and is not initiated in 1 second.');
  }
}, 1000);

export interface Warning {
  title: string;
  message: string;
}

export interface StoreState {
  warning: Warning | undefined;
  code: string;
  scale: number;
  selected: any[];
  cursor: any;
  showTips: boolean;
  onElementClick: (codeRange: CodeRange) => void;
}

const Store = (debounceTime?: number) => {
  storeInitiationTime = now();
  return {
    state: {
      warning: undefined,
      code: '',
      theme: 'naked',
      scale: 1,
      selected: [],
      cursor: null,
      showTips: false,
      onElementClick: (codeRange: CodeRange) => {
        console.log('Element clicked', codeRange);
      },
    } as StoreState,
    getters: {
      rootContext: (state: any) => {
        return RootContext(state.code);
      },
      title: (state: any, getters: any) => {
        return getters.rootContext?.title()?.content();
      },
      participants: (state: any, getters: any) => {
        return Participants(getters.rootContext, true);
      },
      coordinates: (state: any, getters: any) => {
        return new Coordinates(getters.rootContext, WidthProviderOnBrowser);
      },
      centerOf: (state: any, getters: any) => (entity: any) => {
        if (!entity) {
          console.error('[vue-sequence] centerOf: entity is undefined');
          return 0;
        }
        try {
          return getters.coordinates.getPosition(entity) || 0;
        } catch (e) {
          console.error(e);
          return 0;
        }
      },
      GroupContext: () => GroupContext,
      ParticipantContext: () => ParticipantContext,
      cursor: (state: any) => state.cursor,
      // deprecated, use distances that returns centerOf(to) - centerOf(from)
      distance: (state: any, getters: any) => (from: any, to: any) => {
        return getters.centerOf(from) - getters.centerOf(to);
      },
      distance2: (state: any, getters: any) => (from: any, to: any) => {
        if (!from || !to) return 0;
        return getters.centerOf(to) - getters.centerOf(from);
      },
      onElementClick: (state: any) => state.onElementClick,
    },
    mutations: {
      code: function (state: any, payload: any) {
        state.code = payload;
      },
      setScale: function (state: any, payload: any) {
        state.scale = payload;
      },
      onSelect: function (state: any, payload: any) {
        if (state.selected.includes(payload)) {
          state.selected = state.selected.filter((p: any) => p !== payload);
        } else {
          state.selected.push(payload);
        }
      },
      cursor: function (state: any, payload: any) {
        state.cursor = payload;
      },
    },
    actions: {
      // Why debounce is here instead of mutation 'code'?
      // Both code and cursor must be mutated together, especially during typing.
      updateCode: debounce(function ({ commit, getters }: any, payload: any) {
        if (typeof payload === 'string') {
          throw Error(
            'You are using a old version of vue-sequence. New version requires {code, cursor}.'
          );
        }
        commit('code', payload.code);
      }, debounceTime || 1000),
    },
    // TODO: Enable strict for development?
    strict: false,
  };
};
export default Store;
