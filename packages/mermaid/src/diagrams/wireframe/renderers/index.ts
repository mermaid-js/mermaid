import { registry } from './registry.js';
import {
  buttonRenderer,
  textFieldRenderer,
  multiFieldRenderer,
  textAreaRenderer,
  selectFieldRenderer,
  comboBoxRenderer,
  checkboxFieldRenderer,
  checkboxGroupRenderer,
  radioGroupRenderer,
} from './inputs.js';
import {
  sectionRenderer,
  fieldSetRenderer,
  titleWindowRenderer,
  columnsRenderer,
  colBlockRenderer,
  contentTabsRenderer,
  tabPaneRenderer,
  accordionRenderer,
  tabBarRenderer,
} from './containers.js';
import {
  headingRenderer,
  subTitleRenderer,
  paragraphRenderer,
  labelRenderer,
  richTextRenderer,
  textElementRenderer,
  listRenderer,
  treeRenderer,
  menuRenderer,
} from './content.js';
import {
  iconRenderer,
  imageRenderer,
  pathFieldRenderer,
  vRuleRenderer,
  arrowRenderer,
  vCurlyRenderer,
  formattingToolbarRenderer,
  canvasRenderer,
} from './graphics.js';

// Register all component renderers
registry.register(buttonRenderer);
registry.register(textFieldRenderer);
registry.register(multiFieldRenderer);
registry.register(textAreaRenderer);
registry.register(selectFieldRenderer);
registry.register(comboBoxRenderer);
registry.register(checkboxFieldRenderer);
registry.register(checkboxGroupRenderer);
registry.register(radioGroupRenderer);

registry.register(sectionRenderer);
registry.register(fieldSetRenderer);
registry.register(titleWindowRenderer);
registry.register(columnsRenderer);
registry.register(colBlockRenderer);
registry.register(contentTabsRenderer);
registry.register(tabPaneRenderer);
registry.register(accordionRenderer);
registry.register(tabBarRenderer);

registry.register(headingRenderer);
registry.register(subTitleRenderer);
registry.register(paragraphRenderer);
registry.register(labelRenderer);
registry.register(richTextRenderer);
registry.register(textElementRenderer);
registry.register(listRenderer);
registry.register(treeRenderer);
registry.register(menuRenderer);

registry.register(iconRenderer);
registry.register(imageRenderer);
registry.register(pathFieldRenderer);
registry.register(vRuleRenderer);
registry.register(arrowRenderer);
registry.register(vCurlyRenderer);
registry.register(formattingToolbarRenderer);
registry.register(canvasRenderer);

export * from './types.js';
export * from './registry.js';
