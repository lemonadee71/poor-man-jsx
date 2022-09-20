import { define, remove } from './custom-components';
import { html, render, apply } from './main';
import { createHook } from './hooks';
import { enableLifecycle } from './lifecycle';

enableLifecycle();

/**
 * The global settings for poor-man-jsx
 */
const PoorManJSX = {
  /**
   * Settings for custom components
   */
  customComponents: { define, remove },
};

export { html, render, apply, createHook };
export default PoorManJSX;
