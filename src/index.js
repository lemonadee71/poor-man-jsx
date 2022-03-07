import { addIgnoredAttribute } from './diffing';
import { createHook, addHooks } from './hooks';
import { enableLifecycle, disableLifecycle } from './lifecycle';
import { html, render } from './main';
import { addPreprocessor, removePreprocessor } from './preprocess';

// lifecycle is enabled by default
enableLifecycle();

const settings = {
  addIgnoredAttribute,
  addPreprocessor,
  removePreprocessor,
  disableLifecycle,
};

export { html, render, createHook, addHooks };
export default settings;
