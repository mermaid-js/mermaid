import Vue from 'vue';
import Vuex from 'vuex';
import DiagramFrame from './components/DiagramFrame/DiagramFrame.vue';
import SeqDiagram from './components/DiagramFrame/SeqDiagram/SeqDiagram.vue';

import './assets/tailwind.css';
import './components/Cosmetic.scss';
import './components/Cosmetic-blue.scss';
import './components/Cosmetic-black-white.scss';
import './components/Cosmetic-star-uml.scss';
import './components/theme-blue-river.scss';

import Store from './store/Store';

// @ts-ignore
const Version = import.meta.env.VERSION || '';
// @ts-ignore
const BuildTime = import.meta.env.BUILD_TIME || '';
const VueSequence = {
  Vue,
  Vuex,
  Version,
  BuildTime,
  Store,
  SeqDiagram,
  DiagramFrame,
};
export { VueSequence };
