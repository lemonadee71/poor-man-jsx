import { html, render, apply, createElementFromTemplate } from './main';
import { createHook, unwatch, watch } from './hooks';
import { enableLifecycle, disableLifecycle } from './lifecycle';
import { addDirective, removeDirective, lifecycle } from './plugin';
import { getPlaceholderId, escapeHTML, unescapeHTML } from './utils/general';
import { uid, hash } from './utils/id';
import * as is from './utils/is';
import isPlainObject from './utils/is-plain-obj';
import { setMetadata } from './utils/meta';

enableLifecycle();

const plugins = {};

/**
 * Extend `PoorManJSX.plugins`
 * @param {string} name - the id of the plugin
 * @param {any} config - the functions to expose through `PoorManJSX.plugins[name]`
 */
const mount = (name, config) => {
  if (name in plugins) throw new Error(`${name} is already taken`);

  const copy = { ...config };
  delete copy._init;
  plugins[name] = copy;
  config._init?.call?.(this);
};

/**
 * The global settings for poor-man-jsx
 */
const PoorManJSX = {
  plugins,
  mount,
  addDirective,
  removeDirective,
  ...lifecycle,
  disableLifecycle,
  // expose some internal utils for plugins to use
  utils: {
    uid,
    hash,
    getPlaceholderId,
    escapeHTML,
    unescapeHTML,
    setMetadata,
    isPlainObject,
    ...is,
  },
};

export {
  html,
  render,
  apply,
  createElementFromTemplate,
  createHook,
  watch,
  unwatch,
};
export default PoorManJSX;
