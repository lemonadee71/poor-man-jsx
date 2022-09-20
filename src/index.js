import { define, remove } from './custom-components';
import { addDirective } from './directives';
import { html, render, apply } from './main';
import { createHook } from './hooks';
import { enableLifecycle } from './lifecycle';
import { addPreprocessor, removePreprocessor } from './preprocess';

enableLifecycle();

/**
 * The global settings for poor-man-jsx
 */
const PoorManJSX = {
  plugins: {
    addPreprocessor,
    removePreprocessor,
    addDirective,
  },
  customComponents: { define, remove },
};

export { html, render, apply, createHook };
export default PoorManJSX;
