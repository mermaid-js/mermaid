import parentLogger from './logger/logger';
import ZenUml from '@/core';
const logger = parentLogger.child({ name: 'main' });

// find the fist element with tag `pre` and class `zenuml`
const elm = document.querySelector('pre.zenuml');
// get the code from the element
const code =
  elm?.textContent?.trim() ||
  ` 
// comment
A
A.method`;
// @ts-ignore
const zenUml = new ZenUml(elm);
zenUml.render(code, 'theme-default').then((r) => {
  logger.debug('render resolved', r);
});
// @ts-ignore
window.zenUml = zenUml;
// @ts-ignore
window.parentLogger = parentLogger;
