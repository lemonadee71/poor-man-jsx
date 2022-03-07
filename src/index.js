import { addIgnoredAttribute } from './diffing';
import { createHook, addHooks } from './hooks';
import { enableLifecycle, disableObserver } from './lifecycle';
import { html, render } from './main';
import { addPreprocessor, removePreprocessor } from './preprocess';

// lifecycle is enabled by default
enableLifecycle();

const settings = {
  addIgnoredAttribute,
  addPreprocessor,
  removePreprocessor,
  disableObserver,
};

export { html, render, createHook, addHooks };
export default settings;
