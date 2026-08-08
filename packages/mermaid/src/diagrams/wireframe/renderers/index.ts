import { registry } from './registry.js';
import {
  buttonRenderer,
  textFieldRenderer,
  textAreaRenderer,
  selectFieldRenderer,
  checkboxFieldRenderer,
  checkboxGroupRenderer,
  radioGroupRenderer,
} from './inputs.js';
import {
  sectionRenderer,
  fieldSetRenderer,
  titleWindowRenderer,
  columnsRenderer,
  contentTabsRenderer,
  accordionRenderer,
  tabBarRenderer,
} from './containers.js';
import {
  headingRenderer,
  paragraphRenderer,
  listRenderer,
  treeRenderer,
  menuRenderer,
} from './content.js';
import {
  iconRenderer,
  imageRenderer,
  vRuleRenderer,
  formattingToolbarRenderer,
  canvasRenderer,
} from './graphics.js';

// Register all component renderers
registry.register(buttonRenderer);
registry.register(textFieldRenderer);
registry.register(textAreaRenderer);
registry.register(selectFieldRenderer);
registry.register(checkboxFieldRenderer);
registry.register(checkboxGroupRenderer);
registry.register(radioGroupRenderer);

registry.register(sectionRenderer);
registry.register(fieldSetRenderer);
registry.register(titleWindowRenderer);
registry.register(columnsRenderer);
registry.register(contentTabsRenderer);
registry.register(accordionRenderer);
registry.register(tabBarRenderer);

registry.register(headingRenderer);
registry.register(paragraphRenderer);
registry.register(listRenderer);
registry.register(treeRenderer);
registry.register(menuRenderer);

registry.register(iconRenderer);
registry.register(imageRenderer);
registry.register(vRuleRenderer);
registry.register(formattingToolbarRenderer);
registry.register(canvasRenderer);

export * from './types.js';
export * from './registry.js';
