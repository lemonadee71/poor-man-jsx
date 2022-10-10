import { define, remove } from './custom-components';
import { html, render, apply } from './main';
import { createHook, unwatch, watch } from './hooks';
import { enableLifecycle, disableLifecycle } from './lifecycle';
import { addDirective, removeDirective, lifecycle } from './plugin';

enableLifecycle();

/**
 * The global settings for poor-man-jsx
 */
const PoorManJSX = {
  disableLifecycle,
  addDirective,
  removeDirective,
  ...lifecycle,
  customComponents: { define, remove },
};

export { html, render, apply, createHook, watch, unwatch };
export default PoorManJSX;
