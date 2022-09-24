import { define, remove } from './custom-components';
import { addDirective, removeDirective } from './directives';
import { html, render, apply } from './main';
import { createHook } from './hooks';
import { enableLifecycle, disableLifecycle } from './lifecycle';
import { addPreprocessor, removePreprocessor } from './preprocess';

enableLifecycle();

/**
 * The global settings for poor-man-jsx
 */
const PoorManJSX = {
  disableLifecycle,
  plugins: {
    addPreprocessor,
    removePreprocessor,
    addDirective,
    removeDirective,
  },
  customComponents: { define, remove },
};

export { html, render, apply, createHook };
export default PoorManJSX;
