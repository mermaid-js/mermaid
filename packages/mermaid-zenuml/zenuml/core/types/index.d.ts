import { VueConstructor } from 'vue';

interface VueSequence {
  Version: string;
  BuildTime: string;
  Store: any;
  SeqDiagram: VueConstructor;
  DiagramFrame: VueConstructor;
}

declare module '*.vue' {
  const SFC: Vue.Component;
  export default SFC;
}

declare module '*.vue' {
  import Vue from 'vue';
  // noinspection JSDuplicatedDeclaration
  export default Vue;
}

declare module '@/src/components/*' {
  import Vue from 'vue';
  // noinspection JSDuplicatedDeclaration
  export default Vue;
}

declare module '@/spa/components/*' {
  import Vue from 'vue';
  // noinspection JSDuplicatedDeclaration
  export default Vue;
}

export const VueSequence: VueSequence;
