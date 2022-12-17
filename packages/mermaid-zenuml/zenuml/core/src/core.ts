import parentLogger from './logger/logger';
import Vue from 'vue';
import Vuex from 'vuex';
import Store from './store/Store';
import DiagramFrame from '@/components/DiagramFrame/DiagramFrame.vue';
import SeqDiagram from '@/components/DiagramFrame/SeqDiagram/SeqDiagram.vue';

import './assets/tailwind.css';
import './components/Cosmetic.scss';
import './components/Cosmetic-blue.scss';
import './components/Cosmetic-black-white.scss';
import './components/Cosmetic-star-uml.scss';
import './components/theme-blue-river.scss';
import './themes/theme-dark.css';

const logger = parentLogger.child({ name: 'core' });

interface IZenUml {
  get code(): string | undefined;
  get theme(): string | undefined;
  // Resolve after rendering is finished.
  render: (code: string | undefined, theme: string | undefined) => Promise<IZenUml>;
}

Vue.use(Vuex);

export default class ZenUml implements IZenUml {
  private readonly el: Element;
  private _code: string | undefined;
  private _theme: string | undefined;
  private readonly store: any;
  private readonly app: any;

  constructor(el: Element, naked: boolean = false) {
    this.el = el;
    this.store = Store();
    this.app = new Vue({
      el: this.el,
      store: new Vuex.Store(this.store),
      render: (h) => h(naked ? SeqDiagram : DiagramFrame),
    });
  }

  // @ts-ignore
  async render(code: string | undefined, theme: string | undefined): Promise<IZenUml> {
    logger.debug('rendering', code, theme);
    this._code = code || this._code;
    this._theme = theme || this._theme;
    // @ts-ignore
    this.store.state.code = this._code;
    // @ts-ignore
    this.store.state.theme = this._theme || 'default';
    await this.app.$nextTick();
    return Promise.resolve(this);
  }

  get code(): string | undefined {
    return this._code;
  }

  get theme(): string | undefined {
    return this._theme;
  }
}
