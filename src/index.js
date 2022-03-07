import { addIgnoredAttribute } from './diffing';
import { createHook, addHooks } from './hooks';
import { enableLifecycle, disableLifecycle } from './lifecycle';
import { html, render } from './main';
import { onBeforeCreation, onAfterCreation } from './preprocess';

// lifecycle is enabled by default
enableLifecycle();

const settings = {
  addIgnoredAttribute,
  onBeforeCreation,
  onAfterCreation,
  disableLifecycle,
};

export { html, render, createHook, addHooks };
export default settings;
